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
import { EstimateFee, number } from 'starknet';
import { ethers } from 'ethers';

export async function createAccount(params: ApiParams) {
  try {
    const { state, wallet, saveMutex, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as CreateAccountRequestParams;

    const addressIndex = getValidNumber(requestParamsObj.addressIndex, -1, 0);
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    const {
      publicKey,
      addressIndex: addressIndexInUsed,
      derivationPath,
      keyPair,
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
    try {
      signer = await getSigner(contractAddress, network);
      console.log(`createAccount:\ngetSigner: contractAddress = ${contractAddress}, signerPublicKey= ${signer}`);
    } catch (err) {
      signerAssigned = false;
      console.log(`createAccount:\ngetSigner: err in get signer: ${JSON.stringify(err)}`);
    }
    if (signerAssigned) {
      failureReason = 'The account address had already been deployed';
    }
    if (requestParamsObj.deploy) {
      try {
        const getBalanceResp = await callContract(
          network,
          getEtherErc20Token(state, network.chainId)?.address,
          'balanceOf',
          [number.toBN(contractAddress).toString(10)],
        );
        console.log(`createAccount:\ngetBalanceResp: ${JSON.stringify(getBalanceResp)}`);
        estimateDeployFee = await estimateAccountDeployFee(
          network,
          contractAddress,
          contractCallData,
          publicKey,
          keyPair,
        );
        console.log(`createAccount:\nestimateDeployFee: ${JSON.stringify(estimateDeployFee)}`);
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

      const deployResp = await deployAccount(
        network,
        contractAddress,
        contractCallData,
        publicKey,
        keyPair,
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

      console.log(`createAccount:\ndeployResp: ${JSON.stringify(deployResp)}`);

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
