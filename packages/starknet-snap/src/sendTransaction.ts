import { num, constants, validateAndParseAddress } from 'starknet';
import { estimateFee } from './estimateFee';
import { Transaction, TransactionStatus, VoyagerTransactionType } from './types/snapState';
import { getNetworkFromChainId, getSigningTxnText, upsertTransaction } from './utils/snapUtils';
import {
  getKeysFromAddress,
  getCallDataArray,
  executeTxn,
  executeTxn_v4_6_0,
  isAccountDeployed,
} from './utils/starknetUtils';
import { ApiParams, SendTransactionRequestParams } from './types/snapApi';
import { createAccount } from './createAccount';
import { DialogType } from '@metamask/rpc-methods';
import { heading, panel, text } from '@metamask/snaps-ui';

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
    const {
      privateKey: senderPrivateKey,
      publicKey,
      addressIndex,
    } = await getKeysFromAddress(keyDeriver, network, state, senderAddress);
    let maxFee = requestParamsObj.maxFee ? num.toBigInt(requestParamsObj.maxFee) : constants.ZERO;
    if (maxFee === constants.ZERO) {
      const { suggestedMaxFee } = await estimateFee(params);
      maxFee = num.toBigInt(suggestedMaxFee);
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
      method: 'snap_dialog',
      params: {
        type: DialogType.Confirmation,
        content: panel([
          heading('Do you want to sign this transaction ?'),
          text(`It will be signed with address: ${senderAddress}`),
          text(signingTxnText),
        ]),
      },
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

    const accountDeployed = await isAccountDeployed(network, publicKey);
    if (!accountDeployed) {
      //Deploy account before sending the transaction
      console.log('sendTransaction:\nFirst transaction : send deploy transaction');
      const createAccountApiParams = {
        state,
        wallet: params.wallet,
        saveMutex: params.saveMutex,
        keyDeriver,
        requestParams: {
          addressIndex,
          deploy: true,
          chainId: requestParamsObj.chainId,
        },
      };
      await createAccount(createAccountApiParams, true);
    }

    //In case this is the first transaction we assign a nonce of 1 to make sure it does after the deploy transaction
    const nonceSendTransaction = accountDeployed ? undefined : 1;
    const txnResp = useOldAccounts
      ? await executeTxn_v4_6_0(network, senderAddress, senderPrivateKey, txnInvocation, maxFee, nonceSendTransaction)
      : await executeTxn(network, senderAddress, senderPrivateKey, txnInvocation, maxFee, nonceSendTransaction);

    console.log(`sendTransaction:\ntxnResp: ${JSON.stringify(txnResp)}`);

    if (txnResp.transaction_hash) {
      const txn: Transaction = {
        txnHash: txnResp.transaction_hash,
        txnType: VoyagerTransactionType.INVOKE,
        chainId: network.chainId,
        senderAddress,
        contractAddress,
        contractFuncName,
        contractCallData: contractCallData.map((data: num.BigNumberish) => num.toHex(num.toBigInt(data))),
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
