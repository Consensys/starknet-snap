import type { constants } from 'starknet';

import type { StarknetAccount } from '../../__tests__/helper';
import { generateAccounts } from '../../__tests__/helper';
import type { SnapState } from '../../types/snapState';
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
export function prepareAlertDialog() {
  const alertDialogSpy = jest.spyOn(snapHelper, 'alertDialog');
  alertDialogSpy.mockResolvedValue(true);
  return {
    alertDialogSpy,
  };
}
