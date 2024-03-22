import { toJson } from './utils/serializer';
import { getNetworkFromChainId } from './utils/snapUtils';
import { getKeysFromAddress, estimateFeeBulk } from './utils/starknetUtils';
import { ApiParams, EstimateFeesRequestParams } from './types/snapApi';
import { logger } from './utils/logger';

export async function estimateFees(params: ApiParams) {
  try {
    const { state, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as EstimateFeesRequestParams;

    logger.log(`estimateFees params: ${toJson(requestParamsObj, 2)}`);

    const senderAddress = requestParamsObj.senderAddress;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const { privateKey: senderPrivateKey } = await getKeysFromAddress(keyDeriver, network, state, senderAddress);

    const fees = await estimateFeeBulk(
      network,
      senderAddress,
      senderPrivateKey,
      requestParamsObj.invocations,
      requestParamsObj.invocationDetails,
    );

    return fees.map((fee) => ({
      overall_fee: fee.overall_fee.toString(10) || '0',
      gas_consumed: fee.gas_consumed.toString(10) || '0',
      gas_price: fee.gas_price.toString(10) || '0',
      suggestedMaxFee: fee.suggestedMaxFee.toString(10) || '0',
    }));
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
