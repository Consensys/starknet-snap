import type { BIP44AddressKeyDeriver } from '@metamask/key-tree';
import type { EstimateFee } from 'starknet';

import type {
  ApiParams,
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
export async function estimateAccDeployFee(params: ApiParams) {
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
      keyDeriver as unknown as BIP44AddressKeyDeriver,
      network.chainId,
      state,
      addressIndex,
    );
    const { address: contractAddress, callData: contractCallData } =
      getAccContractAddressAndCallData(publicKey);
    logger.log(
      `estimateAccountDeployFee:\ncontractAddress = ${contractAddress}\npublicKey = ${publicKey}\naddressIndex = ${addressIndexInUsed}`,
    );

    const estimateDeployFee: EstimateFee = await estimateAccountDeployFee(
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
      suggestedMaxFee: estimateDeployFee.suggestedMaxFee.toString(10),
      overallFee: estimateDeployFee.overall_fee.toString(10),
      gasConsumed: estimateDeployFee.gas_consumed?.toString(10) ?? '0',
      gasPrice: estimateDeployFee.gas_price?.toString(10) ?? '0',
      unit: 'wei',
    };
    logger.log(`estimateAccountDeployFee:\nresp: ${toJson(resp)}`);

    return resp;
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.error(`Problem found: ${error}`);
    throw error;
  }
}
