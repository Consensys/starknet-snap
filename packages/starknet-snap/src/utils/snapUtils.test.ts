import { constants } from 'starknet';

import { generateAccounts } from '../__tests__/helper';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from './constants';
import { DeployRequiredError, UpgradeRequiredError } from './exceptions';
import * as snapHelper from './snap';
import { verifyIfAccountNeedUpgradeOrDeploy } from './snapUtils';
import * as starknetUtils from './starknetUtils';

jest.mock('./snap');
jest.mock('./logger');

describe('verifyIfAccountNeedUpgradeOrDeploy', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  const mockAcccount = async () => {
    const accounts = await generateAccounts(
      constants.StarknetChainId.SN_SEPOLIA,
      1,
    );
    return accounts[0];
  };

  const prepareMock = () => {
    const verifyIfAccountNeedUpgradeOrDeploySpy = jest.spyOn(
      starknetUtils,
      'validateAccountRequireUpgradeOrDeploy',
    );

    const alertDialogSpy = jest.spyOn(snapHelper, 'alertDialog');

    verifyIfAccountNeedUpgradeOrDeploySpy.mockReturnThis();
    alertDialogSpy.mockReturnThis();

    return {
      verifyIfAccountNeedUpgradeOrDeploySpy,
      alertDialogSpy,
    };
  };

  it('does not throw error if the account does not required to upgrade or deploy', async () => {
    const account = await mockAcccount();
    const { alertDialogSpy } = prepareMock();

    await verifyIfAccountNeedUpgradeOrDeploy(
      network,
      account.address,
      account.publicKey,
    );

    expect(alertDialogSpy).not.toHaveBeenCalled();
  });

  it.each([
    {
      action: 'upgrade',
      error: new UpgradeRequiredError(),
    },
    {
      action: 'deploy',
      error: new DeployRequiredError(),
    },
  ])(
    'throws error but does not render alert dialog if the account required $action and `showAlert` is false',
    async (testData: { error: Error }) => {
      const account = await mockAcccount();
      const { verifyIfAccountNeedUpgradeOrDeploySpy, alertDialogSpy } =
        prepareMock();
      verifyIfAccountNeedUpgradeOrDeploySpy.mockRejectedValue(testData.error);

      await expect(
        verifyIfAccountNeedUpgradeOrDeploy(
          network,
          account.address,
          account.publicKey,
          false,
        ),
      ).rejects.toThrow(testData.error);

      expect(alertDialogSpy).not.toHaveBeenCalled();
    },
  );

  it('throws error and does not render alert dialog if the error is not either UpgradeRequiredError or DeployRequiredError', async () => {
    const account = await mockAcccount();
    const { verifyIfAccountNeedUpgradeOrDeploySpy } = prepareMock();
    verifyIfAccountNeedUpgradeOrDeploySpy.mockRejectedValue(
      new Error('Internal Error'),
    );

    await expect(
      verifyIfAccountNeedUpgradeOrDeploy(
        network,
        account.address,
        account.publicKey,
      ),
    ).rejects.toThrow('Internal Error');

    expect(snapHelper.alertDialog).not.toHaveBeenCalled();
  });

  it.each([
    {
      action: 'upgrade',
      error: new UpgradeRequiredError(),
    },
    {
      action: 'deploy',
      error: new DeployRequiredError(),
    },
  ])(
    'throws error and renders alert dialog if the account required $action and `showAlert` is true',
    async (testData: { error: Error }) => {
      const account = await mockAcccount();
      const { verifyIfAccountNeedUpgradeOrDeploySpy, alertDialogSpy } =
        prepareMock();
      verifyIfAccountNeedUpgradeOrDeploySpy.mockRejectedValue(testData.error);

      await expect(
        verifyIfAccountNeedUpgradeOrDeploy(
          network,
          account.address,
          account.publicKey,
          true,
        ),
      ).rejects.toThrow(testData.error);

      expect(alertDialogSpy).toHaveBeenCalled();
    },
  );
});
