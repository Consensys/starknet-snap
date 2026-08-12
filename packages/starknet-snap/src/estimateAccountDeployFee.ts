import type { EstimateFeeResponseOverhead } from 'starknet';

import type {
  ApiParamsWithKeyDeriver,
  EstimateAccountDeployFeeRequestParams,
} from './types/snapApi';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import { getNetworkFromChainId, getValidNumber } from './utils/snapUtils';
import {
  estimateAccountDeployFee,
  getKeysFromAddressIndex,
  getAccContractAddressAndCallData,
} from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function estimateAccDeployFee(params: ApiParamsWithKeyDeriver) {
  try {
    const { state, keyDeriver, requestParams } = params;
    const requestParamsObj =
      requestParams as EstimateAccountDeployFeeRequestParams;

    const addressIndex = getValidNumber(requestParamsObj.addressIndex, -1, 0);
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    const {
      publicKey,
      addressIndex: addressIndexInUsed,
      privateKey,
    } = await getKeysFromAddressIndex(
      keyDeriver,
      network.chainId,
      state,
      addressIndex,
    );
    const { address: contractAddress, callData: contractCallData } =
      getAccContractAddressAndCallData(publicKey);
    logger.log(
      `estimateAccountDeployFee:\ncontractAddress = ${contractAddress}\npublicKey = ${publicKey}\naddressIndex = ${addressIndexInUsed}`,
    );

    const estimateDeployFee: EstimateFeeResponseOverhead =
      await estimateAccountDeployFee(
        network,
        contractAddress,
        contractCallData,
        publicKey,
        privateKey,
      );
    logger.log(
      `estimateAccountDeployFee:\nestimateDeployFee: ${toJson(
        estimateDeployFee,
      )}`,
    );

    const resp = {
      suggestedMaxFee: estimateDeployFee.overall_fee.toString(10),
      overallFee: estimateDeployFee.overall_fee.toString(10),
      gasConsumed:
        estimateDeployFee.resourceBounds.l1_gas.max_amount.toString(10),
      gasPrice:
        estimateDeployFee.resourceBounds.l1_gas.max_price_per_unit.toString(10),
      unit: estimateDeployFee.unit,
    };
    logger.log(`estimateAccountDeployFee:\nresp: ${toJson(resp)}`);

    return resp;
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
