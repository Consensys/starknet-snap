import type {
  ApiParamsWithKeyDeriver,
  EstimateFeesRequestParams,
} from './types/snapApi';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import { getNetworkFromChainId } from './utils/snapUtils';
import { getKeysFromAddress, estimateFeeBulk } from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function estimateFees(params: ApiParamsWithKeyDeriver) {
  try {
    const { state, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as EstimateFeesRequestParams;

    logger.log(`estimateFees params: ${toJson(requestParamsObj, 2)}`);

    const { senderAddress } = requestParamsObj;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const { privateKey: senderPrivateKey } = await getKeysFromAddress(
      keyDeriver,
      network,
      state,
      senderAddress,
    );

    const fees = await estimateFeeBulk(
      network,
      senderAddress,
      senderPrivateKey,
      requestParamsObj.invocations,
      requestParamsObj.invocationDetails,
    );

    return fees.map((fee) => ({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      overall_fee: fee.overall_fee.toString(10) || '0',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      gas_consumed: fee.gas_consumed.toString(10) || '0',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      gas_price: fee.gas_price.toString(10) || '0',
      suggestedMaxFee: fee.suggestedMaxFee.toString(10) || '0',
    }));
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
