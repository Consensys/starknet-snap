import { getKeysFromAddressIndex, getAccContractAddressAndCallData, deployContract } from './utils/starknetUtils';
import { getNetworkFromChainId, upsertAccount, upsertTransaction } from './utils/snapUtils';
import { AccContract, VoyagerTransactionType, Transaction, TransactionStatus } from './types/snapState';
import { ApiParams, CreateAccountRequestParams } from './types/snapApi';
import { PROXY_CONTRACT_STR } from './utils/constants';

export async function createAccount(params: ApiParams) {
  try {
    const { state, wallet, saveMutex, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as CreateAccountRequestParams;

    const network = getNetworkFromChainId(state, requestParamsObj.chainId);

    const { publicKey, addressIndex, derivationPath } = await getKeysFromAddressIndex(
      keyDeriver,
      network.chainId,
      state,
    );
    const { address: contractAddress, callData: contractCallData } = getAccContractAddressAndCallData(
      network.accountClassHash,
      publicKey,
    );
    console.log(`createAccount:\ncontractAddress = ${contractAddress}\npublicKey = ${publicKey}`);

    const deployResp = await deployContract(network, PROXY_CONTRACT_STR, contractCallData, publicKey);

    if (deployResp.contract_address && deployResp.transaction_hash) {
      const userAccount: AccContract = {
        addressSalt: publicKey,
        publicKey,
        address: deployResp.contract_address,
        addressIndex,
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

    return deployResp;
  } catch (err) {
    console.error(`Problem found: ${err}`);
    throw err;
  }
}
