import { toJson } from './utils/serializer';
import { constants, num, validateAndParseAddress } from 'starknet';
import { ApiParams, ExtractPublicKeyRequestParams } from './types/snapApi';
import { getAccount, getNetworkFromChainId } from './utils/snapUtils';
import { getKeysFromAddress } from './utils/starknetUtils';

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

    let userPublicKey;
    const accContract = getAccount(state, userAddress, network.chainId);
    if (!accContract?.publicKey || num.toBigInt(accContract.publicKey) == constants.ZERO) {
      console.log(`extractPublicKey: User address cannot be found or the signer public key is 0x0: ${userAddress}`);
      const { publicKey } = await getKeysFromAddress(keyDeriver, network, state, userAddress);
      userPublicKey = publicKey;
    } else {
      userPublicKey = accContract.publicKey;
    }

    console.log(`extractPublicKey:\nuserPublicKey: ${userPublicKey}`);

    return userPublicKey;
  } catch (err) {
    console.error(`Problem found: ${err}`);
    throw err;
  }
}