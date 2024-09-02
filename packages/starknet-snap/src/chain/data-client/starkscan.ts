import {
  TransactionType,
  type TransactionFinalityStatus,
  type TransactionExecutionStatus,
  constants,
} from 'starknet';

import type { Network, Transaction } from '../../types/snapState';

/* eslint-disable */
export type StarkScanTransaction = {
  transaction_hash: string;
  block_hash: string;
  block_number: number;
  transaction_index: number;
  transaction_status: string;
  transaction_finality_status: TransactionExecutionStatus;
  transaction_execution_status: TransactionFinalityStatus;
  transaction_type: TransactionType;
  version: number;
  signature: string[];
  max_fee: string;
  actual_fee: string;
  nonce: string;
  contract_address: string | null;
  entry_point_selector: string | null;
  entry_point_type: string | null;
  calldata: string[];
  class_hash: string | null;
  sender_address: string | null;
  constructor_calldata: string[] | null;
  contract_address_salt: string | null;
  timestamp: number;
  entry_point_selector_name: string;
  number_of_events: number;
  revert_error: string | null;
  account_calls: StarkScanAccountCall[];
};

export type StarkScanAccountCall = {
  block_hash: string;
  block_number: number;
  transaction_hash: string;
  caller_address: string;
  contract_address: string;
  calldata: string[];
  result: string[];
  timestamp: number;
  call_type: string;
  class_hash: string;
  selector: string;
  entry_point_type: string;
  selector_name: string;
};
/* eslint-disable */

export type StarkScanTransactionsResponse = {
  next_url: string | null;
  data: StarkScanTransaction[];
};

export type StarkScanOptions = {
  apiKey: string;
};

export class StarkScanClient {
  protected network: Network;
  protected options: StarkScanOptions;

  protected deploySelectorName: string = 'constructor';

  constructor(network: Network, options: StarkScanOptions) {
    this.network = network;
    this.options = options;
  }

  protected get baseUrl(): string {
    switch (this.network.chainId) {
      case constants.StarknetChainId.SN_SEPOLIA:
        return 'https://api-sepolia.starkscan.co/api/v0';
      case constants.StarknetChainId.SN_MAIN:
        return 'https://api.starkscan.co/api/v0';
      default:
        throw new Error(`Invalid Network`);
    }
  }

  protected getApiUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }

  protected getCredential(): Record<string, string> {
    return {
      'x-api-key': this.options.apiKey,
    };
  }

  protected async get<Resp>(url: string): Promise<Resp> {
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getCredential(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    return response.json() as unknown as Resp;
  }

  async getTransactions(
    address: string,
    tillTo: number,
  ): Promise<Transaction[]> {
    let apiUrl = this.getApiUrl(
      `/transactions?contract_address=${address}&order_by=desc&limit=100`,
    );

    const txs: Transaction[] = [];
    let deployTxFound = false;
    let process = true;
    let timestamp = 0;

    // Fetch the transactions if:
    // - the timestamp is greater than the `tillTo` AND
    // - there is an next data to fetch
    while (process && (timestamp === 0 || timestamp >= tillTo)) {
      process = false;

      const result = await this.get<StarkScanTransactionsResponse>(apiUrl);

      for (const data of result.data) {
        const tx = this.toTransaction(data);
        const isDeployTx = this.isDeployTransaction(data);

        if (isDeployTx) {
          deployTxFound = true;
        }

        timestamp = tx.timestamp;
        // If the timestamp is smaller than the `tillTo`
        // We don't need those records
        // But if the record is an deploy transaction, we should include it to reduce the number of requests
        if (timestamp >= tillTo || isDeployTx) {
          txs.push(tx);
        }
      }

      if (result.next_url) {
        apiUrl = result.next_url;
        process = true;
      }
    }

    // If the deploy transaction is not found from above traverse, we need to fetch it separately
    if (!deployTxFound) {
      txs.push(await this.getDeployTransaction(address));
    }

    return txs;
  }

  async getDeployTransaction(address: string): Promise<Transaction> {
    // Fetch the first 5 transactions to find the deploy transaction
    // The deploy transaction usually is the first transaction from the list
    let apiUrl = this.getApiUrl(
      `/transactions?contract_address=${address}&order_by=asc&limit=5`,
    );

    const result = await this.get<StarkScanTransactionsResponse>(apiUrl);

    for (const data of result.data) {
      if (this.isDeployTransaction(data)) {
        return this.toTransaction(data);
      }
    }

    throw new Error(`Deploy transaction not found`);
  }

  protected isDeployTransaction(tx: StarkScanTransaction): boolean {
    return tx.transaction_type === TransactionType.DEPLOY_ACCOUNT;
  }

  protected toTransaction(tx: StarkScanTransaction): Transaction {
    let sender: string,
      contract: string,
      contractFuncName: string,
      contractCallData: null | string[];
    /* eslint-disable */
    if (!this.isDeployTransaction(tx)) {
      // When an account deployed, it invokes the transaction from the account contract, hence the account_calls[0] is the main invoke call from the contract
      const contractCallArg = tx.account_calls[0];

      sender = contractCallArg.caller_address;
      contract = contractCallArg.contract_address;
      contractFuncName = contractCallArg.selector_name;
      contractCallData = contractCallArg.calldata;
    } else {
      // In case of deploy transaction, the contract address is the sender address
      contract = sender = tx.contract_address as unknown as string;

      contractFuncName = '';
      // In case of deploy transaction, the contract call data is the constructor calldata
      contractCallData = tx.constructor_calldata;
    }

    return {
      txnHash: tx.transaction_hash,
      txnType: tx.transaction_type,
      chainId: this.network.chainId,
      senderAddress: sender,
      contractAddress: contract,
      contractFuncName: contractFuncName,
      contractCallData: contractCallData ?? [],
      timestamp: tx.timestamp,
      finalityStatus: tx.transaction_finality_status,
      executionStatus: tx.transaction_execution_status,
      failureReason: tx.revert_error ?? undefined,
      maxFee: BigInt(tx.max_fee),
      actualFee: BigInt(tx.actual_fee),
    };
    /* eslint-disable */
  }
}
