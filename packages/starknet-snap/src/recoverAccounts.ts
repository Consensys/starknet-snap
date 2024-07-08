import { toJson } from './utils/serializer';
import { num } from 'starknet';
import {
  getKeysFromAddressIndex,
  getCorrectContractAddress,
} from './utils/starknetUtils';
import { getNetworkFromChainId, getValidNumber, upsertAccount } from './utils/snapUtils';
import { AccContract } from './types/snapState';
import { ApiParams, RecoverAccountsRequestParams } from './types/snapApi';
import { logger } from './utils/logger';

export async function recoverAccounts(params: ApiParams) {
  try {
    const { state, wallet, saveMutex, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as RecoverAccountsRequestParams;

    const startIndex = getValidNumber(requestParamsObj.startScanIndex, 0, 0);
    const maxScanned = getValidNumber(requestParamsObj.maxScanned, 1, 1);
    const maxMissed = getValidNumber(requestParamsObj.maxMissed, 1, 1);
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    logger.log(`recoverAccounts:\nstartIndex: ${startIndex}, maxScanned: ${maxScanned}, maxMissed: ${maxMissed}`);

    let i = startIndex,
      j = 0;
    const scannedAccounts: AccContract[] = [];

    while (i < startIndex + maxScanned && j < maxMissed) {
      const { publicKey, addressIndex, derivationPath } = await getKeysFromAddressIndex(
        keyDeriver,
        network.chainId,
        state,
        i,
      );
      const {
        address: contractAddress,
        signerPubKey: signerPublicKey,
        upgradeRequired,
        deployRequired,
      } = await getCorrectContractAddress(network, publicKey, state);
      logger.log(
        `recoverAccounts: index ${i}:\ncontractAddress = ${contractAddress}\npublicKey = ${publicKey}\nisUpgradeRequired = ${upgradeRequired}`,
      );

      if (signerPublicKey) {
        logger.log(`recoverAccounts: index ${i}:\ncontractAddress = ${contractAddress}\n`);
        if (num.toBigInt(signerPublicKey) === num.toBigInt(publicKey)) {
          logger.log(`recoverAccounts: index ${i} matched\npublicKey: ${publicKey}`);
        }
        j = 0;
      } else {
        j++;
      }

      const userAccount: AccContract = {
        addressSalt: publicKey,
        publicKey: signerPublicKey,
        address: contractAddress,
        addressIndex,
        derivationPath,
        deployTxnHash: '',
        chainId: network.chainId,
        upgradeRequired: upgradeRequired,
        deployRequired: deployRequired,
      };

      logger.log(`recoverAccounts: index ${i}\nuserAccount: ${toJson(userAccount)}`);

      await upsertAccount(userAccount, wallet, saveMutex);

      scannedAccounts.push(userAccount);
      i++;
    }

    logger.log(`recoverAccounts:\nscannedAccounts: ${toJson(scannedAccounts, 2)}`);

    return scannedAccounts;
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
