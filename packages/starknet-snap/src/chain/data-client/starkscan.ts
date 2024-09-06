import {
  TransactionType,
  type TransactionFinalityStatus,
  type TransactionExecutionStatus,
  constants,
} from 'starknet';

import type {
  Network,
  Transaction,
  TranscationAccountCall,
} from '../../types/snapState';
import type { IDataClient } from '../data-client';

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

export type StarkScanTransactionsResponse = {
  next_url: string | null;
  data: StarkScanTransaction[];
};

export type StarkScanOptions = {
  apiKey: string;
};
/* eslint-enable */

export class StarkScanClient implements IDataClient {
  protected network: Network;

  protected options: StarkScanOptions;

  protected deploySelectorName = 'constructor';

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

  /**
   * Fetches the transactions for a given contract address.
   * The transactions are fetched in descending order and it will include the deploy transaction.
   *
   * @param address - The address of the contract to fetch the transactions for.
   * @param tillTo - The timestamp to fetch the transactions until.
   * @returns A Promise that resolve an array of Transaction object.
   */
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
      const deployTx = await this.getDeployTransaction(address);
      deployTx && txs.push(deployTx);
    }

    return txs;
  }

  /**
   * Fetches the deploy transaction for a given contract address.
   *
   * @param address - The address of the contract to fetch the deploy transaction for.
   * @returns A Promise that resolve the Transaction object or null if the transaction can not be found.
   */
  async getDeployTransaction(address: string): Promise<Transaction | null> {
    // Fetch the first 5 transactions to find the deploy transaction
    // The deploy transaction usually is the first transaction from the list
    const apiUrl = this.getApiUrl(
      `/transactions?contract_address=${address}&order_by=asc&limit=5`,
    );

    const result = await this.get<StarkScanTransactionsResponse>(apiUrl);

    for (const data of result.data) {
      if (this.isDeployTransaction(data)) {
        return this.toTransaction(data);
      }
    }

    return null;
  }

  protected isDeployTransaction(tx: StarkScanTransaction): boolean {
    return tx.transaction_type === TransactionType.DEPLOY_ACCOUNT;
  }

  protected isFundTransferTransaction(call: StarkScanAccountCall): boolean {
    return call.selector_name === 'transfer';
  }

  protected toTransaction(tx: StarkScanTransaction): Transaction {
    let sender = tx.sender_address ?? '';

    // account_calls representing the calls to invoke from the account contract, it can be multiple
    const accountCalls = this.toAccountCall(tx.account_calls);

    // eslint-disable-next-line no-negated-condition
    if (this.isDeployTransaction(tx)) {
      // In case of deploy transaction, the contract address is the sender address
      sender = tx.contract_address as unknown as string;
    }

    /* eslint-disable */
    return {
      txnHash: tx.transaction_hash,
      txnType: tx.transaction_type,
      chainId: this.network.chainId,
      senderAddress: sender,

      // In case of deploy transaction, the contract address is the sender address, else it will be empty string
      contractAddress: tx.contract_address ?? '',
      // TODO: when multiple calls are supported, we move this to accountCalls
      contractFuncName: '',
      // TODO: when multiple calls are supported, we move this to accountCalls
      contractCallData: tx.calldata ?? [],
      timestamp: tx.timestamp,
      finalityStatus: tx.transaction_finality_status,
      executionStatus: tx.transaction_execution_status,
      failureReason: tx.revert_error ?? '',
      maxFee: tx.max_fee,
      actualFee: tx.actual_fee,
      accountCalls: accountCalls,
    };
    /* eslint-enable */
  }

  protected toAccountCall(
    calls: StarkScanAccountCall[],
  ): Record<string, TranscationAccountCall[]> | null {
    if (!calls || calls.length === 0) {
      return null;
    }

    return calls.reduce(
      (
        data: Record<string, TranscationAccountCall[]>,
        accountCallArg: StarkScanAccountCall,
      ) => {
        const {
          contract_address: contract,
          selector_name: contractFuncName,
          calldata: contractCallData,
        } = accountCallArg;

        if (!Object.prototype.hasOwnProperty.call(data, contract)) {
          data[contract] = [];
        }

        const accountCall: TranscationAccountCall = {
          contract,
          contractFuncName,
          contractCallData,
        };

        if (this.isFundTransferTransaction(accountCallArg)) {
          accountCall.recipient = accountCallArg.calldata[0];
          accountCall.amount = accountCallArg.calldata[1];
        }

        data[contract].push(accountCall);

        return data;
      },
      {},
    );
  }
}
