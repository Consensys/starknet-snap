import { number, constants, validateAndParseAddress } from 'starknet';
import { estimateFee } from './estimateFee';
import { Transaction, TransactionStatus, VoyagerTransactionType } from './types/snapState';
import { getNetworkFromChainId, getSigningTxnText, upsertTransaction } from './utils/snapUtils';
import {
  getKeyPairFromPrivateKey,
  getKeysFromAddress,
  getCallDataArray,
  executeTxn,
  executeTxn_v4_6_0,
} from './utils/starknetUtils';
import { ApiParams, SendTransactionRequestParams } from './types/snapApi';

export async function sendTransaction(params: ApiParams) {
  try {
    const { state, wallet, saveMutex, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as SendTransactionRequestParams;

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
    const useOldAccounts = !!requestParamsObj.useOldAccounts;
    const network = getNetworkFromChainId(state, requestParamsObj.chainId, useOldAccounts);
    const { privateKey: senderPrivateKey } = await getKeysFromAddress(keyDeriver, network, state, senderAddress);
    const senderKeyPair = getKeyPairFromPrivateKey(senderPrivateKey);
    let maxFee = requestParamsObj.maxFee ? number.toBN(requestParamsObj.maxFee) : constants.ZERO;
    if (maxFee.eq(constants.ZERO)) {
      const { suggestedMaxFee } = await estimateFee(params);
      maxFee = number.toBN(suggestedMaxFee);
    }

    const signingTxnText = getSigningTxnText(
      state,
      contractAddress,
      contractFuncName,
      contractCallData,
      senderAddress,
      maxFee,
      network,
    );
    const response = await wallet.request({
      method: 'snap_confirm',
      params: [
        {
          prompt: `Do you want to sign this transaction ?`,
          description: `It will be signed with address: ${senderAddress}`,
          textAreaContent: signingTxnText,
        },
      ],
    });
    if (!response) return false;

    const txnInvocation = {
      contractAddress,
      entrypoint: contractFuncName,
      calldata: contractCallData,
    };

    console.log(
      `sendTransaction:\ntxnInvocation: ${JSON.stringify(txnInvocation)}\nmaxFee: ${JSON.stringify(maxFee)}}`,
    );

    const txnResp = useOldAccounts
      ? await executeTxn_v4_6_0(network, senderAddress, senderKeyPair, txnInvocation, maxFee)
      : await executeTxn(network, senderAddress, senderKeyPair, txnInvocation, maxFee);

    console.log(`sendTransaction:\ntxnResp: ${JSON.stringify(txnResp)}`);

    if (txnResp.transaction_hash) {
      const txn: Transaction = {
        txnHash: txnResp.transaction_hash,
        txnType: VoyagerTransactionType.INVOKE,
        chainId: network.chainId,
        senderAddress,
        contractAddress,
        contractFuncName,
        contractCallData: contractCallData.map((data: number.BigNumberish) => number.toHex(number.toBN(data))),
        status: TransactionStatus.RECEIVED,
        failureReason: '',
        eventIds: [],
        timestamp: Math.floor(Date.now() / 1000),
      };

      await upsertTransaction(txn, wallet, saveMutex);
    }

    return txnResp;
  } catch (err) {
    console.error(`Problem found: ${err}`);
    throw err;
  }
}
