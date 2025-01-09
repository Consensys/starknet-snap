import { BigNumber } from 'ethers';
import type { constants } from 'starknet';

import { generateAccounts, generateRandomValue } from '../../__tests__/helper';
import { FeeTokenUnit } from '../../types/snapApi';
import type { Network } from '../../types/snapState';
import * as snapUiUtils from '../../ui/utils';
import { getExplorerUrl, shortenAddress, toJson } from '../../utils';
import { mockEstimateFeeBulkResponse } from '../../utils/__tests__/helper';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../utils/constants';
import * as snapHelper from '../../utils/snap';
import * as starknetUtils from '../../utils/starknetUtils';
import { AccountService, CairoAccountContract } from '../../wallet/account';
import { createAccountObject } from '../../wallet/account/__test__/helper';
import type { Account } from '../../wallet/account/account';

/**
 *
 * @param chainId
 */
export async function mockAccount(chainId: constants.StarknetChainId | string) {
  const accounts = await generateAccounts(chainId, 1);
  return accounts[0];
}

/**
 *
 * @param account
 * @param account.accountObj
 * @param account.network
 * @param account.requireUpgrade
 * @param account.requireDeploy
 * @param account.isDeployed
 */
export async function setupAccountController({
  accountObj,
  network = STARKNET_SEPOLIA_TESTNET_NETWORK,
  requireUpgrade = false,
  requireDeploy = false,
  isDeployed = false,
}: {
  accountObj?: Account;
  network?: Network;
  requireUpgrade?: boolean;
  requireDeploy?: boolean;
  isDeployed?: boolean;
}) {
  const account = accountObj ?? (await createAccountObject(network)).accountObj;

  // Mock the `accountContract` properties in the `Account` object
  const isRequireUpgradeSpy = jest.spyOn(
    CairoAccountContract.prototype,
    'isRequireUpgrade',
  );
  const isRequireDeploySpy = jest.spyOn(
    CairoAccountContract.prototype,
    'isRequireDeploy',
  );
  const isDeploySpy = jest.spyOn(CairoAccountContract.prototype, 'isDeployed');

  isRequireUpgradeSpy.mockResolvedValue(requireUpgrade);
  isRequireDeploySpy.mockResolvedValue(requireDeploy);
  isDeploySpy.mockResolvedValue(isDeployed);

  const deriveAccountByAddressSpy = jest.spyOn(
    AccountService.prototype,
    'deriveAccountByAddress',
  );

  deriveAccountByAddressSpy.mockResolvedValue(account);

  return {
    deriveAccountByAddressSpy,
    isRequireDeploySpy,
    isRequireUpgradeSpy,
    isDeploySpy,
    account,
  };
}

/**
 *
 */
export function mockConfirmDialog() {
  const confirmDialogSpy = jest.spyOn(snapHelper, 'confirmDialog');
  confirmDialogSpy.mockResolvedValue(true);
  return {
    confirmDialogSpy,
  };
}

/**
 *
 */
export function mockRenderWatchAssetUI() {
  const confirmDialogSpy = jest.spyOn(snapUiUtils, 'renderWatchAssetUI');
  confirmDialogSpy.mockResolvedValue(true);
  return {
    confirmDialogSpy,
  };
}

/**
 *
 */
export function mockRenderSwitchNetworkUI() {
  const confirmDialogSpy = jest.spyOn(snapUiUtils, 'renderSwitchNetworkUI');
  confirmDialogSpy.mockResolvedValue(true);
  return {
    confirmDialogSpy,
  };
}

/**
 *
 */
export function mockRenderSignMessageUI() {
  const confirmDialogSpy = jest.spyOn(snapUiUtils, 'renderSignMessageUI');
  confirmDialogSpy.mockResolvedValue(true);
  return {
    confirmDialogSpy,
  };
}

/**
 *
 */
export function mockRenderSignTransactionUI() {
  const confirmDialogSpy = jest.spyOn(snapUiUtils, 'renderSignTransactionUI');
  confirmDialogSpy.mockResolvedValue(true);
  return {
    confirmDialogSpy,
  };
}

/**
 *
 */
export function mockRenderSignDeclareTransactionUI() {
  const confirmDialogSpy = jest.spyOn(
    snapUiUtils,
    'renderSignDeclareTransactionUI',
  );
  confirmDialogSpy.mockResolvedValue(true);
  return {
    confirmDialogSpy,
  };
}

/**
 *
 */
export function mockRenderDisplayPrivateKeyConfirmUI() {
  const confirmDialogSpy = jest.spyOn(
    snapUiUtils,
    'renderDisplayPrivateKeyConfirmUI',
  );
  confirmDialogSpy.mockResolvedValue(true);
  return {
    confirmDialogSpy,
  };
}

/**
 *
 */
export function mockRenderDisplayPrivateKeyAlertUI() {
  const alertDialogSpy = jest.spyOn(
    snapUiUtils,
    'renderDisplayPrivateKeyAlertUI',
  );
  return {
    alertDialogSpy,
  };
}

/**
 *
 * @param result
 */
export function mockConfirmDialogInteractiveUI(result = true) {
  const confirmDialogSpy = jest.spyOn(
    snapHelper,
    'createInteractiveConfirmDialog',
  );
  confirmDialogSpy.mockResolvedValue(result);
  return {
    confirmDialogSpy,
  };
}

/**
 *
 */
export function mockAlertDialog() {
  const alertDialogSpy = jest.spyOn(snapHelper, 'alertDialog');
  alertDialogSpy.mockResolvedValue(true);
  return {
    alertDialogSpy,
  };
}

export const buildRowComponent = (label: string, value: string) => ({
  type: 'row',
  label,
  value: {
    value,
    markdown: false,
    type: 'text',
  },
});

export const buildDividerComponent = () => {
  return {
    type: 'divider',
  };
};

export const buildAddressComponent = (
  label: string,
  address: string,
  chainId: string,
) => {
  return buildRowComponent(
    label,
    `[${shortenAddress(address)}](${getExplorerUrl(address, chainId)})`,
  );
};

export const buildSignerComponent = (value: string, chainId: string) => {
  return buildAddressComponent('Signer Address', value, chainId);
};

export const buildNetworkComponent = (chainName: string) => {
  return buildRowComponent('Network', chainName);
};

export const buildJsonDataComponent = (label: string, data: any) => {
  return buildRowComponent(label, toJson(data));
};

/**
 *
 * @param min
 * @param max
 * @param useBigInt
 */
export function generateRandomFee(
  min = '100000000000000',
  max = '1000000000000000',
  useBigInt = false,
) {
  const minFee = BigInt(min);
  const maxFee = BigInt(max);
  const randomFactor = generateRandomValue();
  const randomFee = BigInt(
    Math.max(Number(minFee), Math.floor(randomFactor * Number(maxFee))),
  );

  return useBigInt
    ? randomFee.toString(10)
    : BigNumber.from(randomFee).toString();
}

/**
 *
 * @param options0
 * @param options0.includeDeploy
 * @param options0.unit
 */
export function mockGetEstimatedFeesResponse({
  includeDeploy = false,
  unit = FeeTokenUnit.ETH,
}: {
  includeDeploy?: boolean;
  unit?: FeeTokenUnit;
}) {
  const {
    consolidatedFees: { suggestedMaxFee, overallFee, resourceBounds },
    estimateFeesResponse,
  } = mockEstimateFeeBulkResponse();

  const getEstimatedFeesResponse = {
    suggestedMaxFee,
    overallFee,
    unit,
    includeDeploy,
    estimateResults: estimateFeesResponse,
    resourceBounds,
  };

  const getEstimatedFeesSpy = jest.spyOn(starknetUtils, 'getEstimatedFees');
  getEstimatedFeesSpy.mockResolvedValue(getEstimatedFeesResponse);

  return {
    getEstimatedFeesSpy,
    getEstimatedFeesResponse,
  };
}
