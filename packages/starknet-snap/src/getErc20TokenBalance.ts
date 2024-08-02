import type {
  ApiParams,
  GetErc20TokenBalanceRequestParams,
} from './types/snapApi';
import { BlockIdentifierEnum } from './utils/constants';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import { getNetworkFromChainId } from './utils/snapUtils';
import { getBalance, validateAndParseAddress } from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function getErc20TokenBalance(params: ApiParams) {
  try {
    const { state, requestParams } = params;
    const requestParamsObj = requestParams as GetErc20TokenBalanceRequestParams;

    if (!requestParamsObj.tokenAddress || !requestParamsObj.userAddress) {
      throw new Error(
        `The given token address and user address need to be non-empty string, got: ${toJson(
          requestParamsObj,
        )}`,
      );
    }

    try {
      validateAndParseAddress(requestParamsObj.tokenAddress);
    } catch (error) {
      throw new Error(
        `The given token address is invalid: ${requestParamsObj.tokenAddress}`,
      );
    }
    try {
      validateAndParseAddress(requestParamsObj.userAddress);
    } catch (error) {
      throw new Error(
        `The given user address is invalid: ${requestParamsObj.userAddress}`,
      );
    }

    // Get the erc20 and user account contract addresses
    const erc20Address = requestParamsObj.tokenAddress;
    const { userAddress } = requestParamsObj;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    logger.log(
      `getErc20Balance:\nerc20Address: ${erc20Address}\nuserAddress: ${userAddress}`,
    );

    const balanceLatest = await getBalance(
      userAddress,
      erc20Address,
      network,
      BlockIdentifierEnum.Latest,
    );
    const balancePending = await getBalance(
      userAddress,
      erc20Address,
      network,
      BlockIdentifierEnum.Pending,
    );

    const resp = {
      balancePending,
      balanceLatest,
    };
    logger.log(`getErc20Balance:\nresp: ${toJson(resp)}`);

    return resp;
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
