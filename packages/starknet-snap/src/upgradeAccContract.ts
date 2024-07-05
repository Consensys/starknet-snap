import { toJson } from './utils/serializer';
import { num, constants, CallData, EstimateFee, TransactionType, Invocations } from 'starknet';
import { Transaction, TransactionStatus, VoyagerTransactionType } from './types/snapState';
import {
  getKeysFromAddress,
  validateAndParseAddress,
  isUpgradeRequired,
  executeTxn,
  isAccountDeployed,
  getUpgradeTxnInvocation,
  estimateAccountUpgradeFee,
  getAccContractAddressAndCallDataLegacy,
  estimateAccountDeployFee,
  estimateFeeBulk,
  addFeesFromAllTransactions,
} from './utils/starknetUtils';
import { getNetworkFromChainId, upsertTransaction, getSendTxnText } from './utils/snapUtils';
import { ApiParams, UpgradeTransactionRequestParams } from './types/snapApi';
import { ACCOUNT_CLASS_HASH, CAIRO_VERSION_LEGACY, PROXY_CONTRACT_HASH } from './utils/constants';
import { heading, panel, DialogType } from '@metamask/snaps-sdk';
import { logger } from './utils/logger';
import { createAccount } from './createAccount';

export async function upgradeAccContract(params: ApiParams) {
  try {
    const { state, wallet, saveMutex, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as UpgradeTransactionRequestParams;
    const contractAddress = requestParamsObj.contractAddress;
    const chainId = requestParamsObj.chainId;
    const forceDeploy = requestParamsObj.forceDeploy;
    if (!contractAddress) {
      throw new Error(`The given contract address need to be non-empty string, got: ${toJson(requestParamsObj)}`);
    }
    try {
      validateAndParseAddress(contractAddress);
    } catch (err) {
      throw new Error(`The given contract address is invalid: ${contractAddress}`);
    }

    const network = getNetworkFromChainId(state, chainId);

    if (!forceDeploy) {
      if (!(await isAccountDeployed(network, contractAddress))) {
        throw new Error('Contract is not deployed and address has no balance');
      }

      if (!(await isUpgradeRequired(network, contractAddress))) {
        throw new Error('Upgrade is not required');
      }
    }
    const { privateKey, addressIndex, publicKey } = await getKeysFromAddress(keyDeriver, network, state, contractAddress);
    
    const upgradeAccountpayload = getUpgradeTxnInvocation(contractAddress)    
    const bulkTransactions: Invocations =[];
    // [TODO] This fails.
    // const bulkTransactions: Invocations =[
    //   {
    //     type: TransactionType.INVOKE,
    //     payload: upgradeAccountpayload,
    //   }];
    
    const accountDeployed = await isAccountDeployed(network, contractAddress);
    if (forceDeploy) {
      if (accountDeployed) {
        throw new Error(`Upgrade with Force Deploy cannot be executed on deployed account`);
      }
    
      const { callData } = getAccContractAddressAndCallDataLegacy(publicKey);
      const deployAccountpayload = {
        classHash: PROXY_CONTRACT_HASH,
        contractAddress: contractAddress,
        constructorCalldata: callData,
        addressSalt: publicKey,
      };

      bulkTransactions.unshift({
        type: TransactionType.DEPLOY_ACCOUNT,
        payload: deployAccountpayload,
      });
    }
    
    const fees = await estimateFeeBulk(
      network,
      contractAddress,
      privateKey,
      bulkTransactions,
      undefined,
    );

    const estimateFeeResp = addFeesFromAllTransactions(fees);

    const maxFee = estimateFeeResp.suggestedMaxFee.toString(10);
    logger.log(`MaxFee: ${maxFee}`);

    if (forceDeploy) {
      //Deploy account before sending the upgrade transaction
      logger.log('upgradeAccContract:\nFirst transaction : send deploy transaction');
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
      await createAccount(createAccountApiParams, false, true, CAIRO_VERSION_LEGACY);
    }

    //In case we forceDeployed we assign a nonce of 1 to make sure it does after the deploy transaction
    const nonce = forceDeploy ? 1 : undefined;

    const method = 'upgrade';

    const calldata = CallData.compile({
      implementation: ACCOUNT_CLASS_HASH,
      calldata: [0],
    });

    const txnInvocation = getUpgradeTxnInvocation(contractAddress);
    const dialogComponents = getSendTxnText(state, contractAddress, method, calldata, contractAddress, maxFee, network);
    const response = await wallet.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Confirmation,
        content: panel([heading('Do you want to sign this transaction ?'), ...dialogComponents]),
      },
    });

    if (!response) return false;

    logger.log(`upgradeAccContract:\ntxnInvocation: ${toJson(txnInvocation)}\nmaxFee: ${maxFee.toString()}}`);

    const txnResp = await executeTxn(
      network,
      contractAddress,
      privateKey,
      txnInvocation,
      undefined,
      {
        maxFee,
        nonce,
      },
      CAIRO_VERSION_LEGACY,
    );

    logger.log(`upgradeAccContract:\ntxnResp: ${toJson(txnResp)}`);

    if (!txnResp?.transaction_hash) {
      throw new Error(`Transaction hash is not found`);
    }

    const txn: Transaction = {
      txnHash: txnResp.transaction_hash,
      txnType: VoyagerTransactionType.INVOKE,
      chainId: network.chainId,
      senderAddress: contractAddress,
      contractAddress,
      contractFuncName: 'upgrade',
      contractCallData: CallData.compile(calldata),
      finalityStatus: TransactionStatus.RECEIVED,
      executionStatus: TransactionStatus.RECEIVED,
      status: '', //DEPRECATED LATER
      failureReason: '',
      eventIds: [],
      timestamp: Math.floor(Date.now() / 1000),
    };

    await upsertTransaction(txn, wallet, saveMutex);

    return txnResp;
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
