import { toJson } from './utils/serializer';
import {
  getKeysFromAddressIndex,
  getAccContractAddressAndCallData,
  deployAccount,
  waitForTransaction,
} from './utils/starknetUtils';
import {
  getNetworkFromChainId,
  getValidNumber,
  upsertAccount,
  upsertTransaction,
  addDialogTxt,
} from './utils/snapUtils';
import { AccContract, VoyagerTransactionType, Transaction, TransactionStatus } from './types/snapState';
import { ApiParams, CreateAccountRequestParams } from './types/snapApi';
import { heading, panel, text, DialogType } from '@metamask/snaps-sdk';
import { logger } from './utils/logger';

/**
 * Create an starknet account.
 *
 * @template Params - The ApiParams of the request.
 * @param silentMode - The flag to disable the confirmation dialog from snap.
 * @param waitMode - The flag to enable an determination by doing an recursive fetch to check if the deploy account status is on L2 or not. The wait mode is only useful when it compose with other txn together, it can make sure the deploy txn execute complete, avoiding the latter txn failed.
 */
export async function createAccount(params: ApiParams, silentMode = false, waitMode = false) {
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
    const { address: contractAddress, callData: contractCallData } = getAccContractAddressAndCallData(publicKey);
    logger.log(
      `createAccount:\ncontractAddress = ${contractAddress}\npublicKey = ${publicKey}\naddressIndex = ${addressIndexInUsed}`,
    );

    if (deploy) {
      if (!silentMode) {
        const components = [];
        addDialogTxt(components, 'Address', contractAddress);
        addDialogTxt(components, 'Public Key', publicKey);
        addDialogTxt(components, 'Address Index', addressIndex.toString());

        const response = await wallet.request({
          method: 'snap_dialog',
          params: {
            type: DialogType.Confirmation,
            content: panel([
              heading('Do you want to sign this deploy account transaction ?'),
              text(`It will be signed with address: ${contractAddress}`),
              ...components,
            ]),
          },
        });
        if (!response)
          return {
            address: contractAddress,
          };
      }

      // Deploy account will auto estimate the fee from the network if not provided
      const deployResp = await deployAccount(network, contractAddress, contractCallData, publicKey, privateKey);

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
          finalityStatus: TransactionStatus.RECEIVED,
          executionStatus: TransactionStatus.RECEIVED,
          status: '',
          failureReason: '',
          eventIds: [],
          timestamp: Math.floor(Date.now() / 1000),
        };

        await upsertTransaction(txn, wallet, saveMutex);
      }

      logger.log(`createAccount:\ndeployResp: ${toJson(deployResp)}`);

      if (waitMode) {
        await waitForTransaction(network, deployResp.contract_address, privateKey, deployResp.transaction_hash);
      }

      return {
        address: deployResp.contract_address,
        transaction_hash: deployResp.transaction_hash,
      };
    }
    return {
      address: contractAddress,
    };
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
