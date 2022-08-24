import { number, validateAndParseAddress } from 'starknet';
import { ApiParams, GetValueRequestParams } from './types/snapApi';
import { getNetworkFromChainId } from './utils/snapUtils';
import { getCallDataArray, callContract } from './utils/starknetUtils';

export async function getValue(params: ApiParams) {
  try {
    const { state, requestParams } = params;
    const requestParamsObj = requestParams as GetValueRequestParams;

    if (!requestParamsObj.contractAddress || !requestParamsObj.contractFuncName) {
      throw new Error(
        `The given contract address and function name need to be non-empty string, got: ${JSON.stringify(
          requestParamsObj,
        )}`,
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
      number.bigNumberishArrayToDecimalStringArray(contractCallData),
    );

    console.log(`getValue:\nresp: ${JSON.stringify(resp)}`);

    return resp.result;
  } catch (err) {
    console.error(`Problem found: ${err}`);
    throw err;
  }
}
