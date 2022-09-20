import { getKeysFromAddressIndex, getAccContractAddressAndCallData, deployContract } from './utils/starknetUtils';
import { getNetworkFromChainId, getValidNumber, upsertAccount, upsertTransaction } from './utils/snapUtils';
import { AccContract, VoyagerTransactionType, Transaction, TransactionStatus } from './types/snapState';
import { ApiParams, CreateAccountRequestParams } from './types/snapApi';
import { PROXY_CONTRACT_STR } from './utils/constants';

export async function createAccount(params: ApiParams) {
  try {
    const { state, wallet, saveMutex, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as CreateAccountRequestParams;

    const addressIndex = getValidNumber(requestParamsObj.addressIndex, -1, 0);
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    const {
      publicKey,
      addressIndex: addressIndexInUsed,
      derivationPath,
    } = await getKeysFromAddressIndex(keyDeriver, network.chainId, state, addressIndex);
    const { address: contractAddress, callData: contractCallData } = getAccContractAddressAndCallData(
      network.accountClassHash,
      publicKey,
    );
    console.log(
      `createAccount:\ncontractAddress = ${contractAddress}\npublicKey = ${publicKey}\naddressIndex = ${addressIndexInUsed}`,
    );

    const deployResp = await deployContract(network, PROXY_CONTRACT_STR, contractCallData, publicKey);

    if (deployResp.contract_address && deployResp.transaction_hash) {
      const userAccount: AccContract = {
        addressSalt: publicKey,
        publicKey,
        address: deployResp.contract_address,
        addressIndex: addressIndexInUsed,
        derivationPath,
        deployTxnHash: deployResp.transaction_hash,
        chainId: network.chainId,
      };

      await upsertAccount(userAccount, wallet, saveMutex);

      const txn: Transaction = {
        txnHash: deployResp.transaction_hash,
        txnType: VoyagerTransactionType.DEPLOY,
        chainId: network.chainId,
        senderAddress: deployResp.contract_address,
        contractAddress: deployResp.contract_address,
        contractFuncName: '',
        contractCallData: [],
        status: TransactionStatus.RECEIVED,
        failureReason: '',
        eventIds: [],
        timestamp: Math.floor(Date.now() / 1000),
      };

      await upsertTransaction(txn, wallet, saveMutex);
    }

    console.log(`createAccount:\ndeployResp: ${JSON.stringify(deployResp)}`);

    return {
      address: deployResp.contract_address,
      transaction_hash: deployResp.transaction_hash,
    };
  } catch (err) {
    console.error(`Problem found: ${err}`);
    throw err;
  }
}
