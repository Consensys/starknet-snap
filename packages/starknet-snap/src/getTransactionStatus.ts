import { ApiParams, GetTransactionStatusRequestParams } from './types/snapApi';
import { getNetworkFromChainId } from './utils/snapUtils';
import * as utils from './utils/starknetUtils';

export async function getTransactionStatus(params: ApiParams) {
  try {
    const { state, requestParams } = params;
    const requestParamsObj = requestParams as GetTransactionStatusRequestParams;

    const transactionHash = requestParamsObj.transactionHash;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    const getTxnStatusResp = await utils.getTransactionStatus(transactionHash, network);
    console.log(`getTransactionStatus:\ngetTxnStatusResp: ${JSON.stringify(getTxnStatusResp)}`);

    return getTxnStatusResp;
  } catch (err) {
    console.error(`Problem found: ${err}`);
    throw err;
  }
}
