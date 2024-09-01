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
    } as EstimateFee;
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
    constants.TRANSACTION_VERSION.V1,
    constants.TRANSACTION_VERSION.V2,
    constants.TRANSACTION_VERSION.V3,
  ])('estimate fees for transaction version %s', async (transactionVersion) => {
    const deployed = true;
    const { account, invocations } = await prepareSpy(deployed);

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
      suggestedMaxFee: suggestedMaxFee.toString(10),
      overallFee: overallFee.toString(10),
      unit:
        transactionVersion === constants.TRANSACTION_VERSION.V3
          ? FeeTokenUnit.STRK
          : FeeTokenUnit.ETH,
      includeDeploy: !deployed,
    });
  });

  it('estimate fees including deployment if the account is not deployed', async () => {
    const deployed = false;
    const { account, estimateBulkFeeSpy, invocations } = await prepareSpy(
      deployed,
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
          type: TransactionType.DEPLOY_ACCOUNT,
        },
        {
          payload: (invocations[0] as any).payload,
          type: TransactionType.INVOKE,
        },
      ],
      undefined,
    );
    expect(resp).toStrictEqual({
      suggestedMaxFee: suggestedMaxFee.toString(10),
      overallFee: overallFee.toString(10),
      unit: FeeTokenUnit.ETH,
      includeDeploy: !deployed,
    });
  });

  it('estimate fees without transaction version', async () => {
    const deployed = true;
    const { account, invocations } = await prepareSpy(true);

    const resp = await starknetUtils.getEstimatedFees(
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      account.address,
      account.privateKey,
      account.publicKey,
      invocations,
    );

    expect(resp).toStrictEqual({
      suggestedMaxFee: suggestedMaxFee.toString(10),
      overallFee: overallFee.toString(10),
      unit: FeeTokenUnit.ETH,
      includeDeploy: !deployed,
    });
  });
});
