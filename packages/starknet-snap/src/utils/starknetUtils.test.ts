import type { EstimateFee, Invocations } from 'starknet';
import { constants, TransactionType } from 'starknet';

import { getEstimateFees } from '../__tests__/helper';
import { mockAccount, prepareMockAccount } from '../rpcs/__tests__/helper';
import { TokenStateManager } from '../state/token-state-manager';
import { FeeToken, FeeTokenUnit } from '../types/snapApi';
import type { Network, SnapState } from '../types/snapState';
import type { TransactionVersion } from '../types/starknet';
import {
  BlockIdentifierEnum,
  ETHER_SEPOLIA_TESTNET,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
  STRK_SEPOLIA_TESTNET,
} from './constants';
import * as starknetUtils from './starknetUtils';
import { hasSufficientFunds } from './starknetUtils';

// Mock the class itself
jest.mock('../state/token-state-manager');

describe('hasSufficientFunds', () => {
  const mockAddress = '0xTestAddress';
  const mockNetwork = { chainId: '1' } as Network;
  const mockSuggestedMaxFee = '1000';

  // Utility function to prepare and return spies
  /**
   *
   */
  function prepareSpy() {
    const getBalanceSpy = jest.spyOn(starknetUtils, 'getBalance');

    jest
      .spyOn(TokenStateManager.prototype, 'getStrkToken')
      .mockResolvedValue(STRK_SEPOLIA_TESTNET);

    jest
      .spyOn(TokenStateManager.prototype, 'getEthToken')
      .mockResolvedValue(ETHER_SEPOLIA_TESTNET);

    return { getBalanceSpy };
  }

  it('returns true when STRK balance is sufficient for calls and fee', async () => {
    const { getBalanceSpy } = prepareSpy();

    getBalanceSpy.mockResolvedValueOnce('2000'); // Mock STRK balance
    getBalanceSpy.mockResolvedValueOnce('500'); // Mock ETH balance

    const result = await hasSufficientFunds(
      mockAddress,
      mockNetwork,
      [{ contractAddress: STRK_SEPOLIA_TESTNET.address, amount: '500' }],
      FeeToken.STRK,
      mockSuggestedMaxFee,
    );

    expect(result).toBe(true);
    expect(getBalanceSpy).toHaveBeenCalledWith(
      mockAddress,
      STRK_SEPOLIA_TESTNET.address,
      mockNetwork,
      BlockIdentifierEnum.Pending,
    );
  });

  it('returns false when STRK balance is insufficient', async () => {
    const { getBalanceSpy } = prepareSpy();
    getBalanceSpy.mockResolvedValueOnce('1000'); // Mock STRK balance
    getBalanceSpy.mockResolvedValueOnce('500'); // Mock ETH balance

    const result = await hasSufficientFunds(
      mockAddress,
      mockNetwork,
      [{ contractAddress: STRK_SEPOLIA_TESTNET.address, amount: '1500' }],
      FeeToken.STRK,
      mockSuggestedMaxFee,
    );

    expect(result).toBe(false);
  });

  it('returns true when ETH balance is sufficient for calls and fee', async () => {
    const { getBalanceSpy } = prepareSpy();
    getBalanceSpy.mockResolvedValueOnce('500'); // Mock STRK balance
    getBalanceSpy.mockResolvedValueOnce('2000'); // Mock ETH balance

    const result = await hasSufficientFunds(
      mockAddress,
      mockNetwork,
      [{ contractAddress: ETHER_SEPOLIA_TESTNET.address, amount: '500' }],
      FeeToken.ETH,
      mockSuggestedMaxFee,
    );

    expect(result).toBe(true);
    expect(getBalanceSpy).toHaveBeenCalledWith(
      mockAddress,
      ETHER_SEPOLIA_TESTNET.address,
      mockNetwork,
      BlockIdentifierEnum.Pending,
    );
  });

  it('returns false when ETH balance is insufficient', async () => {
    const { getBalanceSpy } = prepareSpy();
    getBalanceSpy.mockResolvedValueOnce('500'); // Mock STRK balance
    getBalanceSpy.mockResolvedValueOnce('1000'); // Mock ETH balance

    const result = await hasSufficientFunds(
      mockAddress,
      mockNetwork,
      [{ contractAddress: ETHER_SEPOLIA_TESTNET.address, amount: '1500' }],
      FeeToken.ETH,
      mockSuggestedMaxFee,
    );

    expect(result).toBe(false);
  });
});

describe('getEstimatedFees', () => {
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  const suggestedMaxFee = BigInt('0xc');
  const overallFee = BigInt('0xa');

  const prepareSpy = async (deployed: boolean) => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);

    const invocations: Invocations = [
      {
        type: TransactionType.INVOKE,
        payload: {
          contractAddress:
            '0x00b28a089e7fb83debee4607b6334d687918644796b47d9e9e38ea8213833137',
          entrypoint: 'functionName',
          calldata: ['1', '1'],
        },
      },
    ];

    prepareMockAccount(account, state);
    const accountDeployedSpy = jest.spyOn(starknetUtils, 'isAccountDeployed');
    accountDeployedSpy.mockResolvedValue(deployed);

    const estimateResults = getEstimateFees();
    const { resourceBounds } = estimateResults[0];

    const estimateFeeResp = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      overall_fee: overallFee,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      gas_consumed: BigInt('0x0'),
      suggestedMaxFee,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      gas_price: BigInt('0x0'),
      resourceBounds,
    } as unknown as EstimateFee;
    const estimateBulkFeeSpy = jest.spyOn(starknetUtils, 'estimateFeeBulk');
    estimateBulkFeeSpy.mockResolvedValue([estimateFeeResp]);

    return {
      account,
      invocations,
      accountDeployedSpy,
      estimateBulkFeeSpy,
      estimateFeeResp,
    };
  };

  it.each([
    {
      txVersion: constants.TRANSACTION_VERSION.V2,
      expectedUnit: FeeTokenUnit.ETH,
    },
    {
      txVersion: constants.TRANSACTION_VERSION.V3,
      expectedUnit: FeeTokenUnit.STRK,
    },
    {
      txVersion: undefined,
      expectedUnit: FeeTokenUnit.ETH,
    },
  ])(
    'estimates fees correctly and assigns `$expectedUnit` to the unit of the result if the transaction version is $version',
    async ({
      txVersion,
      expectedUnit,
    }: {
      txVersion?: TransactionVersion;
      expectedUnit: FeeTokenUnit;
    }) => {
      const network = STARKNET_SEPOLIA_TESTNET_NETWORK;
      const { account, invocations, estimateBulkFeeSpy, estimateFeeResp } =
        await prepareSpy(true);
      const call = invocations[0];

      const resp = await starknetUtils.getEstimatedFees(
        network,
        account.address,
        account.privateKey,
        account.publicKey,
        [call],
        {
          version: txVersion,
        },
      );

      expect(estimateBulkFeeSpy).toHaveBeenCalledWith(
        network,
        account.address,
        account.privateKey,
        [
          {
            payload: (call as any).payload,
            type: TransactionType.INVOKE,
          },
        ],
        {
          version: txVersion, // to verify if the version is passed to the estimateFeeBulk correctly
        },
      );
      expect(resp).toStrictEqual({
        suggestedMaxFee: suggestedMaxFee.toString(10),
        overallFee: overallFee.toString(10),
        unit: expectedUnit, // to verify if the unit is return correctly
        includeDeploy: false,
        estimateResults: [estimateFeeResp],
      });
    },
  );

  it('estimates fees with account deploy payload if the account is not deployed', async () => {
    const network = STARKNET_SEPOLIA_TESTNET_NETWORK;
    const { account, estimateBulkFeeSpy, estimateFeeResp, invocations } =
      await prepareSpy(false);
    const deployAccountpayload = starknetUtils.createAccountDeployPayload(
      account.address,
      account.publicKey,
    );
    const call = invocations[0];

    const resp = await starknetUtils.getEstimatedFees(
      network,
      account.address,
      account.privateKey,
      account.publicKey,
      [call],
    );

    expect(estimateBulkFeeSpy).toHaveBeenCalledWith(
      network,
      account.address,
      account.privateKey,
      [
        {
          payload: deployAccountpayload,
          type: TransactionType.DEPLOY_ACCOUNT,
        },
        {
          payload: (call as any).payload,
          type: TransactionType.INVOKE,
        },
      ],
      undefined,
    );
    expect(resp).toStrictEqual({
      suggestedMaxFee: suggestedMaxFee.toString(10),
      overallFee: overallFee.toString(10),
      unit: FeeTokenUnit.ETH,
      includeDeploy: true,
      estimateResults: [estimateFeeResp],
    });
  });
});
