import { toJson } from './utils/serializer';
import { Invocations, TransactionType } from 'starknet';
import { validateAndParseAddress } from '../src/utils/starknetUtils';
import { ApiParams, EstimateFeeRequestParams } from './types/snapApi';
import { getNetworkFromChainId } from './utils/snapUtils';
import {
  getKeysFromAddress,
  getCallDataArray,
  estimateFee as estimateFeeUtil,
  getAccContractAddressAndCallData,
  estimateFeeBulk,
  addFeesFromAllTransactions,
  isAccountDeployed,
} from './utils/starknetUtils';

import { PROXY_CONTRACT_HASH } from './utils/constants';
import { logger } from './utils/logger';

export async function estimateFee(params: ApiParams) {
  try {
    const { state, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as EstimateFeeRequestParams;

    if (!requestParamsObj.contractAddress || !requestParamsObj.senderAddress || !requestParamsObj.contractFuncName) {
      throw new Error(
        `The given contract address, sender address, and function name need to be non-empty string, got: ${toJson(
          requestParamsObj,
        )}`,
      );
    }

    try {
      validateAndParseAddress(requestParamsObj.contractAddress);
    } catch (err) {
      throw new Error(`The given contract address is invalid: ${requestParamsObj.contractAddress}`);
    }
    try {
      validateAndParseAddress(requestParamsObj.senderAddress);
    } catch (err) {
      throw new Error(`The given sender address is invalid: ${requestParamsObj.senderAddress}`);
    }

    const contractAddress = requestParamsObj.contractAddress;
    const contractFuncName = requestParamsObj.contractFuncName;
    const contractCallData = getCallDataArray(requestParamsObj.contractCallData);
    const senderAddress = requestParamsObj.senderAddress;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const { privateKey: senderPrivateKey, publicKey } = await getKeysFromAddress(
      keyDeriver,
      network,
      state,
      senderAddress,
    );

    const txnInvocation = {
      contractAddress,
      entrypoint: contractFuncName,
      calldata: contractCallData,
    };

    logger.log(`estimateFee:\ntxnInvocation: ${toJson(txnInvocation)}`);

    //Estimate deploy account fee if the signer has not been deployed yet
    const accountDeployed = await isAccountDeployed(network, publicKey);
    let bulkTransactions: Invocations = [
      {
        type: TransactionType.INVOKE,
        payload: txnInvocation,
      },
    ];
    if (!accountDeployed) {
      const { callData } = getAccContractAddressAndCallData(network.accountClassHash, publicKey);
      const deployAccountpayload = {
        classHash: PROXY_CONTRACT_HASH,
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

    let estimateFeeResp;

    if (accountDeployed) {
      // This condition branch will be removed later when starknet.js
      // supports estimateFeeBulk in rpc mode
      estimateFeeResp = await estimateFeeUtil(network, senderAddress, senderPrivateKey, txnInvocation);
      logger.log(`estimateFee:\nestimateFeeUtil estimateFeeResp: ${toJson(estimateFeeResp)}`);
    } else {
      const estimateBulkFeeResp = await estimateFeeBulk(network, senderAddress, senderPrivateKey, bulkTransactions);
      logger.log(`estimateFee:\nestimateFeeBulk estimateBulkFeeResp: ${toJson(estimateBulkFeeResp)}`);
      estimateFeeResp = addFeesFromAllTransactions(estimateBulkFeeResp);
    }

    logger.log(`estimateFee:\nestimateFeeResp: ${toJson(estimateFeeResp)}`);

    const resp = {
      suggestedMaxFee: estimateFeeResp.suggestedMaxFee.toString(10),
      overallFee: estimateFeeResp.overall_fee.toString(10),
      gasConsumed: estimateFeeResp.gas_consumed?.toString(10) ?? '0',
      gasPrice: estimateFeeResp.gas_price?.toString(10) ?? '0',
      unit: 'wei',
      includeDeploy: !accountDeployed,
    };
    logger.log(`estimateFee:\nresp: ${toJson(resp)}`);

    return resp;
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
