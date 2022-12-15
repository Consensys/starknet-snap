import { validateAndParseAddress } from 'starknet';
import { ApiParams, EstimateFeeRequestParams } from './types/snapApi';
import { getNetworkFromChainId } from './utils/snapUtils';
import {
  getKeyPairFromPrivateKey,
  getKeysFromAddress,
  getCallDataArray,
  estimateFee as estimateFeeUtil,
  estimateFee_v4_6_0 as estimateFeeUtil_v4_6_0,
} from './utils/starknetUtils';

export async function estimateFee(params: ApiParams) {
  try {
    const { state, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as EstimateFeeRequestParams;
    const useOldAccounts = !!requestParamsObj.useOldAccounts;

    if (!requestParamsObj.contractAddress || !requestParamsObj.senderAddress || !requestParamsObj.contractFuncName) {
      throw new Error(
        `The given contract address, sender address, and function name need to be non-empty string, got: ${JSON.stringify(
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
    const network = getNetworkFromChainId(state, requestParamsObj.chainId, useOldAccounts);
    const { privateKey: senderPrivateKey } = await getKeysFromAddress(keyDeriver, network, state, senderAddress);
    const senderKeyPair = getKeyPairFromPrivateKey(senderPrivateKey);

    const txnInvocation = {
      contractAddress,
      entrypoint: contractFuncName,
      calldata: contractCallData,
    };

    console.log(`estimateFee:\ntxnInvocation: ${JSON.stringify(txnInvocation)}`);

    const estimateFeeResp = useOldAccounts
      ? await estimateFeeUtil_v4_6_0(network, senderAddress, senderKeyPair, txnInvocation)
      : await estimateFeeUtil(network, senderAddress, senderKeyPair, txnInvocation);

    console.log(`estimateFee:\nestimateFeeResp: ${JSON.stringify(estimateFeeResp)}`);

    const resp = {
      suggestedMaxFee: estimateFeeResp.suggestedMaxFee.toString(10),
      overallFee: estimateFeeResp.overall_fee.toString(10),
      gasConsumed: estimateFeeResp.gas_consumed?.toString(10) ?? '0',
      gasPrice: estimateFeeResp.gas_price?.toString(10) ?? '0',
      unit: 'wei',
    };
    console.log(`estimateFee:\nresp: ${JSON.stringify(resp)}`);

    return resp;
  } catch (err) {
    console.error(`Problem found: ${err}`);
    throw err;
  }
}
