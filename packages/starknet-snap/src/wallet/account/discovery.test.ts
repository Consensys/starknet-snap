import { Cairo0Contract, Cairo1Contract } from '.';
import { generateAccounts } from '../../__tests__/helper';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../utils/constants';
import { AccountContractDiscovery } from './discovery';

jest.mock('../../utils/logger');

describe('AccountContractDiscovery', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  describe('getContract', () => {
    const mockContractState = (params: {
      cairo1: {
        isDeployed: boolean;
        isUpgraded: boolean;
      };
      cairo0: {
        isDeployed: boolean;
        isUpgraded: boolean;
      };
    }) => {
      const { cairo1, cairo0 } = params;
      const isCairo1DeployedSpy = jest.spyOn(
        Cairo1Contract.prototype,
        'isDeployed',
      );
      isCairo1DeployedSpy.mockResolvedValue(cairo1.isDeployed);
      const isCairo1UpgradedSpy = jest.spyOn(
        Cairo1Contract.prototype,
        'isUpgraded',
      );
      isCairo1UpgradedSpy.mockResolvedValue(cairo1.isUpgraded);
      const isCairo0DeployedSpy = jest.spyOn(
        Cairo0Contract.prototype,
        'isDeployed',
      );
      isCairo0DeployedSpy.mockResolvedValue(cairo0.isDeployed);
      const isCairo0UpgradedSpy = jest.spyOn(
        Cairo0Contract.prototype,
        'isUpgraded',
      );
      isCairo0UpgradedSpy.mockResolvedValue(cairo0.isUpgraded);

      return {
        isCairo1DeployedSpy,
        isCairo1UpgradedSpy,
        isCairo0DeployedSpy,
        isCairo0UpgradedSpy,
      };
    };

    const mockContractEthBalance = ({
      cairo1HasBalance,
      cairo0HasBalance,
    }: {
      cairo1HasBalance: boolean;
      cairo0HasBalance: boolean;
    }) => {
      const cairo1ContractHasEthBalanceSpy = jest.spyOn(
        Cairo1Contract.prototype,
        'getEthBalance',
      );
      cairo1ContractHasEthBalanceSpy.mockResolvedValue(
        cairo1HasBalance ? BigInt(1) : BigInt(0),
      );

      const cairo0ContractHasEthBalanceSpy = jest.spyOn(
        Cairo0Contract.prototype,
        'getEthBalance',
      );
      cairo0ContractHasEthBalanceSpy.mockResolvedValue(
        cairo0HasBalance ? BigInt(1) : BigInt(0),
      );

      return {
        cairo1ContractHasEthBalanceSpy,
        cairo0ContractHasEthBalanceSpy,
      };
    };

    // Test cases that assume no contact has balance.
    // It tests the following cases:
    // - Cairo 0 is deployed and upgraded
    // - Cairo 1 is deployed and upgraded
    // - Cairo 0 is deployed and Cairo 1 is not deployed
    // - Cairo 1 is deployed and Cairo 0 is not deployed
    // - Cairo 0 is not deployed and Cairo 1 is not deployed
    it.each([
      {
        cairo0: {
          isDeployed: false,
          isUpgraded: false,
        },
        cairo1: {
          isDeployed: true,
          isUpgraded: false,
        },
        expected: Cairo1Contract,
        title: 'Cairo 1 is deployed, Cairo 0 is not deployed',
      },
      {
        cairo0: {
          isDeployed: false,
          isUpgraded: false,
        },
        cairo1: {
          isDeployed: true,
          isUpgraded: true,
        },
        expected: Cairo1Contract,
        title: 'Cairo 1 is deployed and upgraded, Cairo 0 is not deployed',
      },
      {
        cairo0: {
          isDeployed: true,
          isUpgraded: false,
        },
        cairo1: {
          isDeployed: false,
          isUpgraded: false,
        },
        expected: Cairo0Contract,
        title: 'Cairo 0 is deployed, Cairo 1 is not deployed',
      },
      {
        cairo0: {
          isDeployed: true,
          isUpgraded: true,
        },
        cairo1: {
          isDeployed: false,
          isUpgraded: false,
        },
        expected: Cairo1Contract,
        title: 'Cairo 0 is deployed and upgraded, Cairo 1 is not deployed',
      },
      {
        cairo0: {
          isDeployed: false,
          isUpgraded: false,
        },
        cairo1: {
          isDeployed: false,
          isUpgraded: false,
        },
        expected: Cairo1Contract,
        title: 'no contract is deployed',
      },
      {
        cairo0: {
          isDeployed: true,
          isUpgraded: false,
        },
        cairo1: {
          isDeployed: true,
          isUpgraded: false,
        },
        expected: Cairo1Contract,
        title: 'all contracts are deployed',
      },
    ])(
      'returns a $expected.name if $title',
      async (param: {
        cairo0: {
          isDeployed: boolean;
          isUpgraded: boolean;
        };
        cairo1: {
          isDeployed: boolean;
          isUpgraded: boolean;
        };
        expected: typeof Cairo0Contract | typeof Cairo1Contract;
      }) => {
        const [account] = await generateAccounts(network.chainId, 1);

        mockContractState({
          cairo0: param.cairo0,
          cairo1: param.cairo1,
        });
        mockContractEthBalance({
          cairo1HasBalance: false,
          cairo0HasBalance: false,
        });

        const service = new AccountContractDiscovery(network);
        const contract = await service.getContract(account.publicKey);

        expect(contract).toBeInstanceOf(param.expected);
      },
    );

    it.each([
      {
        cairo0HasBalance: false,
        cairo1HasBalance: true,
        expected: Cairo1Contract,
      },
      {
        cairo0HasBalance: true,
        cairo1HasBalance: false,
        expected: Cairo0Contract,
      },
    ])(
      'returns a $expected.name if no account contract is deployed and the $expected.name has ETH',
      async ({ expected, cairo0HasBalance, cairo1HasBalance }) => {
        const [account] = await generateAccounts(network.chainId, 1);

        mockContractState({
          cairo0: {
            isDeployed: false,
            isUpgraded: false,
          },
          cairo1: {
            isDeployed: false,
            isUpgraded: false,
          },
        });

        mockContractEthBalance({
          cairo0HasBalance,
          cairo1HasBalance,
        });

        const service = new AccountContractDiscovery(network);
        const contract = await service.getContract(account.publicKey);

        expect(contract).toBeInstanceOf(expected);
      },
    );

    it('returns a Cairo1Contract if the Cairo1Contract is deployed and Cairo0Contract has ETH', async () => {
      const [account] = await generateAccounts(network.chainId, 1);

      mockContractState({
        cairo0: {
          isDeployed: false,
          isUpgraded: false,
        },
        cairo1: {
          isDeployed: true,
          isUpgraded: false,
        },
      });

      mockContractEthBalance({
        cairo0HasBalance: true,
        cairo1HasBalance: false,
      });

      const service = new AccountContractDiscovery(network);
      const contract = await service.getContract(account.publicKey);

      expect(contract).toBeInstanceOf(Cairo1Contract);
    });
  });
});
