import { number } from 'starknet';
import { getSigner, getKeysFromAddressIndex, getAccContractAddressAndCallData } from './utils/starknetUtils';
import { getNetworkFromChainId, getValidNumber, upsertAccount } from './utils/snapUtils';
import { AccContract } from './types/snapState';
import { ApiParams, RecoverAccountsRequestParams } from './types/snapApi';

export async function recoverAccounts(params: ApiParams) {
  try {
    const { state, wallet, saveMutex, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as RecoverAccountsRequestParams;

    const startIndex = getValidNumber(requestParamsObj.startScanIndex, 0, 0);
    const maxScanned = getValidNumber(requestParamsObj.maxScanned, 1, 1);
    const maxMissed = getValidNumber(requestParamsObj.maxMissed, 1, 1);
    const useOldAccounts = !!requestParamsObj.useOldAccounts;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId, useOldAccounts);

    console.log(
      `recoverAccounts:\nstartIndex: ${startIndex}, maxScanned: ${maxScanned}, maxMissed: ${maxMissed}, useOldAccounts: ${useOldAccounts}`,
    );

    if (!network.accountClassHash) {
      await wallet.request({
        method: 'snap_confirm',
        params: [
          {
            prompt: 'Failed to recover accounts',
            textAreaContent: `Recover Accounts not supported in network without class hash`,
          },
        ],
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
        useOldAccounts,
      );
      const { address: contractAddress } = getAccContractAddressAndCallData(network.accountClassHash, publicKey);
      console.log(`recoverAccounts: index ${i}:\ncontractAddress = ${contractAddress}\npublicKey = ${publicKey}`);

      let signerPublicKey = '';

      try {
        signerPublicKey = await getSigner(contractAddress, network);
        console.log(`recoverAccounts: index ${i}\nsignerPublicKey: ${signerPublicKey}`);
      } catch (err) {
        console.log(`recoverAccounts: index ${i}\nerr in get signer: ${JSON.stringify(err)}`);
        signerPublicKey = '';
      }

      if (signerPublicKey) {
        if (number.toBN(signerPublicKey).eq(number.toBN(publicKey))) {
          console.log(`recoverAccounts: index ${i} matched\npublicKey: ${publicKey}`);
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

      console.log(`recoverAccounts: index ${i}\nuserAccount: ${JSON.stringify(userAccount)}`);

      await upsertAccount(userAccount, wallet, saveMutex);

      scannedAccounts.push(userAccount);
      i++;
    }

    console.log(`recoverAccounts:\nscannedAccounts: ${JSON.stringify(scannedAccounts, null, 2)}`);

    return scannedAccounts;
  } catch (err) {
    console.error(`Problem found: ${err}`);
    throw err;
  }
}
