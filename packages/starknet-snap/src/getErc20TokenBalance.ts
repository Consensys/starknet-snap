import { toJson } from './utils/serializer';
import { num } from 'starknet';
import { validateAndParseAddress } from '../src/utils/starknetUtils';
import { ApiParams, GetErc20TokenBalanceRequestParams } from './types/snapApi';
import { getNetworkFromChainId } from './utils/snapUtils';
import { callContract } from './utils/starknetUtils';
import { logger } from './utils/logger';

export async function getErc20TokenBalance(params: ApiParams) {
  try {
    const { state, requestParams } = params;
    const requestParamsObj = requestParams as GetErc20TokenBalanceRequestParams;

    if (!requestParamsObj.tokenAddress || !requestParamsObj.userAddress) {
      throw new Error(
        `The given token address and user address need to be non-empty string, got: ${toJson(requestParamsObj)}`,
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

    logger.log(`getErc20Balance:\nerc20Address: ${erc20Address}\nuserAddress: ${userAddress}`);

    const resp = await callContract(network, erc20Address, 'balanceOf', [num.toBigInt(userAddress).toString(10)]);

    logger.log(`getErc20Balance:\nresp: ${toJson(resp)}`);

    return resp[0];
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
