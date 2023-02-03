import { TransactionBulk, validateAndParseAddress } from 'starknet';
import { ApiParams, EstimateFeeRequestParams } from './types/snapApi';
import { getNetworkFromChainId } from './utils/snapUtils';
import {
  getKeyPairFromPrivateKey,
  getKeysFromAddress,
  getCallDataArray,
  estimateFee_v4_6_0 as estimateFeeUtil_v4_6_0,
  getSigner,
  getAccContractAddressAndCallData,
  estimateFeeBulk,
  addFeesFromAllTransactions,
} from './utils/starknetUtils';

import { PROXY_CONTRACT_HASH } from './utils/constants';

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
    const { privateKey: senderPrivateKey, publicKey } = await getKeysFromAddress(
      keyDeriver,
      network,
      state,
      senderAddress,
    );
    const senderKeyPair = getKeyPairFromPrivateKey(senderPrivateKey);

    const txnInvocation = {
      contractAddress,
      entrypoint: contractFuncName,
      calldata: contractCallData,
    };

    console.log(`estimateFee:\ntxnInvocation: ${JSON.stringify(txnInvocation)}`);

    //Estimate deploy account fee if the signer has not been deployed yet
    let accountDeployed = true;
    const { address: signerContractAddress, callData } = getAccContractAddressAndCallData(
      network.accountClassHash,
      publicKey,
    );
    try {
      await getSigner(signerContractAddress, network);
      console.log(`estimateFee:\ngetSigner: contractAddress = ${signerContractAddress}`);
    } catch (err) {
      accountDeployed = false;
      console.log(`estimateFee:\ngetSigner: err in get signer: ${JSON.stringify(err)}`);
    }

    let bulkTransactions: TransactionBulk = [
      {
        type: 'INVOKE_FUNCTION',
        payload: txnInvocation,
      },
    ];
    if (!accountDeployed) {
      const deployAccountpayload = {
        classHash: PROXY_CONTRACT_HASH,
        contractAddress: senderAddress,
        constructorCalldata: callData,
        addressSalt: publicKey,
      };

      bulkTransactions = [
        {
          type: 'DEPLOY_ACCOUNT',
          payload: deployAccountpayload,
        },
        {
          type: 'INVOKE_FUNCTION',
          payload: txnInvocation,
        },
      ];
    }

    let estimateFeeResp;
    if (useOldAccounts) {
      estimateFeeResp = await estimateFeeUtil_v4_6_0(network, senderAddress, senderKeyPair, txnInvocation);
    } else {
      const estimateBulkFeeResp = await estimateFeeBulk(network, senderAddress, senderKeyPair, bulkTransactions);
      estimateFeeResp = addFeesFromAllTransactions(estimateBulkFeeResp);
    }

    console.log(`estimateFee:\nestimateFeeResp: ${JSON.stringify(estimateFeeResp)}`);

    const resp = {
      suggestedMaxFee: estimateFeeResp.suggestedMaxFee.toString(10),
      overallFee: estimateFeeResp.overall_fee.toString(10),
      gasConsumed: estimateFeeResp.gas_consumed?.toString(10) ?? '0',
      gasPrice: estimateFeeResp.gas_price?.toString(10) ?? '0',
      unit: 'wei',
      includeDeploy: !accountDeployed,
    };
    console.log(`estimateFee:\nresp: ${JSON.stringify(resp)}`);

    return resp;
  } catch (err) {
    console.error(`Problem found: ${err}`);
    throw err;
  }
}
