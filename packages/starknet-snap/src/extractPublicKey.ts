import { toJson } from './utils/serializer';
import { constants, num } from 'starknet';
import { validateAndParseAddress, getCorrectContractAddress } from '../src/utils/starknetUtils';
import { ApiParams, ExtractPublicKeyRequestParams } from './types/snapApi';
import { getAccount, getNetworkFromChainId } from './utils/snapUtils';
import { getKeysFromAddress } from './utils/starknetUtils';
import { logger } from './utils/logger';

export async function extractPublicKey(params: ApiParams) {
  try {
    const { state, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as ExtractPublicKeyRequestParams;

    const userAddress = requestParamsObj.userAddress;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    if (!requestParamsObj.userAddress) {
      throw new Error(
        `The given user address need to be non-empty string, got: ${toJson(requestParamsObj.userAddress)}`,
      );
    }

    try {
      validateAndParseAddress(requestParamsObj.userAddress);
    } catch (err) {
      throw new Error(`The given user address is invalid: ${requestParamsObj.userAddress}`);
    }

    const { publicKey } = await getKeysFromAddress(keyDeriver, network, state, userAddress);
    const { upgradeRequired, deployRequired, address } = await getCorrectContractAddress(network, publicKey);

    if (upgradeRequired && deployRequired) {
      // Edge case force cairo0 deploy because non-zero balance
      throw new Error(`Cairo 0 contract address ${address} balance is not empty, deploy required`);
    }

    if (upgradeRequired && !deployRequired) {
      throw new Error('Upgrade required');
    }

    let userPublicKey;
    const accContract = getAccount(state, userAddress, network.chainId);
    if (!accContract?.publicKey || num.toBigInt(accContract.publicKey) === constants.ZERO) {
      logger.log(`extractPublicKey: User address cannot be found or the signer public key is 0x0: ${userAddress}`);
      userPublicKey = publicKey;
    } else {
      userPublicKey = accContract.publicKey;
    }

    logger.log(`extractPublicKey:\nuserPublicKey: ${userPublicKey}`);

    return userPublicKey;
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
