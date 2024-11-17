import { BigNumber } from 'ethers';
import type { constants } from 'starknet';

import type { StarknetAccount } from '../../__tests__/helper';
import { generateAccounts, generateRandomValue } from '../../__tests__/helper';
import type { SnapState } from '../../types/snapState';
import * as snapUiUtils from '../../ui/utils';
import { getExplorerUrl, shortenAddress, toJson } from '../../utils';
import * as snapHelper from '../../utils/snap';
import * as snapUtils from '../../utils/snapUtils';
import * as starknetUtils from '../../utils/starknetUtils';

/**
 *
 * @param chainId
 */
export async function mockAccount(chainId: constants.StarknetChainId) {
  const accounts = await generateAccounts(chainId, 1);
  return accounts[0];
}

/**
 *
 * @param account
 * @param state
 */
export function prepareMockAccount(account: StarknetAccount, state: SnapState) {
  const getStateDataSpy = jest.spyOn(snapHelper, 'getStateData');
  const verifyIfAccountNeedUpgradeOrDeploySpy = jest.spyOn(
    snapUtils,
    'verifyIfAccountNeedUpgradeOrDeploy',
  );
  const getKeysFromAddressSpy = jest.spyOn(starknetUtils, 'getKeysFromAddress');

  getKeysFromAddressSpy.mockResolvedValue({
    privateKey: account.privateKey,
    publicKey: account.publicKey,
    addressIndex: account.addressIndex,
    derivationPath: account.derivationPath as unknown as any,
  });

  verifyIfAccountNeedUpgradeOrDeploySpy.mockReturnThis();
  getStateDataSpy.mockResolvedValue(state);

  return {
    getKeysFromAddressSpy,
    verifyIfAccountNeedUpgradeOrDeploySpy,
  };
}

/**
 *
 */
export function prepareConfirmDialog() {
  const confirmDialogSpy = jest.spyOn(snapHelper, 'confirmDialog');
  confirmDialogSpy.mockResolvedValue(true);
  return {
    confirmDialogSpy,
  };
}

/**
 *
 */
export function prepareConfirmDialogInteractiveUI() {
  const confirmDialogSpy = jest.spyOn(snapHelper, 'confirmDialogInteractiveUI');
  confirmDialogSpy.mockResolvedValue(true);
  return {
    confirmDialogSpy,
  };
}

/**
 *
 */
export function prepareConfirmDialogJsx() {
  const confirmDialogSpy = jest.spyOn(snapUiUtils, 'confirmDialog');
  confirmDialogSpy.mockResolvedValue(true);
  return {
    confirmDialogSpy,
  };
}

/**
 *
 */
export function prepareAlertDialogJsx() {
  const alertDialogSpy = jest.spyOn(snapUiUtils, 'alertDialog');
  alertDialogSpy.mockResolvedValue(true);
  return {
    alertDialogSpy,
  };
}

/**
 *
 */
export function prepareAlertDialog() {
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
