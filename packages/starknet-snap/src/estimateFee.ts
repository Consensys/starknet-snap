import { toJson } from './utils/serializer';
import { Invocations, TransactionType, constants } from 'starknet';
import { validateAndParseAddress } from '../src/utils/starknetUtils';
import { ApiParams, EstimateFeeRequestParams } from './types/snapApi';
import { getNetworkFromChainId } from './utils/snapUtils';
import {
  getKeysFromAddress,
  getCallDataArray,
  getAccContractAddressAndCallData,
  estimateFeeBulk,
  addFeesFromAllTransactions,
  isAccountDeployed,
} from './utils/starknetUtils';

import { PRICE_UNIT, PROXY_CONTRACT_HASH } from './utils/constants';
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

    const priceUnit = requestParamsObj.priceUnit ?? PRICE_UNIT.WEI;
    const txVersion =
      priceUnit === PRICE_UNIT.FRI ? constants.TRANSACTION_VERSION.V3 : constants.TRANSACTION_VERSION.V1;
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

    const transactions: Invocations = [];

    if (!accountDeployed) {
      const { callData } = getAccContractAddressAndCallData(publicKey);
      const deployAccountpayload = {
        classHash: PROXY_CONTRACT_HASH,
        contractAddress: senderAddress,
        constructorCalldata: callData,
        addressSalt: publicKey,
      };

      transactions.push({
        type: TransactionType.DEPLOY_ACCOUNT,
        payload: deployAccountpayload,
      });
    }

    transactions.push({
      type: TransactionType.INVOKE,
      payload: txnInvocation,
    });

    const estimateBulkFeeResp = await estimateFeeBulk(network, senderAddress, senderPrivateKey, transactions, {
      version: txVersion,
    });
    logger.log(`estimateFee:\nestimateFeeBulk estimateBulkFeeResp: ${toJson(estimateBulkFeeResp)}`);

    const estimateFeeResp = addFeesFromAllTransactions(estimateBulkFeeResp);

    logger.log(`estimateFee:\nestimateFeeResp: ${toJson(estimateFeeResp)}`);

    const resp = {
      suggestedMaxFee: estimateFeeResp.suggestedMaxFee.toString(10),
      overallFee: estimateFeeResp.overall_fee.toString(10),
      unit: priceUnit.toLowerCase(),
      includeDeploy: !accountDeployed,
    };
    logger.log(`estimateFee:\nresp: ${toJson(resp)}`);

    return resp;
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
