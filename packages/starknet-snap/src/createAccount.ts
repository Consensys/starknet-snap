import { heading, panel, DialogType } from '@metamask/snaps-sdk';
import type { CairoVersion, EstimateFee } from 'starknet';
import { num as numUtils } from 'starknet';

import type {
  ApiParamsWithKeyDeriver,
  CreateAccountRequestParams,
} from './types/snapApi';
import type { AccContract, Transaction } from './types/snapState';
import { VoyagerTransactionType, TransactionStatus } from './types/snapState';
import { CAIRO_VERSION_LEGACY, CAIRO_VERSION } from './utils/constants';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import {
  getNetworkFromChainId,
  getValidNumber,
  upsertAccount,
  upsertTransaction,
  getSendTxnText,
} from './utils/snapUtils';
import {
  getKeysFromAddressIndex,
  getAccContractAddressAndCallDataLegacy,
  getAccContractAddressAndCallData,
  deployAccount,
  waitForTransaction,
  estimateAccountDeployFee,
} from './utils/starknetUtils';

/**
 * Create an starknet account.
 *
 * @param params - The ApiParams of the request.
 * @param silentMode - The flag to disable the confirmation dialog from snap.
 * @param waitMode - The flag to enable an determination by doing an recursive fetch to check if the deploy account status is on L2 or not. The wait mode is only useful when it compose with other txn together, it can make sure the deploy txn execute complete, avoiding the latter txn failed.
 * @param cairoVersion - The cairo version to use, default use constant CAIRO_VERSION.
 */
export async function createAccount(
  params: ApiParamsWithKeyDeriver,
  silentMode = false,
  waitMode = false,
  cairoVersion: CairoVersion = CAIRO_VERSION,
) {
  try {
    const { state, wallet, saveMutex, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as CreateAccountRequestParams;
    const addressIndex = getValidNumber(requestParamsObj.addressIndex, -1, 0);
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const deploy = Boolean(requestParamsObj.deploy);

    const {
      privateKey,
      publicKey,
      addressIndex: addressIndexInUsed,
      derivationPath,
    } = await getKeysFromAddressIndex(
      keyDeriver,
      network.chainId,
      state,
      addressIndex,
    );
    const { address: contractAddress, callData: contractCallData } =
      cairoVersion === CAIRO_VERSION_LEGACY
        ? getAccContractAddressAndCallDataLegacy(publicKey)
        : getAccContractAddressAndCallData(publicKey);

    logger.log(
      `createAccount:\ncontractAddress = ${contractAddress}\npublicKey = ${publicKey}\naddressIndex = ${addressIndexInUsed}`,
    );

    if (deploy) {
      if (!silentMode) {
        logger.log(
          `estimateAccountDeployFee:\ncontractAddress = ${contractAddress}\npublicKey = ${publicKey}\naddressIndex = ${addressIndexInUsed}`,
        );

        const estimateDeployFee: EstimateFee = await estimateAccountDeployFee(
          network,
          contractAddress,
          contractCallData,
          publicKey,
          privateKey,
          cairoVersion,
        );
        logger.log(
          `estimateAccountDeployFee:\nestimateDeployFee: ${toJson(
            estimateDeployFee,
          )}`,
        );
        const maxFee = numUtils.toBigInt(
          estimateDeployFee.suggestedMaxFee.toString(10) ?? '0',
        );
        const dialogComponents = getSendTxnText(
          state,
          contractAddress,
          'deploy',
          contractCallData,
          contractAddress,
          maxFee,
          network,
        );

        const response = await wallet.request({
          method: 'snap_dialog',
          params: {
            type: DialogType.Confirmation,
            content: panel([
              heading('Do you want to sign this deploy transaction ?'),
              ...dialogComponents,
            ]),
          },
        });
        if (!response) {
          return {
            address: contractAddress,
          };
        }
      }

      // Deploy account will auto estimate the fee from the network if not provided
      const deployResp = await deployAccount(
        network,
        contractAddress,
        contractCallData,
        publicKey,
        privateKey,
        cairoVersion,
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
          upgradeRequired: cairoVersion === CAIRO_VERSION_LEGACY,
          deployRequired: false,
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
        await waitForTransaction(
          network,
          deployResp.contract_address,
          privateKey,
          deployResp.transaction_hash,
        );
      }

      return {
        address: deployResp.contract_address,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        transaction_hash: deployResp.transaction_hash,
      };
    }
    return {
      address: contractAddress,
    };
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
