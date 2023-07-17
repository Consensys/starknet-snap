import { toJson } from './utils/serializer';
import { num } from 'starknet';
import { validateAndParseAddress } from '../src/utils/starknetUtils';
import { ApiParams, GetValueRequestParams } from './types/snapApi';
import { getNetworkFromChainId } from './utils/snapUtils';
import { getCallDataArray, callContract } from './utils/starknetUtils';
import { logger } from './utils/logger';

export async function getValue(params: ApiParams) {
  try {
    const { state, requestParams } = params;
    const requestParamsObj = requestParams as GetValueRequestParams;

    if (!requestParamsObj.contractAddress || !requestParamsObj.contractFuncName) {
      throw new Error(
        `The given contract address and function name need to be non-empty string, got: ${toJson(requestParamsObj)}`,
      );
    }

    try {
      validateAndParseAddress(requestParamsObj.contractAddress);
    } catch (err) {
      throw new Error(`The given contract address is invalid: ${requestParamsObj.contractAddress}`);
    }

    const contractAddress = requestParamsObj.contractAddress;
    const contractFuncName = requestParamsObj.contractFuncName;
    const contractCallData = getCallDataArray(requestParamsObj.contractCallData);
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    const resp = await callContract(
      network,
      contractAddress,
      contractFuncName,
      num.bigNumberishArrayToDecimalStringArray(contractCallData),
    );

    logger.log(`getValue:\nresp: ${toJson(resp)}`);

    return resp.result;
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
