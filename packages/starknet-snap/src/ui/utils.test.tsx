import type { constants } from 'starknet';

import { generateAccounts } from '../__tests__/helper';
import type { Erc20Token, FormattedCallData } from '../types/snapState';
import {
  DEFAULT_DECIMAL_PLACES,
  BlockIdentifierEnum,
  ETHER_MAINNET,
  ETHER_SEPOLIA_TESTNET,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
  USDC_SEPOLIA_TESTNET,
} from '../utils/constants';
import * as starknetUtils from '../utils/starknetUtils';
import { accumulateTotals, hasSufficientFundsForFee } from './utils';

describe('accumulateTotals', () => {
  const mockCalls = (overrides = [{}]) =>
    [
      {
        tokenTransferData: {
          amount: '1000000000000000000', // 1 ETH as string BigInt
          symbol: 'ETH',
          decimals: 18,
          ...overrides[0],
        },
      },
      {
        tokenTransferData: {
          amount: '500000000000000000', // 0.5 ETH as string BigInt
          symbol: 'ETH',
          decimals: 18,
          ...overrides[1],
        },
      },
      {
        tokenTransferData: {
          amount: '2000000000000000000', // 2 STRK as string BigInt
          symbol: 'STRK',
          decimals: 18,
          ...overrides[2],
        },
      },
    ] as FormattedCallData[];

  const mockMaxFee = '100000000000000000'; // 0.1 token fee

  it.each([
    {
      selectedFeeToken: 'ETH',
      expectedResult: {
        ETH: {
          amount: BigInt('1600000000000000000'), // 1 + 0.5 + 0.1 ETH
          decimals: 18,
        },
        STRK: {
          amount: BigInt('2000000000000000000'), // 2 STRK
          decimals: 18,
        },
      },
    },
    {
      selectedFeeToken: 'STRK',
      expectedResult: {
        ETH: {
          amount: BigInt('1500000000000000000'), // 1 + 0.5 ETH
          decimals: 18,
        },
        STRK: {
          amount: BigInt('2100000000000000000'), // 2 + 0.1 STRK
          decimals: 18,
        },
      },
    },
  ])(
    'sums up transfer amounts for $selectedFeeToken',
    ({ selectedFeeToken, expectedResult }) => {
      const calls = mockCalls();

      const result = accumulateTotals(calls, mockMaxFee, selectedFeeToken);

      expect(result).toStrictEqual(expectedResult);
    },
  );

  it('creates a new token entry if the fee token was not part of calls', () => {
    const calls = mockCalls();
    const selectedFeeToken = 'STRK';

    const result = accumulateTotals(calls, mockMaxFee, selectedFeeToken);

    expect(result).toStrictEqual({
      ETH: {
        amount: BigInt('1500000000000000000'), // 1 + 0.5 ETH
        decimals: 18,
      },
      STRK: {
        amount: BigInt('2100000000000000000'), // 2 + 0.1 STRK
        decimals: 18,
      },
    });
  });

  it('handles no calls gracefully', () => {
    const calls = [];
    const selectedFeeToken = 'ETH';

    const result = accumulateTotals(calls, mockMaxFee, selectedFeeToken);

    expect(result).toStrictEqual({
      ETH: {
        amount: BigInt('100000000000000000'), // 0.1 ETH (fee only)
        decimals: DEFAULT_DECIMAL_PLACES,
      },
    });
  });
});

describe('hasSufficientFundsForFee', () => {
  const prepareSpy = () => {
    const getBalanceSpy = jest.spyOn(starknetUtils, 'getBalance');
    return { getBalanceSpy };
  };

  const generateFormattedCallData = (
    cnt: number,
    {
      token = ETHER_MAINNET,
      amount = '1000',
      senderAddress = '',
      recipientAddress = '',
    }: {
      token?: Erc20Token;
      amount?: string;
      senderAddress?: string;
      recipientAddress?: string;
    },
  ): FormattedCallData[] => {
    const calls: FormattedCallData[] = [];
    for (let i = 0; i < cnt; i++) {
      calls.push({
        entrypoint: 'transfer',
        contractAddress: token.address,
        tokenTransferData: {
          amount,
          senderAddress,
          recipientAddress,
          decimals: token.decimals,
          symbol: token.symbol,
        },
      });
    }
    return calls;
  };

  const prepareExecution = async ({
    calls,
    maxFee = '1000',
    feeToken = ETHER_SEPOLIA_TESTNET,
  }: {
    calls: FormattedCallData[];
    maxFee?: string;
    feeToken?: Erc20Token;
  }) => {
    const network = STARKNET_SEPOLIA_TESTNET_NETWORK;
    const [{ address }] = await generateAccounts(
      network.chainId as unknown as constants.StarknetChainId,
      1,
    );

    return {
      feeTokenAddress: feeToken.address,
      suggestedMaxFee: maxFee,
      network,
      address,
      calls,
    };
  };

  it.each([
    {
      calls: generateFormattedCallData(1, {
        amount: '1500',
        token: ETHER_SEPOLIA_TESTNET,
      }),
      feeToken: ETHER_SEPOLIA_TESTNET,
      tokenInCalls: ETHER_SEPOLIA_TESTNET,
    },
    {
      calls: generateFormattedCallData(1, {
        amount: '1500',
        token: USDC_SEPOLIA_TESTNET,
      }),
      feeToken: ETHER_SEPOLIA_TESTNET,
      tokenInCalls: USDC_SEPOLIA_TESTNET,
    },
    {
      calls: [],
      feeToken: ETHER_SEPOLIA_TESTNET,
      tokenInCalls: USDC_SEPOLIA_TESTNET,
    },
  ])(
    'returns true if the fee token balance covers both the calls and fee - feeToken: $feeToken.name, callData length: $calls.length, tokenInCalls: $tokenInCalls.name',
    async ({ calls, feeToken }) => {
      const { getBalanceSpy } = prepareSpy();

      getBalanceSpy.mockResolvedValueOnce('3000'); // Mock fee token balance

      const args = await prepareExecution({
        calls,
        feeToken,
      });

      const result = await hasSufficientFundsForFee(args);

      expect(result).toBe(true);
      expect(getBalanceSpy).toHaveBeenCalledWith(
        args.address,
        args.feeTokenAddress,
        args.network,
        BlockIdentifierEnum.Pending,
      );
    },
  );

  it.each(['2000', '0'])(
    'returns false when balance for fee token is insufficient - balance: %s',
    async (balance) => {
      const { getBalanceSpy } = prepareSpy();

      getBalanceSpy.mockResolvedValueOnce(balance); // Mock fee token balance

      const args = await prepareExecution({
        calls: generateFormattedCallData(1, { amount: '1500' }),
      });

      const result = await hasSufficientFundsForFee(args);

      expect(result).toBe(false);
    },
  );
});
