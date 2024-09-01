import type { Invocations } from 'starknet';
import { TransactionType } from 'starknet';

import {
  FeeTokenUnit,
  type ApiParamsWithKeyDeriver,
  type EstimateFeeRequestParams,
} from './types/snapApi';
import { ACCOUNT_CLASS_HASH } from './utils/constants';
import { logger } from './utils/logger';
import { toJson } from './utils/serializer';
import {
  getNetworkFromChainId,
  verifyIfAccountNeedUpgradeOrDeploy,
} from './utils/snapUtils';
import {
  validateAndParseAddress,
  getKeysFromAddress,
  getCallDataArray,
  getAccContractAddressAndCallData,
  estimateFeeBulk,
  addFeesFromAllTransactions,
  isAccountDeployed,
} from './utils/starknetUtils';

/**
 *
 * @param params
 */
export async function estimateFee(params: ApiParamsWithKeyDeriver) {
  try {
    const { state, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as EstimateFeeRequestParams;
    const { contractAddress } = requestParamsObj;
    const { contractFuncName } = requestParamsObj;
    const contractCallData = getCallDataArray(
      requestParamsObj.contractCallData as unknown as string,
    );
    const { senderAddress } = requestParamsObj;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    if (
      !contractAddress ||
      !requestParamsObj.senderAddress ||
      !contractFuncName
    ) {
      throw new Error(
        `The given contract address, sender address, and function name need to be non-empty string, got: ${toJson(
          requestParamsObj,
        )}`,
      );
    }

    try {
      validateAndParseAddress(contractAddress);
    } catch (error) {
      throw new Error(
        `The given contract address is invalid: ${contractAddress}`,
      );
    }
    try {
      validateAndParseAddress(senderAddress);
    } catch (error) {
      throw new Error(`The given sender address is invalid: ${senderAddress}`);
    }

    const { privateKey: senderPrivateKey, publicKey } =
      await getKeysFromAddress(keyDeriver, network, state, senderAddress);

    await verifyIfAccountNeedUpgradeOrDeploy(
      network,
      senderAddress,
      publicKey,
      false,
    );

    const txnInvocation = {
      contractAddress,
      entrypoint: contractFuncName,
      calldata: contractCallData,
    };

    logger.log(`estimateFee:\ntxnInvocation: ${toJson(txnInvocation)}`);

    // Estimate deploy account fee if the signer has not been deployed yet
    const accountDeployed = await isAccountDeployed(network, senderAddress);
    let bulkTransactions: Invocations = [
      {
        type: TransactionType.INVOKE,
        payload: txnInvocation,
      },
    ];
    if (!accountDeployed) {
      const { callData } = getAccContractAddressAndCallData(publicKey);
      const deployAccountpayload = {
        classHash: ACCOUNT_CLASS_HASH,
        contractAddress: senderAddress,
        constructorCalldata: callData,
        addressSalt: publicKey,
      };

      bulkTransactions = [
        {
          type: TransactionType.DEPLOY_ACCOUNT,
          payload: deployAccountpayload,
        },
        {
          type: TransactionType.INVOKE,
          payload: txnInvocation,
        },
      ];
    }

    const estimateBulkFeeResp = await estimateFeeBulk(
      network,
      senderAddress,
      senderPrivateKey,
      bulkTransactions,
    );
    logger.log(
      `estimateFee:\nestimateFeeBulk estimateBulkFeeResp: ${toJson(
        estimateBulkFeeResp,
      )}`,
    );
    const estimateFeeResp = addFeesFromAllTransactions(estimateBulkFeeResp);

    logger.log(`estimateFee:\nestimateFeeResp: ${toJson(estimateFeeResp)}`);

    const resp = {
      suggestedMaxFee: estimateFeeResp.suggestedMaxFee.toString(10),
      overallFee: estimateFeeResp.overall_fee.toString(10),
      unit: FeeTokenUnit.ETH,
      includeDeploy: !accountDeployed,
    };
    logger.log(`estimateFee:\nresp: ${toJson(resp)}`);

    return resp;
  } catch (error) {
    logger.error(`Problem found:`, error);
    throw error;
  }
}
