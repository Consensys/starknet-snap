import { number, validateAndParseAddress } from 'starknet';
import { ApiParams, GetErc20TokenBalanceRequestParams } from './types/snapApi';
import { getNetworkFromChainId } from './utils/snapUtils';
import { callContract } from './utils/starknetUtils';

export async function getErc20TokenBalance(params: ApiParams) {
  try {
    const { state, requestParams } = params;
    const requestParamsObj = requestParams as GetErc20TokenBalanceRequestParams;

    if (!requestParamsObj.tokenAddress || !requestParamsObj.userAddress) {
      throw new Error(
        `The given token address and user address need to be non-empty string, got: ${JSON.stringify(
          requestParamsObj,
        )}`,
      );
    }

    try {
      validateAndParseAddress(requestParamsObj.tokenAddress);
    } catch (err) {
      throw new Error(`The given token address is invalid: ${requestParamsObj.tokenAddress}`);
    }
    try {
      validateAndParseAddress(requestParamsObj.userAddress);
    } catch (err) {
      throw new Error(`The given user address is invalid: ${requestParamsObj.userAddress}`);
    }

    // Get the erc20 and user account contract addresses
    const erc20Address = requestParamsObj.tokenAddress;
    const userAddress = requestParamsObj.userAddress;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    console.log(`getErc20Balance:\nerc20Address: ${erc20Address}\nuserAddress: ${userAddress}`);

    const resp = await callContract(network, erc20Address, 'balanceOf', [number.toBN(userAddress).toString(10)]);

    console.log(`getErc20Balance:\nresp: ${JSON.stringify(resp)}`);

    return resp.result[0];
  } catch (err) {
    console.error(`Problem found: ${err}`);
    throw err;
  }
}
