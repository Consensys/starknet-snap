import { TransactionType, constants } from 'starknet';

import {
  generateAccounts,
  generateStarkScanTransactions,
} from '../../__tests__/helper';
import {
  ContractFuncName,
  TransactionDataVersion,
  type Network,
  type Transaction,
} from '../../types/snapState';
import {
  STARKNET_MAINNET_NETWORK,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from '../../utils/constants';
import { InvalidNetworkError } from '../../utils/exceptions';
import { StarkScanClient } from './starkscan';
import {
  StarkScanTransactionsResponseStruct,
  type StarkScanOptions,
  type StarkScanTransaction,
  type StarkScanTransactionsResponse,
} from './starkscan.type';

jest.mock('../../utils/logger');

describe('StarkScanClient', () => {
  class MockStarkScanClient extends StarkScanClient {
    public toTransaction(data: StarkScanTransaction): Transaction {
      return super.toTransaction(data);
    }

    get baseUrl(): string {
      return super.baseUrl;
    }

    async sendApiRequest<ApiResponse>(request): Promise<ApiResponse> {
      return await super.sendApiRequest<ApiResponse>(request);
    }

    getSenderAddress(tx: StarkScanTransaction): string {
      return super.getSenderAddress(tx);
    }
  }

  const createMockClient = ({
    network = STARKNET_SEPOLIA_TESTNET_NETWORK,
    options = {
      apiKey: 'api-key',
    },
  }: {
    network?: Network;
    options?: StarkScanOptions;
  } = {}) => {
    return new MockStarkScanClient(network, options);
  };

  const createMockFetch = () => {
    // eslint-disable-next-line no-restricted-globals
    Object.defineProperty(global, 'fetch', {
      writable: true,
    });

    const fetchSpy = jest.fn();
    // eslint-disable-next-line no-restricted-globals
    global.fetch = fetchSpy;

    return {
      fetchSpy,
    };
  };

  const mockAccount = async (
    chainId: constants.StarknetChainId = constants.StarknetChainId.SN_SEPOLIA,
  ) => {
    const [account] = await generateAccounts(chainId, 1);
    return account;
  };

  const mockApiSuccess = ({
    fetchSpy,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    response = { data: [], next_url: null },
  }: {
    fetchSpy: jest.SpyInstance;
    response?: StarkScanTransactionsResponse;
  }) => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(response),
    });
  };

  const mockApiFailure = ({ fetchSpy }: { fetchSpy: jest.SpyInstance }) => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      statusText: 'error',
    });
  };

  const mockTxByType = (txnType: TransactionType, address: string) => {
    const mockResponse = generateStarkScanTransactions({
      address,
      txnTypes: [txnType],
      cnt: 1,
    });
    const tx = mockResponse.data[0];
    return tx;
  };

  describe('baseUrl', () => {
    it.each([
      {
        network: STARKNET_SEPOLIA_TESTNET_NETWORK,
        expectedUrl: 'https://api-sepolia.starkscan.co/api/v0',
      },
      {
        network: STARKNET_MAINNET_NETWORK,
        expectedUrl: 'https://api.starkscan.co/api/v0',
      },
    ])(
      'returns the api url if the chain id is $network.name',
      ({ network, expectedUrl }: { network: Network; expectedUrl: string }) => {
        const client = createMockClient({
          network,
        });

        expect(client.baseUrl).toStrictEqual(expectedUrl);
      },
    );

    it('throws `InvalidNetworkError` if the chain id is invalid', () => {
      const invalidNetwork: Network = {
        name: 'Invalid Network',
        chainId: '0x534e5f474f45524c49',
        baseUrl: '',
        nodeUrl: '',
        voyagerUrl: '',
        accountClassHash: '',
      };
      const client = createMockClient({
        network: invalidNetwork,
      });

      expect(() => client.baseUrl).toThrow(InvalidNetworkError);
    });
  });

  describe('sendApiRequest', () => {
    const mockRequest = () => {
      return {
        apiUrl: `/url`,
        responseStruct: StarkScanTransactionsResponseStruct,
        requestName: 'getTransactions',
      };
    };

    it('fetches data', async () => {
      const { fetchSpy } = createMockFetch();
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const expectedResponse = { data: [], next_url: null };
      mockApiSuccess({ fetchSpy, response: expectedResponse });

      const client = createMockClient();
      const result = await client.sendApiRequest(mockRequest());

      expect(result).toStrictEqual(expectedResponse);
    });

    it('appends a api key to header', async () => {
      const { fetchSpy } = createMockFetch();
      mockApiSuccess({ fetchSpy });

      const apiKey = 'ABCDEFG-API-KEY';

      const client = createMockClient({
        options: {
          apiKey,
        },
      });
      await client.sendApiRequest(mockRequest());

      expect(fetchSpy).toHaveBeenCalledWith(`/url`, {
        method: 'GET',
        body: undefined,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      });
    });

    it('throws `API response error: response body can not be deserialised.` error if the response.ok is falsy', async () => {
      const { fetchSpy } = createMockFetch();
      mockApiFailure({ fetchSpy });

      const client = createMockClient();
      await expect(client.sendApiRequest(mockRequest())).rejects.toThrow(
        `API response error: response body can not be deserialised.`,
      );
    });
  });

  describe('getTransactions', () => {
    const mSecsFor24Hours = 1000 * 60 * 60 * 24;

    const getFromAndToTimestamp = (tillToInDay: number) => {
      const from = Math.floor(Date.now() / 1000);
      const to = from - tillToInDay * 24 * 60 * 60;
      return {
        from,
        to,
      };
    };

    it('returns transactions', async () => {
      const account = await mockAccount();
      const { fetchSpy } = createMockFetch();
      const { from, to } = getFromAndToTimestamp(5);
      // generate 10 invoke transactions
      const mockResponse = generateStarkScanTransactions({
        address: account.address,
        startFrom: from,
      });
      mockApiSuccess({ fetchSpy, response: mockResponse });

      const client = createMockClient();
      const result = await client.getTransactions(account.address, to);

      // The result should include the transaction if:
      // - it's timestamp is greater than the `tillTo`
      // - it's transaction type is `DEPLOY_ACCOUNT`
      expect(result).toHaveLength(
        mockResponse.data.filter(
          (tx) =>
            tx.transaction_type === TransactionType.DEPLOY_ACCOUNT ||
            tx.timestamp >= to,
        ).length,
      );
      expect(
        result.find((tx) => tx.txnType === TransactionType.DEPLOY_ACCOUNT),
      ).toBeDefined();
    });

    it('returns empty array if no result found', async () => {
      const account = await mockAccount();
      const { fetchSpy } = createMockFetch();
      const { to } = getFromAndToTimestamp(5);
      // mock the get invoke transactions response with empty data
      mockApiSuccess({ fetchSpy });
      // mock the get deploy transaction response with empty data
      mockApiSuccess({ fetchSpy });

      const client = createMockClient();
      const result = await client.getTransactions(account.address, to);

      expect(result).toStrictEqual([]);
    });

    it('continue to fetch if next_url is presented', async () => {
      const account = await mockAccount();
      const { fetchSpy } = createMockFetch();
      // generate the to timestamp which is 100 days ago
      const { to } = getFromAndToTimestamp(100);
      const mockPage1Response = generateStarkScanTransactions({
        address: account.address,
        txnTypes: [TransactionType.INVOKE],
        cnt: 10,
      });
      const mockPage2Response = generateStarkScanTransactions({
        address: account.address,
        cnt: 10,
      });
      const firstPageUrl = `https://api-sepolia.starkscan.co/api/v0/transactions?contract_address=${account.address}&order_by=desc&limit=100`;
      const nextPageUrl = `https://api-sepolia.starkscan.co/api/v0/transactions?contract_address=${account.address}&order_by=desc&cursor=MTcyNDc1OTQwNzAwMDAwNjAwMDAwMA%3D%3D`;

      // mock the first page response, which contains the next_url
      mockApiSuccess({
        fetchSpy,
        response: {
          data: mockPage1Response.data,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          next_url: nextPageUrl,
        },
      });
      // mock the send page response
      mockApiSuccess({ fetchSpy, response: mockPage2Response });

      const client = createMockClient();
      await client.getTransactions(account.address, to);

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(fetchSpy).toHaveBeenNthCalledWith(
        1,
        firstPageUrl,
        expect.any(Object),
      );
      expect(fetchSpy).toHaveBeenNthCalledWith(
        2,
        nextPageUrl,
        expect.any(Object),
      );
    });

    it('fetchs the deploy transaction if it is not present', async () => {
      const account = await mockAccount();
      const { fetchSpy } = createMockFetch();
      // generate the to timestamp which is 5 days ago
      const { from, to } = getFromAndToTimestamp(5);
      // generate 10 invoke transactions, and 1 day time gap between each transaction
      const mockInvokeResponse = generateStarkScanTransactions({
        address: account.address,
        startFrom: from,
        timestampReduction: mSecsFor24Hours,
        txnTypes: [TransactionType.INVOKE],
      });
      // generate another 5 invoke transactions + deploy transactions for testing the fallback case
      const mockDeployResponse = generateStarkScanTransactions({
        address: account.address,
        // generate transactions that start from 100 days ago, to ensure not overlap with above invoke transactions
        startFrom: mSecsFor24Hours * 100,
        timestampReduction: mSecsFor24Hours,
        txnTypes: [TransactionType.INVOKE, TransactionType.DEPLOY_ACCOUNT],
        cnt: 5,
      });
      mockApiSuccess({ fetchSpy, response: mockInvokeResponse });
      mockApiSuccess({ fetchSpy, response: mockDeployResponse });

      const client = createMockClient();
      // We only fetch the transactions from the last 5 days
      const result = await client.getTransactions(account.address, to);

      // The result should include a deploy transaction, even it is not from the last 5 days
      expect(
        result.find((tx) => tx.txnType === TransactionType.DEPLOY_ACCOUNT),
      ).toBeDefined();
    });
  });

  describe('toTransaction', () => {
    it('converts an invoke type starkscan transaction to a transaction object', async () => {
      const account = await mockAccount();
      const mockTx = mockTxByType(TransactionType.INVOKE, account.address);

      const client = createMockClient();
      const result = client.toTransaction(mockTx);

      const { contract_address: contract, calldata: contractCallData } =
        mockTx.account_calls[0];

      expect(result).toStrictEqual({
        txnHash: mockTx.transaction_hash,
        txnType: mockTx.transaction_type,
        chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
        senderAddress: account.address,
        contractAddress: '',
        timestamp: mockTx.timestamp,
        finalityStatus: mockTx.transaction_finality_status,
        executionStatus: mockTx.transaction_execution_status,
        failureReason: mockTx.revert_error ?? '',
        maxFee: mockTx.max_fee,
        actualFee: mockTx.actual_fee,
        accountCalls: {
          [contract]: [
            {
              contract,
              contractFuncName: ContractFuncName.Transfer,
              contractCallData,
              recipient: contractCallData[0],
              amount: contractCallData[1],
            },
          ],
        },
        version: mockTx.version,
        dataVersion: TransactionDataVersion.V2,
      });
    });

    it('converts a deploy type starkscan transaction to a transaction object', async () => {
      const account = await mockAccount();
      const mockTx = mockTxByType(
        TransactionType.DEPLOY_ACCOUNT,
        account.address,
      );

      const client = createMockClient();
      const result = client.toTransaction(mockTx);

      expect(result).toStrictEqual({
        txnHash: mockTx.transaction_hash,
        txnType: mockTx.transaction_type,
        chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
        senderAddress: account.address,
        contractAddress: account.address,
        timestamp: mockTx.timestamp,
        finalityStatus: mockTx.transaction_finality_status,
        executionStatus: mockTx.transaction_execution_status,
        failureReason: mockTx.revert_error ?? '',
        maxFee: mockTx.max_fee,
        actualFee: mockTx.actual_fee,
        accountCalls: null,
        version: mockTx.version,
        dataVersion: TransactionDataVersion.V2,
      });
    });
  });

  describe('getDeployTransaction', () => {
    it('returns a deploy transaction', async () => {
      const account = await mockAccount();
      const { fetchSpy } = createMockFetch();
      // generate 5 invoke transactions with deploy transaction
      const mockResponse = generateStarkScanTransactions({
        address: account.address,
        cnt: 5,
      });
      mockApiSuccess({ fetchSpy, response: mockResponse });

      const client = createMockClient();
      const result = await client.getDeployTransaction(account.address);

      expect(result).not.toBeNull();
      expect(result?.txnType).toStrictEqual(TransactionType.DEPLOY_ACCOUNT);
    });

    it('returns null if no deploy transaction found', async () => {
      const account = await mockAccount();
      const { fetchSpy } = createMockFetch();
      // generate 5 invoke transactions with deploy transaction
      const mockResponse = generateStarkScanTransactions({
        address: account.address,
        cnt: 1,
        txnTypes: [TransactionType.INVOKE],
      });
      mockApiSuccess({ fetchSpy, response: mockResponse });

      const client = createMockClient();
      const result = await client.getDeployTransaction(account.address);

      expect(result).toBeNull();
    });
  });

  describe('getSenderAddress', () => {
    const prepareMockTx = async (transactionType: TransactionType = TransactionType.INVOKE) => {
      const account = await mockAccount();
      const mockTx = mockTxByType(transactionType, account.address);
      return mockTx;
    };

    it('returns the sender address', async () => {
      const mockTx = await prepareMockTx();

      const client = createMockClient();
      expect(client.getSenderAddress(mockTx)).toStrictEqual(
        mockTx.sender_address,
      );
    });

    it('returns the contract address if it is a deploy transaction', async () => {
      const mockTx = await prepareMockTx(TransactionType.DEPLOY_ACCOUNT);

      const client = createMockClient();
      expect(client.getSenderAddress(mockTx)).toStrictEqual(
        mockTx.contract_address,
      );
    });

    it('returns an empty string if the sender address is null', async () => {
      const mockTx = await prepareMockTx();

      const client = createMockClient();
      expect(
        client.getSenderAddress({
          ...mockTx,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          sender_address: null,
        }),
      ).toBe('');
    });
  });
});
