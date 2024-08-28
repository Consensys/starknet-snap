import type { EstimateFee, Invocations } from 'starknet';
import { constants, TransactionType } from 'starknet';

import { mockAccount, prepareMockAccount } from '../rpcs/__tests__/helper';
import { FeeTokenUnit } from '../types/snapApi';
import type { SnapState } from '../types/snapState';
import type { TransactionVersion } from '../types/starknet';
import {
  STARKNET_SEPOLIA_TESTNET_NETWORK,
  TRANSACTION_VERSION,
} from './constants';
import * as starknetUtils from './starknetUtils';

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

    const estimateFeeResp = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      overall_fee: overallFee,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      gas_consumed: BigInt('0x0'),
      suggestedMaxFee,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      gas_price: BigInt('0x0'),
    } as unknown as EstimateFee;
    const estimateBulkFeeSpy = jest.spyOn(starknetUtils, 'estimateFeeBulk');
    estimateBulkFeeSpy.mockResolvedValue([estimateFeeResp]);

    return {
      account,
      invocations,
      accountDeployedSpy,
      estimateBulkFeeSpy,
    };
  };

  it.each([
    {
      version: constants.TRANSACTION_VERSION.V2,
      expectedUnit: FeeTokenUnit.ETH,
    },
    {
      version: constants.TRANSACTION_VERSION.V3,
      expectedUnit: FeeTokenUnit.STRK,
    },
    {
      version: undefined,
      expectedUnit: FeeTokenUnit.ETH,
    },
  ])(
    'estimates fees correctly and assigns `$expectedUnit` to the unit of the result if the transaction version is $version',
    async ({
      version,
      expectedUnit,
    }: {
      version?: TransactionVersion;
      expectedUnit: FeeTokenUnit;
    }) => {
      const { account, invocations } = await prepareSpy(true);

      const resp = await starknetUtils.getEstimatedFees(
        STARKNET_SEPOLIA_TESTNET_NETWORK,
        account.address,
        account.privateKey,
        account.publicKey,
        invocations,
        {
          version,
        },
      );

      expect(resp).toStrictEqual({
        suggestedMaxFee: suggestedMaxFee.toString(10),
        overallFee: overallFee.toString(10),
        unit: expectedUnit,
        includeDeploy: false,
      });
    },
  );

  it('estimates fees with account deploy payload if the account is not deployed', async () => {
    const { account, estimateBulkFeeSpy, invocations } = await prepareSpy(
      false,
    );
    const deployAccountpayload = starknetUtils.createAccountDeployPayload(
      account.address,
      account.publicKey,
    );
    const call = invocations[0];

    const resp = await starknetUtils.getEstimatedFees(
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      account.address,
      account.privateKey,
      account.publicKey,
      [call],
      {
        version: TRANSACTION_VERSION,
      },
    );

    expect(estimateBulkFeeSpy).toHaveBeenCalledWith(
      STARKNET_SEPOLIA_TESTNET_NETWORK,
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
      TRANSACTION_VERSION,
      {
        version: TRANSACTION_VERSION,
      },
    );
    expect(resp).toStrictEqual({
      suggestedMaxFee: suggestedMaxFee.toString(10),
      overallFee: overallFee.toString(10),
      unit: FeeTokenUnit.ETH,
      includeDeploy: true,
    });
  });
});
