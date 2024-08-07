import type {
  ApiParams,
  GetErc20TokenBalanceRequestParams,
} from './types/snapApi';
import { BlockIdentifierEnum } from './utils/constants';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import { getNetworkFromChainId } from './utils/snapUtils';
import {
  getBalance,
  isAccountDeployed,
  validateAndParseAddress,
} from './utils/starknetUtils';

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

    // For deployed accounts, use the PENDING block to show balance updates as soon as possible,
    // facilitating concurrent transactions without delays.
    // For non-deployed accounts, use the LATEST block to avoid displaying non-zero balances
    // from pending transactions, because confirmed non-zero balance is required for deployment.
    const blockIdentifier = (await isAccountDeployed(network, userAddress))
      ? BlockIdentifierEnum.Pending
      : BlockIdentifierEnum.Latest;
    const balance = await getBalance(
      userAddress,
      erc20Address,
      network,
      blockIdentifier,
    );

    logger.log(`getErc20Balance:\nresp: ${toJson(balance)}`);

    return balance;
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
