import { mockWalletInit, createWallet } from '../__tests__/helper';
import { MetaMaskSnap } from '../snap';
import type { DeploymentData } from '../type';
import { WalletDeploymentData } from './deployment-data';

describe('WalletDeploymentData', () => {
  it('returns deployment data', async () => {
    const expectedResult: DeploymentData = {
      address: '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      class_hash: 'class_hash',
      salt: 'salt',
      calldata: ['0', '1'],
      version: 1,
    };
    const wallet = createWallet();
    mockWalletInit({ address: expectedResult.address });
    const spy = jest.spyOn(MetaMaskSnap.prototype, 'getDeploymentData');
    spy.mockResolvedValue(expectedResult);
    const walletDeploymentData = new WalletDeploymentData(wallet);
    const result = await walletDeploymentData.execute();

    expect(result).toStrictEqual(expectedResult);
  });
});
