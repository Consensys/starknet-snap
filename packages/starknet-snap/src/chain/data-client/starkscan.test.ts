import { TransactionType, constants } from 'starknet';

import {
  generateAccounts,
  generateStarkScanTranscations,
} from '../../__tests__/helper';
import type { Network, Transaction } from '../../types/snapState';
import {
  STARKNET_MAINNET_NETWORK,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from '../../utils/constants';
import type { StarkScanOptions } from './starkscan';
import { StarkScanClient, type StarkScanTransaction } from './starkscan';

describe('StarkScanClient', () => {
  class MockStarkScanClient extends StarkScanClient {
    public toTransaction(data: StarkScanTransaction): Transaction {
      return super.toTransaction(data);
    }

    get baseUrl(): string {
      return super.baseUrl;
    }

    async get<Resp>(url: string): Promise<Resp> {
      return super.get<Resp>(url);
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

  const mSecsFor24Hours = 1000 * 60 * 60 * 24;

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

    it('throws `Invalid Network` error if the chain id is invalid', () => {
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

      expect(() => client.baseUrl).toThrow('Invalid Network');
    });
  });

  describe('get', () => {
    it('fetches data', async () => {
      const { fetchSpy } = createMockFetch();
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'data' }),
      });

      const client = createMockClient();
      const result = await client.get(`${client.baseUrl}/url`);

      expect(result).toStrictEqual({ data: 'data' });
    });

    it('append api key to header', async () => {
      const { fetchSpy } = createMockFetch();
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'data' }),
      });
      const apiKey = 'ABCDEFG-API-KEY';

      const client = createMockClient({
        options: {
          apiKey,
        },
      });
      await client.get(`${client.baseUrl}/url`);

      expect(fetchSpy).toHaveBeenCalledWith(`${client.baseUrl}/url`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
        },
      });
    });

    it('throws `Failed to fetch data` error if the response.ok is falsy', async () => {
      const { fetchSpy } = createMockFetch();
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        statusText: 'error',
      });

      const client = createMockClient();

      await expect(client.get(`${client.baseUrl}/url`)).rejects.toThrow(
        `Failed to fetch data: error`,
      );
    });
  });

  describe('getTransactions', () => {
    const getFromAndToTimestamp = (tillToInDay: number) => {
      const from = Date.now();
      const to = from - mSecsFor24Hours * tillToInDay;
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
      const mockResponse = generateStarkScanTranscations({
        address: account.address,
        startFrom: from,
        timestampReduction: mSecsFor24Hours,
      });
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

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

    it('continue to fetch if next_url is presented', async () => {
      const account = await mockAccount();
      const { fetchSpy } = createMockFetch();
      // generate the to timestamp which is 100 days ago
      const { to } = getFromAndToTimestamp(100);
      // generate 10 invoke transactions within 100 days if the timestamp is not provided
      const mockPage1Response = generateStarkScanTranscations({
        address: account.address,
        txnTypes: [TransactionType.INVOKE],
        cnt: 10,
      });
      // generate another 10 invoke + deploy transactions within 100 days if the timestamp is not provided
      const mockPage2Response = generateStarkScanTranscations({
        address: account.address,
        cnt: 10,
      });
      const firstPageUrl = `https://api-sepolia.starkscan.co/api/v0/transactions?contract_address=${account.address}&order_by=desc&limit=100`;
      const nextPageUrl = `https://api-sepolia.starkscan.co/api/v0/transactions?contract_address=${account.address}&order_by=desc&cursor=MTcyNDc1OTQwNzAwMDAwNjAwMDAwMA%3D%3D`;
      const fetchOptions = {
        method: 'GET',
        headers: {
          'x-api-key': 'api-key',
        },
      };

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: mockPage1Response.data,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          next_url: nextPageUrl,
        }),
      });
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockPage2Response),
      });

      const client = createMockClient();
      await client.getTransactions(account.address, to);

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(fetchSpy).toHaveBeenNthCalledWith(1, firstPageUrl, fetchOptions);
      expect(fetchSpy).toHaveBeenNthCalledWith(2, nextPageUrl, fetchOptions);
    });

    it('fetchs the deploy transaction if it is not present', async () => {
      const account = await mockAccount();
      const { fetchSpy } = createMockFetch();
      const { from, to } = getFromAndToTimestamp(5);
      // generate 10 invoke transactions
      const mockInvokeResponse = generateStarkScanTranscations({
        address: account.address,
        startFrom: from,
        timestampReduction: mSecsFor24Hours,
        txnTypes: [TransactionType.INVOKE],
      });
      // generate 5 invoke transactions + deploy transactions
      const mockDeployResponse = generateStarkScanTranscations({
        address: account.address,
        // generate transactions which not overlap with above invoke transactions
        startFrom: from - mSecsFor24Hours * 100,
        timestampReduction: mSecsFor24Hours,
        txnTypes: [TransactionType.INVOKE, TransactionType.DEPLOY_ACCOUNT],
        cnt: 5,
      });
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockInvokeResponse),
      });
      fetchSpy.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockDeployResponse),
      });

      const client = createMockClient();
      // We only fetch the transactions from the last 5 days
      const result = await client.getTransactions(account.address, to);

      // However the result should include a deploy transaction, even the deploy transaction is not in the last 5 days
      expect(
        result.find((tx) => tx.txnType === TransactionType.DEPLOY_ACCOUNT),
      ).toBeDefined();
    });
  });

  describe('toTransaction', () => {
    const mockTxByType = (txnType: TransactionType, address: string) => {
      const mockResponse = generateStarkScanTranscations({
        address,
        txnTypes: [txnType],
        cnt: 1,
      });
      const tx = mockResponse.data[0];
      return tx;
    };

    it('converts an invoke type starkscan transaction to a transaction object', async () => {
      const account = await mockAccount();
      const mockTx = mockTxByType(TransactionType.INVOKE, account.address);

      const client = createMockClient();
      const result = client.toTransaction(mockTx);

      const {
        contract_address: contract,
        selector_name: contractFuncName,
        calldata: contractCallData,
      } = mockTx.account_calls[0];

      expect(result).toStrictEqual({
        txnHash: mockTx.transaction_hash,
        txnType: mockTx.transaction_type,
        chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
        senderAddress: account.address,
        contractAddress: '',
        contractFuncName: '',
        contractCallData: mockTx.calldata,
        timestamp: mockTx.timestamp,
        finalityStatus: mockTx.transaction_finality_status,
        executionStatus: mockTx.transaction_execution_status,
        failureReason: mockTx.revert_error ?? undefined,
        maxFee: mockTx.max_fee,
        actualFee: mockTx.actual_fee,
        accountCalls: {
          [contract]: [
            {
              contract,
              contractFuncName,
              contractCallData,
              recipient: contractCallData[0],
              amount: contractCallData[1],
            },
          ],
        },
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
        contractFuncName: '',
        contractCallData: [],
        timestamp: mockTx.timestamp,
        finalityStatus: mockTx.transaction_finality_status,
        executionStatus: mockTx.transaction_execution_status,
        failureReason: mockTx.revert_error ?? undefined,
        maxFee: mockTx.max_fee,
        actualFee: mockTx.actual_fee,
        accountCalls: undefined,
      });
    });
  });

  describe('getDeployTransaction', () => {
    it('returns a deploy transaction', async () => {
      const account = await mockAccount();
      const { fetchSpy } = createMockFetch();
      // generate 5 invoke transactions with deploy transaction
      const mockResponse = generateStarkScanTranscations({
        address: account.address,
        cnt: 5,
      });
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = createMockClient();
      const result = await client.getDeployTransaction(account.address);

      expect(result.txnType).toStrictEqual(TransactionType.DEPLOY_ACCOUNT);
    });

    it('throws `Deploy transaction not found` error if no deploy transaction found', async () => {
      const account = await mockAccount();
      const { fetchSpy } = createMockFetch();
      // generate 5 invoke transactions with deploy transaction
      const mockResponse = generateStarkScanTranscations({
        address: account.address,
        cnt: 1,
        txnTypes: [TransactionType.INVOKE],
      });
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const client = createMockClient();

      await expect(
        client.getDeployTransaction(account.address),
      ).rejects.toThrow('Deploy transaction not found');
    });
  });
});
