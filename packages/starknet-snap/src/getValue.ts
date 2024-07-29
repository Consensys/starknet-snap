import { num as numUtils } from 'starknet';

import type { ApiParams, GetValueRequestParams } from './types/snapApi';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import { getNetworkFromChainId } from './utils/snapUtils';
import {
  validateAndParseAddress,
  getCallDataArray,
  callContract,
} from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function getValue(params: ApiParams) {
  try {
    const { state, requestParams } = params;
    const requestParamsObj = requestParams as GetValueRequestParams;

    if (
      !requestParamsObj.contractAddress ||
      !requestParamsObj.contractFuncName
    ) {
      throw new Error(
        `The given contract address and function name need to be non-empty string, got: ${toJson(
          requestParamsObj,
        )}`,
      );
    }

    try {
      validateAndParseAddress(requestParamsObj.contractAddress);
    } catch (error) {
      throw new Error(
        `The given contract address is invalid: ${requestParamsObj.contractAddress}`,
      );
    }

    const { contractAddress } = requestParamsObj;
    const { contractFuncName } = requestParamsObj;
    const contractCallData = getCallDataArray(
      requestParamsObj.contractCallData as unknown as string,
    );
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    const resp = await callContract(
      network,
      contractAddress,
      contractFuncName,
      numUtils.bigNumberishArrayToDecimalStringArray(contractCallData),
    );

    logger.log(`getValue:\nresp: ${toJson(resp)}`);

    return resp;
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
