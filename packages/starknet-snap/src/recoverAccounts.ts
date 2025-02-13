import type { BIP44AddressKeyDeriver } from '@metamask/key-tree';
import { num as numUtils } from 'starknet';

import type {
  ApiParamsWithKeyDeriver,
  RecoverAccountsRequestParams,
} from './types/snapApi';
import type { AccContract } from './types/snapState';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import {
  getNetworkFromChainId,
  getValidNumber,
  upsertAccount,
} from './utils/snapUtils';
import {
  getKeysFromAddressIndex,
  getCorrectContractAddress,
} from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function recoverAccounts(params: ApiParamsWithKeyDeriver) {
  try {
    const { state, wallet, saveMutex, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as RecoverAccountsRequestParams;

    const startIndex = getValidNumber(requestParamsObj.startScanIndex, 0, 0);
    const maxScanned = getValidNumber(requestParamsObj.maxScanned, 1, 1);
    const maxMissed = getValidNumber(requestParamsObj.maxMissed, 1, 1);
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    logger.log(
      `recoverAccounts:\nstartIndex: ${startIndex}, maxScanned: ${maxScanned}, maxMissed: ${maxMissed}`,
    );

    let i = startIndex;
    let j = 0;
    const scannedAccounts: AccContract[] = [];

    while (i < startIndex + maxScanned && j < maxMissed) {
      const { publicKey, addressIndex, derivationPath } =
        await getKeysFromAddressIndex(
          keyDeriver as unknown as BIP44AddressKeyDeriver,
          network.chainId,
          state,
          i,
        );
      const {
        address: contractAddress,
        signerPubKey: signerPublicKey,
        upgradeRequired,
        deployRequired,
      } = await getCorrectContractAddress(network, publicKey);
      logger.log(
        `recoverAccounts: index ${i}:\ncontractAddress = ${contractAddress}\npublicKey = ${publicKey}\nisUpgradeRequired = ${upgradeRequired}`,
      );

      if (signerPublicKey) {
        logger.log(
          `recoverAccounts: index ${i}:\ncontractAddress = ${contractAddress}\n`,
        );
        if (
          numUtils.toBigInt(signerPublicKey) === numUtils.toBigInt(publicKey)
        ) {
          logger.log(
            `recoverAccounts: index ${i} matched\npublicKey: ${publicKey}`,
          );
        }
        j = 0;
      } else {
        j += 1;
      }

      const userAccount: AccContract = {
        addressSalt: publicKey,
        publicKey: signerPublicKey,
        address: contractAddress,
        addressIndex,
        derivationPath,
        deployTxnHash: '',
        chainId: network.chainId,
        upgradeRequired,
        deployRequired,
      };

      logger.log(
        `recoverAccounts: index ${i}\nuserAccount: ${toJson(userAccount)}`,
      );

      await upsertAccount(userAccount, wallet, saveMutex);

      scannedAccounts.push(userAccount);
      i += 1;
    }

    logger.log(
      `recoverAccounts:\nscannedAccounts: ${toJson(scannedAccounts, 2)}`,
    );

    return scannedAccounts;
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
