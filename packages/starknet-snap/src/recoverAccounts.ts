import { toJson } from './utils/serializer';
import { num } from 'starknet';
import { getSigner, getKeysFromAddressIndex, getAccContractAddressAndCallData } from './utils/starknetUtils';
import { getNetworkFromChainId, getValidNumber, upsertAccount } from './utils/snapUtils';
import { AccContract } from './types/snapState';
import { ApiParams, RecoverAccountsRequestParams } from './types/snapApi';
import { DialogType } from '@metamask/rpc-methods';
import { heading, panel, text } from '@metamask/snaps-ui';
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

    if (!network.accountClassHash) {
      await wallet.request({
        method: 'snap_dialog',
        params: {
          type: DialogType.Alert,
          content: panel([
            heading('Failed to recover accounts'),
            text('Recover Accounts not supported in network without class hash'),
          ]),
        },
      });
      return null;
    }

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
      const { address: contractAddress } = getAccContractAddressAndCallData(publicKey);
      logger.log(`recoverAccounts: index ${i}:\ncontractAddress = ${contractAddress}\npublicKey = ${publicKey}`);

      let signerPublicKey = '';

      try {
        signerPublicKey = await getSigner(contractAddress, network);
        logger.log(`recoverAccounts: index ${i}\nsignerPublicKey: ${signerPublicKey}`);
      } catch (err) {
        logger.log(`recoverAccounts: index ${i}\nerr in get signer: ${toJson(err)}`);
        signerPublicKey = '';
      }

      if (signerPublicKey) {
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
