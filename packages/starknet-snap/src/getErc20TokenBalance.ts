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

    // Always get both balance from pending and latest
    // Always show the smallest balance of the two.
    // If user is getting token it can't spend them until they are latest
    // If user is sending token it can't spend them even if they are on pending.
    const balanceLatest = BigInt(
      await getBalance(
        userAddress,
        erc20Address,
        network,
        BlockIdentifierEnum.Latest,
      ),
    );
    const balancePending = BigInt(
      await getBalance(
        userAddress,
        erc20Address,
        network,
        BlockIdentifierEnum.Pending,
      ),
    );

    const balanceBigInt =
      balancePending < balanceLatest ? balancePending : balanceLatest;
    const balance = `0x${balanceBigInt.toString(16)}`;
    logger.log(`getErc20Balance:\nresp: ${toJson(balance)}`);

    return balance;
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
