import type { EstimateFee, Invocations } from 'starknet';
import { constants, TransactionType } from 'starknet';

import { mockAccount, prepareMockAccount } from '../rpcs/__tests__/helper';
import { FeeTokenUnit } from '../types/snapApi';
import type { SnapState } from '../types/snapState';
import {
  ACCOUNT_CLASS_HASH,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from './constants';
import * as starknetUtils from './starknetUtils';

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
describe('getEstimatedFees', () => {
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  const prepareSpy = async (deployed: boolean) => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    const accountDeployedSpy = jest.spyOn(starknetUtils, 'isAccountDeployed');
    accountDeployedSpy.mockResolvedValue(deployed);

    const estimateFeeResp = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      overall_fee: BigInt('0xa'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      gas_consumed: BigInt('0x0'),
      suggestedMaxFee: BigInt('0xc'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      gas_price: BigInt('0x0'),
    } as EstimateFee;
    const estimateBulkFeeSpy = jest.spyOn(starknetUtils, 'estimateFeeBulk');
    estimateBulkFeeSpy.mockResolvedValue([estimateFeeResp]);

    return {
      account,
      accountDeployedSpy,
      estimateBulkFeeSpy,
    };
  };

  it.each([constants.TRANSACTION_VERSION.V2, constants.TRANSACTION_VERSION.V3])(
    'estimate fees for transaction version %s',
    async (transactionVersion) => {
      const deployed = true;

      const { account } = await prepareSpy(deployed);

      const resp = await starknetUtils.getEstimatedFees(
        STARKNET_SEPOLIA_TESTNET_NETWORK,
        account.address,
        account.privateKey,
        account.publicKey,
        invocations,
        {
          version: transactionVersion,
        },
      );

      expect(resp).toStrictEqual({
        suggestedMaxFee: '12',
        overallFee: '10',
        unit:
          transactionVersion === constants.TRANSACTION_VERSION.V2
            ? FeeTokenUnit.ETH
            : FeeTokenUnit.STRK,
        includeDeploy: !deployed,
      });
    },
  );

  it('estimate fees including deployment for transaction version', async () => {
    const deployed = false;
    const { account, estimateBulkFeeSpy } = await prepareSpy(deployed);

    const resp = await starknetUtils.getEstimatedFees(
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      account.address,
      account.privateKey,
      account.publicKey,
      invocations,
      {
        version: '0x2',
      },
    );
    const deployAccountpayload = starknetUtils.createAccountDeployPayload(
      account.address,
      account.publicKey,
    );

    expect(estimateBulkFeeSpy).toHaveBeenCalledWith(
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      account.address,
      account.privateKey,
      [
        {
          payload: {
            addressSalt: account.addressSalt,
            classHash: ACCOUNT_CLASS_HASH,
            constructorCalldata: deployAccountpayload.constructorCalldata,
            contractAddress: deployAccountpayload.contractAddress,
          },
          type: 'DEPLOY_ACCOUNT',
        },
        {
          payload: (invocations[1] as any).payload,
          type: 'INVOKE_FUNCTION',
        },
      ],
      '0x2',
      {
        version: '0x2',
      },
    );
    expect(resp).toStrictEqual({
      suggestedMaxFee: '12',
      overallFee: '10',
      unit: FeeTokenUnit.ETH,
      includeDeploy: !deployed,
    });
  });
  it('sets default version correctly', async () => {
    const deployed = true;
    const { account } = await prepareSpy(true);

    const resp = await starknetUtils.getEstimatedFees(
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      account.address,
      account.privateKey,
      account.publicKey,
      invocations,
    );
    expect(resp).toStrictEqual({
      suggestedMaxFee: '12',
      overallFee: '10',
      unit: FeeTokenUnit.ETH,
      includeDeploy: !deployed,
    });
  });
});
