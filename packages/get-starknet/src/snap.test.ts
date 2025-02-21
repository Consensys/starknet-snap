import { MetaMaskSnap } from './snap';
import type { MetaMaskProvider } from './type';

describe('MetaMaskSnap', () => {
  class MockMetaMaskSnap extends MetaMaskSnap {
    public override async isSnapRequireUpdate(): Promise<boolean> {
      return super.isSnapRequireUpdate();
    }

    public override async isInstalled(): Promise<boolean> {
      return super.isInstalled();
    }
  }

  class MockProvider implements MetaMaskProvider {
    async request(): Promise<any> {
      return {};
    }
  }

  const createMockProvider = () => {
    const provider = new MockProvider() as unknown as MetaMaskProvider;
    const providerSpy = jest.spyOn(provider, 'request');
    providerSpy.mockReturnThis();

    return {
      provider,
      providerSpy,
    };
  };

  const createSnapService = ({
    provider,
    version = '1.0.0',
    minVersion = '1.0.0',
  }: {
    provider: MetaMaskProvider;
    version?: string;
    minVersion?: string;
  }) => {
    const snapId = 'snapId';

    const snap = new MockMetaMaskSnap(snapId, version, provider, minVersion);
    return {
      snap,
      provider,
      snapId,
    };
  };

  describe('installIfNot', () => {
    const version = '1.0.0';

    const createInstallUpdateSpy = () => {
      const isInstalledSpy = jest.spyOn(MockMetaMaskSnap.prototype, 'isInstalled');
      const isSnapRequireUpdateSpy = jest.spyOn(MockMetaMaskSnap.prototype, 'isSnapRequireUpdate');

      return { isInstalledSpy, isSnapRequireUpdateSpy };
    };

    const setupInstallIfNotTest = ({
      isInstalled,
      isSnapRequireUpdate,
    }: {
      isInstalled: boolean;
      isSnapRequireUpdate: boolean;
    }) => {
      const { provider, providerSpy } = createMockProvider();
      const { isInstalledSpy, isSnapRequireUpdateSpy } = createInstallUpdateSpy();

      isInstalledSpy.mockResolvedValue(isInstalled);
      isSnapRequireUpdateSpy.mockResolvedValue(isSnapRequireUpdate);

      const { snap, snapId } = createSnapService({
        provider,
        version,
      });

      providerSpy.mockResolvedValue({
        [snapId]: {
          enabled: true,
        },
      });

      return { snap, snapId, providerSpy };
    };

    it('installs the snap if not installed', async () => {
      const { snap, snapId, providerSpy } = setupInstallIfNotTest({
        isInstalled: false,
        isSnapRequireUpdate: false,
      });

      const result = await snap.installIfNot();

      expect(result).toBe(true);
      expect(providerSpy).toHaveBeenCalledWith({
        method: 'wallet_requestSnaps',
        params: {
          [snapId]: { version },
        },
      });
    });

    it('does not install the snap if installed', async () => {
      const { snap, providerSpy } = setupInstallIfNotTest({
        isInstalled: true,
        isSnapRequireUpdate: false,
      });

      const result = await snap.installIfNot();

      expect(result).toBe(true);
      expect(providerSpy).not.toHaveBeenCalled();
    });

    it('re-install the snap if the installed version is outdate', async () => {
      const { snap, snapId, providerSpy } = setupInstallIfNotTest({
        isInstalled: true,
        isSnapRequireUpdate: true,
      });

      const result = await snap.installIfNot();

      expect(result).toBe(true);
      expect(providerSpy).toHaveBeenCalledWith({
        method: 'wallet_requestSnaps',
        params: {
          [snapId]: { version },
        },
      });
    });
  });

  describe('isSnapRequireUpdate', () => {
    const setIsSnapRequireUpdateTest = ({
      version = '1.0.0',
      minVersion = '1.0.0',
    }: {
      version?: string;
      minVersion?: string;
    }) => {
      const { provider, providerSpy } = createMockProvider();

      const { snap, snapId } = createSnapService({
        provider,
        version,
        minVersion,
      });

      providerSpy.mockResolvedValue({
        [snapId]: {
          enabled: true,
          version,
        },
      });

      return { snap, snapId, providerSpy };
    };

    it.each([
      {
        version: '1.0.0',
        minVersion: '1.0.0',
        expected: false,
      },
      {
        version: '1.0.0',
        minVersion: '1.1.0',
        expected: true,
      },
      {
        version: '1.0.0',
        minVersion: '*',
        expected: false,
      },
    ])(
      'returns $expected if the installed version $version and min required version is $minVersion',
      async ({ version, minVersion, expected }) => {
        const { snap } = setIsSnapRequireUpdateTest({
          version,
          minVersion,
        });

        const result = await snap.isSnapRequireUpdate();

        expect(result).toBe(expected);
      },
    );
  });
});
