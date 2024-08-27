import type { EstimateFee, Invocations } from 'starknet';
import { constants, TransactionType } from 'starknet';

import { mockAccount, prepareMockAccount } from '../rpcs/__tests__/helper';
import { FeeTokenUnit } from '../types/snapApi';
import type { SnapState } from '../types/snapState';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from './constants';
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
  const createMockSpy = async (
    state: SnapState,
    estimateFeeResp: EstimateFee,
    deployed: boolean,
  ) => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    const accountDeployedSpy = jest.spyOn(starknetUtils, 'isAccountDeployed');
    accountDeployedSpy.mockResolvedValue(deployed);
    const estimateBulkFeeSpy = jest.spyOn(starknetUtils, 'estimateFeeBulk');
    estimateBulkFeeSpy.mockResolvedValue([estimateFeeResp]);

    return {
      account,
      accountDeployedSpy,
      estimateBulkFeeSpy,
    };
  };
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };
  it.each([constants.TRANSACTION_VERSION.V2, constants.TRANSACTION_VERSION.V3])(
    'should estimate fees for transaction version %s',
    async (transactionVersion) => {
      const deployed = true;

      const estimateFeeResp = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        overall_fee: BigInt('0xa'),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        gas_consumed: BigInt('0x0'),
        suggestedMaxFee: BigInt('0x0'),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        gas_price: BigInt('0x0'),
      } as EstimateFee;

      const { account } = await createMockSpy(state, estimateFeeResp, deployed);

      const resp = await starknetUtils.getEstimatedFees(
        STARKNET_SEPOLIA_TESTNET_NETWORK,
        account.address,
        account.privateKey,
        account.publicKey,
        invocations,
        transactionVersion,
      );

      expect(resp).toStrictEqual({
        suggestedMaxFee: estimateFeeResp.suggestedMaxFee.toString(10),
        overallFee: estimateFeeResp.overall_fee.toString(10),
        unit:
          transactionVersion === constants.TRANSACTION_VERSION.V2
            ? FeeTokenUnit.ETH
            : FeeTokenUnit.STRK,
        includeDeploy: !deployed,
      });
    },
  );
  it.each([constants.TRANSACTION_VERSION.V2, constants.TRANSACTION_VERSION.V3])(
    'should estimate fees including deployment for transaction version %s',
    async (transactionVersion) => {
      const deployed = false;
      //   const createAccountDeployPayloadSpy = jest.spyOn(
      //     starknetUtils,
      //     'createAccountDeployPayload',
      //   );
      const estimateFeeResp = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        overall_fee: BigInt('0xa'),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        gas_consumed: BigInt('0x0'),
        suggestedMaxFee: BigInt('0x0'),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        gas_price: BigInt('0x0'),
      } as EstimateFee;
      const { account } = await createMockSpy(state, estimateFeeResp, deployed);

      const resp = await starknetUtils.getEstimatedFees(
        STARKNET_SEPOLIA_TESTNET_NETWORK,
        account.address,
        account.privateKey,
        account.publicKey,
        invocations,
        transactionVersion,
      );

      // expect(createAccountDeployPayloadSpy).toHaveBeenCalled();
      expect(resp).toStrictEqual({
        suggestedMaxFee: estimateFeeResp.suggestedMaxFee.toString(10),
        overallFee: estimateFeeResp.overall_fee.toString(10),
        unit:
          transactionVersion === constants.TRANSACTION_VERSION.V2
            ? FeeTokenUnit.ETH
            : FeeTokenUnit.STRK,
        includeDeploy: !deployed,
      });
    },
  );
});
