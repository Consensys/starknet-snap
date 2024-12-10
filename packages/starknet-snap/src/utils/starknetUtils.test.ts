import type { Invocations } from 'starknet';
import { constants, TransactionType } from 'starknet';

import callsExamples from '../__tests__/fixture/callsExamples.json';
import { mockAccount, prepareMockAccount } from '../rpcs/__tests__/helper';
import { FeeTokenUnit } from '../types/snapApi';
import type { SnapState } from '../types/snapState';
import type { TransactionVersion } from '../types/starknet';
import { mockEstimateFeeBulkResponse } from './__tests__/helper';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from './constants';
import * as starknetUtils from './starknetUtils';

describe('getEstimatedFees', () => {
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  const prepareGetEstimatedFees = async (deployed: boolean) => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);

    const invocations: Invocations = [
      {
        type: TransactionType.INVOKE,
        payload: callsExamples.singleCall.calls,
      },
    ];

    prepareMockAccount(account, state);
    const accountDeployedSpy = jest.spyOn(starknetUtils, 'isAccountDeployed');
    accountDeployedSpy.mockResolvedValue(deployed);

    return {
      account,
      invocations,
      accountDeployedSpy,
      ...mockEstimateFeeBulkResponse(),
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
      const {
        account,
        invocations,
        estimateBulkFeeSpy,
        estimateFeesResponse,
        consolidatedFees: { suggestedMaxFee, overallFee, resourceBounds },
      } = await prepareGetEstimatedFees(true);
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
        suggestedMaxFee,
        overallFee,
        unit: expectedUnit, // to verify if the unit is return correctly
        includeDeploy: false,
        estimateResults: estimateFeesResponse,
        resourceBounds,
      });
    },
  );

  it('estimates fees with account deploy payload if the account is not deployed', async () => {
    const network = STARKNET_SEPOLIA_TESTNET_NETWORK;
    const {
      account,
      estimateBulkFeeSpy,
      consolidatedFees: { suggestedMaxFee, overallFee, resourceBounds },
      estimateFeesResponse,
      invocations,
    } = await prepareGetEstimatedFees(false);
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
      suggestedMaxFee,
      overallFee,
      unit: FeeTokenUnit.ETH,
      includeDeploy: true,
      resourceBounds,
      estimateResults: estimateFeesResponse,
    });
  });
});

describe('isValidStarkName', () => {
  it.each([
    { starkName: 'valid.stark', expected: true },
    { starkName: 'valid-name.stark', expected: true },
    { starkName: 'valid123.stark', expected: true },
    { starkName: 'valid-name123.stark', expected: true },
    { starkName: 'valid.subdomain.stark', expected: true },
    { starkName: '1-valid.stark', expected: true },
    {
      starkName: 'valid-name-with-many-subdomains.valid.subdomain.stark',
      expected: true,
    },
    {
      starkName: 'too-long-stark-domain-name-more-than-48-characters.stark',
      expected: false,
    },
    { starkName: 'invalid..stark', expected: false },
    { starkName: 'invalid@stark', expected: false },
    { starkName: 'invalid_name.stark', expected: false },
    { starkName: 'invalid space.stark', expected: false },
    { starkName: 'invalid.starknet', expected: false },
    { starkName: '.invalid.stark', expected: false },
    { starkName: 'invalid.', expected: false },
    { starkName: 'invalid.stark.', expected: false },
    { starkName: '', expected: false },
  ])(
    'validates `$starkName` correctly and returns $expected',
    ({ starkName, expected }) => {
      const result = starknetUtils.isValidStarkName(starkName);
      expect(result).toBe(expected);
    },
  );
});
