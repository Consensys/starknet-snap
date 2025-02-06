import { object, string } from 'superstruct';
import type { Infer } from 'superstruct';

import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../utils/constants';
import {
  DeployRequiredError,
  UpgradeRequiredError,
} from '../../utils/exceptions';
import { loadLocale } from '../../utils/locale';
import * as snapUtils from '../../utils/snapUtils';
import { setupAccountController } from '../__tests__/helper';
import { AccountRpcController } from './account-rpc-controller';

jest.mock('../../utils/snap');
jest.mock('../../utils/logger');

describe('AccountRpcController', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  const RequestStruct = object({
    address: string(),
    chainId: string(),
  });

  type Request = Infer<typeof RequestStruct>;

  class MockAccountRpc extends AccountRpcController<Request, string> {
    protected requestStruct = RequestStruct;

    protected responseStruct = string();

    // Set it to public to be able to spy on it
    async handleRequest(param: Request) {
      return `done ${param.address} and ${param.chainId}`;
    }

    async displayAlert(error: Error): Promise<void> {
      return super.displayAlert(error);
    }
  }

  const setupRpcExecuteTest = async ({
    requireDeploy = false,
    requireUpgrade = false,
  }: {
    requireDeploy?: boolean;
    requireUpgrade?: boolean;
  }) => {
    const { account, isRequireUpgradeSpy, isRequireDeploySpy } =
      await setupAccountController({});

    const showDeployRequestModalSpy = jest.spyOn(
      snapUtils,
      'showDeployRequestModal',
    );
    const showUpgradeRequestModalSpy = jest.spyOn(
      snapUtils,
      'showUpgradeRequestModal',
    );

    isRequireUpgradeSpy.mockResolvedValue(requireUpgrade);
    isRequireDeploySpy.mockResolvedValue(requireDeploy);

    return {
      account,
      showDeployRequestModalSpy,
      showUpgradeRequestModalSpy,
      isRequireUpgradeSpy,
      isRequireDeploySpy,
    };
  };

  it('executes request', async () => {
    const { account } = await setupRpcExecuteTest({});
    const rpc = new MockAccountRpc();

    const result = await rpc.execute({
      address: account.address,
      chainId: network.chainId,
    });

    expect(result).toBe(`done ${account.address} and ${network.chainId}`);
  });

  it(`displays a request deploy dialog if account is required deploy and \`showInvalidAccountAlert\` is true`, async () => {
    await loadLocale();
    const { account, showDeployRequestModalSpy } = await setupRpcExecuteTest({
      requireDeploy: true,
    });
    const rpc = new MockAccountRpc({
      showInvalidAccountAlert: true,
    });

    await expect(
      rpc.execute({
        address: account.address,
        chainId: network.chainId,
      }),
    ).rejects.toThrow(DeployRequiredError);

    expect(showDeployRequestModalSpy).toHaveBeenCalled();
  });

  it(`displays a request upgrade dialog if account is required upgrade and \`showInvalidAccountAlert\` is true`, async () => {
    await loadLocale();
    const { account, showUpgradeRequestModalSpy } = await setupRpcExecuteTest({
      requireUpgrade: true,
    });
    const rpc = new MockAccountRpc({
      showInvalidAccountAlert: true,
    });

    await expect(
      rpc.execute({
        address: account.address,
        chainId: network.chainId,
      }),
    ).rejects.toThrow(UpgradeRequiredError);

    expect(showUpgradeRequestModalSpy).toHaveBeenCalled();
  });
});
