import { toJson } from './utils/serializer';
import {
  getKeysFromAddressIndex,
  getAccContractAddressAndCallData,
  deployAccount,
  callContract,
  estimateAccountDeployFee,
  getSigner,
} from './utils/starknetUtils';
import {
  getEtherErc20Token,
  getNetworkFromChainId,
  getValidNumber,
  upsertAccount,
  upsertTransaction,
} from './utils/snapUtils';
import { AccContract, VoyagerTransactionType, Transaction, TransactionStatus } from './types/snapState';
import { ApiParams, CreateAccountRequestParams } from './types/snapApi';
import { EstimateFee, num } from 'starknet';
import { ethers } from 'ethers';
import { DialogType } from '@metamask/rpc-methods';
import { heading, panel, text } from '@metamask/snaps-ui';

export async function createAccount(params: ApiParams, silentMode = false) {
  try {
    const { state, wallet, saveMutex, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as CreateAccountRequestParams;

    const addressIndex = getValidNumber(requestParamsObj.addressIndex, -1, 0);
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const deploy = !!requestParamsObj.deploy;

    const {
      privateKey,
      publicKey,
      addressIndex: addressIndexInUsed,
      derivationPath,
    } = await getKeysFromAddressIndex(keyDeriver, network.chainId, state, addressIndex);
    const { address: contractAddress, callData: contractCallData } = getAccContractAddressAndCallData(
      network.accountClassHash,
      publicKey,
    );
    console.log(
      `createAccount:\ncontractAddress = ${contractAddress}\npublicKey = ${publicKey}\naddressIndex = ${addressIndexInUsed}`,
    );

    let failureReason = '';
    let estimateDeployFee: EstimateFee;
    let signerAssigned = true;
    let signer = '';

    if (deploy) {
      if (!silentMode) {
        const response = await wallet.request({
          method: 'snap_dialog',
          params: {
            type: DialogType.Confirmation,
            content: panel([
              heading('Do you want to sign this deploy account transaction ?'),
              text(`It will be signed with address: ${contractAddress}`),
              text(
                `Account Info:\n\nAddress: ${contractAddress}\n\nPublic Key: ${publicKey}\n\nAddress Index: ${addressIndex}`,
              ),
            ]),
          },
        });
        if (!response)
          return {
            address: contractAddress,
          };
      }

      try {
        signer = await getSigner(contractAddress, network);
        console.log(`createAccount:\ngetSigner: contractAddress = ${contractAddress}, signerPublicKey= ${signer}`);
        failureReason = 'The account address had already been deployed';
      } catch (err) {
        signerAssigned = false;
        console.log(`createAccount:\ngetSigner: err in get signer: ${toJson(err)}`);
      }

      if (!signerAssigned) {
        try {
          const getBalanceResp = await callContract(
            network,
            getEtherErc20Token(state, network.chainId)?.address,
            'balanceOf',
            [num.toBigInt(contractAddress).toString(10)],
          );
          console.log(`createAccount:\ngetBalanceResp: ${toJson(getBalanceResp)}`);
          estimateDeployFee = await estimateAccountDeployFee(
            network,
            contractAddress,
            contractCallData,
            publicKey,
            privateKey,
          );
          console.log(`createAccount:\nestimateDeployFee: ${toJson(estimateDeployFee)}`);
          if (Number(getBalanceResp.result[0]) < Number(estimateDeployFee.suggestedMaxFee)) {
            const gasFeeStr = ethers.utils.formatUnits(estimateDeployFee.suggestedMaxFee.toString(10), 18);
            const gasFeeFloat = parseFloat(gasFeeStr).toFixed(6); // 6 decimal places for ether
            const gasFeeInEther = Number(gasFeeFloat) === 0 ? '0.000001' : gasFeeFloat;
            failureReason = `The account address needs to hold at least ${gasFeeInEther} ETH for deploy fee`;
          }
        } catch (err) {
          failureReason = 'The account address ETH balance cannot be read';
          console.error(`createAccount: failed to read the ETH balance of ${contractAddress}: ${err}`);
        }
      }

      const deployResp = await deployAccount(
        network,
        contractAddress,
        contractCallData,
        publicKey,
        privateKey,
        estimateDeployFee?.suggestedMaxFee,
      );

      if (deployResp.contract_address && deployResp.transaction_hash) {
        const userAccount: AccContract = {
          addressSalt: publicKey,
          publicKey,
          address: deployResp.contract_address,
          addressIndex: addressIndexInUsed,
          derivationPath,
          deployTxnHash: deployResp.transaction_hash,
          chainId: network.chainId,
        };

        await upsertAccount(userAccount, wallet, saveMutex);

        const txn: Transaction = {
          txnHash: deployResp.transaction_hash,
          txnType: VoyagerTransactionType.DEPLOY_ACCOUNT,
          chainId: network.chainId,
          senderAddress: deployResp.contract_address,
          contractAddress: deployResp.contract_address,
          contractFuncName: '',
          contractCallData: [],
          status: TransactionStatus.RECEIVED,
          failureReason,
          eventIds: [],
          timestamp: Math.floor(Date.now() / 1000),
        };

        await upsertTransaction(txn, wallet, saveMutex);
      }

      console.log(`createAccount:\ndeployResp: ${toJson(deployResp)}`);

      return {
        address: deployResp.contract_address,
        transaction_hash: deployResp.transaction_hash,
      };
    }
    return {
      address: contractAddress,
    };
  } catch (err) {
    console.error(`Problem found: ${err}`);
    throw err;
  }
}
