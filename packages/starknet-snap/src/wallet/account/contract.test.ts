import { generateMnemonic } from 'bip39';

import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../utils/constants';
import {
  ContractNotDeployedError,
  ContractReadError,
} from '../../utils/exceptions';
import {
  createAccountContract,
  mockAccountContractReader,
  nonUpgradedContractVersion,
  upgradedContractVersion,
} from './__test__/helper';
import { Cairo0Contract } from './cairo0';
import { Cairo1Contract } from './cairo1';

jest.mock('../../utils/logger');

describe('CairoAccountContract', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  describe('getVersion', () => {
    it('returns the contract version', async () => {
      const { contract } = await createAccountContract(network);

      mockAccountContractReader({});

      const result = await contract.getVersion();

      expect(result).toStrictEqual(upgradedContractVersion);
    });

    it('caches the result if `getVersion` was called', async () => {
      const { contract } = await createAccountContract(network);

      const { getVersionSpy } = mockAccountContractReader({});

      await contract.getVersion();
      await contract.getVersion();

      expect(getVersionSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('isDeployed', () => {
    it('returns true if the account has deployed', async () => {
      const { contract } = await createAccountContract(network);

      const { getVersionSpy } = mockAccountContractReader({});

      const result = await contract.isDeployed();

      expect(result).toBe(true);
      expect(getVersionSpy).toHaveBeenCalledTimes(1);
    });

    it('returns false if the account has not deployed', async () => {
      const { contract } = await createAccountContract(network);

      const { getVersionSpy } = mockAccountContractReader({});
      getVersionSpy.mockRejectedValue(new ContractNotDeployedError());

      const result = await contract.isDeployed();

      expect(result).toBe(false);
    });

    it('throws an error if a `ContractReadError` was throw', async () => {
      const { contract } = await createAccountContract(network);

      const { getVersionSpy } = mockAccountContractReader({});
      getVersionSpy.mockRejectedValue(
        new ContractReadError('Read contract error'),
      );

      await expect(contract.isDeployed()).rejects.toThrow(ContractReadError);
    });
  });

  describe('isUpgraded', () => {
    it('returns true if the contract version meet the requirement', async () => {
      const { contract } = await createAccountContract(network);

      const { getVersionSpy } = mockAccountContractReader({});

      const result = await contract.isUpgraded();

      expect(result).toBe(true);
      expect(getVersionSpy).toHaveBeenCalledTimes(1);
    });

    it('returns false if the contract version does not meet the requirement', async () => {
      const { contract } = await createAccountContract(network);

      const { getVersionSpy } = mockAccountContractReader({});
      getVersionSpy.mockResolvedValue(nonUpgradedContractVersion);

      const result = await contract.isUpgraded();

      expect(result).toBe(false);
    });

    it('throws an error if the contract is not deployed', async () => {
      const { contract } = await createAccountContract(network);

      const { getVersionSpy } = mockAccountContractReader({});
      getVersionSpy.mockRejectedValue(new ContractNotDeployedError());

      await expect(contract.isUpgraded()).rejects.toThrow(
        ContractNotDeployedError,
      );
    });
  });

  describe('getEthBalance', () => {
    it('returns the ETH token balance', async () => {
      const balance = BigInt(1000000000000000000);
      mockAccountContractReader({
        balance,
      });
      const { contract } = await createAccountContract(network);

      const result = await contract.getEthBalance();

      expect(result).toStrictEqual(balance);
    });

    it('caches the result if `getEthBalance` was called', async () => {
      const { getEthBalanceSpy } = mockAccountContractReader({});
      const { contract } = await createAccountContract(network);

      await contract.getEthBalance();
      await contract.getEthBalance();

      expect(getEthBalanceSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('fromAccountContract', () => {
    it('creates a new `CairoAccountContract` object from an `CairoAccountContract` object', async () => {
      const { getEthBalanceSpy, getVersionSpy } = mockAccountContractReader({});
      // Make sure the mnemonic is the same for both contracts
      const mnemonicString = generateMnemonic();
      const { contract: cairo0Contract } = await createAccountContract(
        network,
        0,
        Cairo0Contract,
        mnemonicString,
      );
      const { contract: cairo1Contract } = await createAccountContract(
        network,
        0,
        Cairo1Contract,
        mnemonicString,
      );

      // assgin _version and _balance to the instance before copy to new Cairo1Contract
      const versionFromCairo0Contract = await cairo0Contract.getVersion();
      const ethBalanceFromCairo0Contract = await cairo0Contract.getEthBalance();
      const newContract = Cairo1Contract.fromAccountContract(cairo0Contract);
      const versionFromCairo1Contract = await newContract.getVersion();
      const ethBalanceFromCairo1Contract = await newContract.getEthBalance();

      expect(newContract).toBeInstanceOf(Cairo1Contract);
      expect(newContract.address).toStrictEqual(cairo0Contract.address);
      expect(newContract.address).not.toStrictEqual(cairo1Contract.address);
      expect(newContract.callData).toStrictEqual(cairo1Contract.callData);
      expect(newContract.callData).not.toStrictEqual(cairo0Contract.callData);
      expect(versionFromCairo1Contract).toStrictEqual(
        versionFromCairo0Contract,
      );
      expect(ethBalanceFromCairo1Contract).toStrictEqual(
        ethBalanceFromCairo0Contract,
      );
      expect(getEthBalanceSpy).toHaveBeenCalledTimes(1);
      expect(getVersionSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('isRequireUpgrade', () => {
    it('returns true if the contract requires upgrade', async () => {
      mockAccountContractReader({
        version: nonUpgradedContractVersion,
      });
      const { contract } = await createAccountContract(
        network,
        0,
        Cairo0Contract,
      );

      const result = await contract.isRequireUpgrade();

      expect(result).toBe(true);
    });

    it('returns false if the contract has already upgraded', async () => {
      mockAccountContractReader({
        version: upgradedContractVersion,
      });
      const { contract } = await createAccountContract(
        network,
        0,
        Cairo1Contract,
      );

      const result = await contract.isRequireUpgrade();

      expect(result).toBe(false);
    });

    it('returns false if the contract is not deployed', async () => {
      const { getVersionSpy } = mockAccountContractReader({});
      getVersionSpy.mockRejectedValue(new ContractNotDeployedError());

      const { contract } = await createAccountContract(
        network,
        0,
        Cairo1Contract,
      );

      const result = await contract.isRequireUpgrade();

      expect(result).toBe(false);
    });

    it('throws an error if a `ContractReadError` was thrown', async () => {
      const { getVersionSpy } = mockAccountContractReader({});
      getVersionSpy.mockRejectedValue(
        new ContractReadError('Read contract error'),
      );

      const { contract } = await createAccountContract(
        network,
        0,
        Cairo1Contract,
      );

      await expect(contract.isRequireUpgrade()).rejects.toThrow(
        ContractReadError,
      );
    });
  });

  describe('isRequireDeploy', () => {
    it('returns true if the contract requires deploy', async () => {
      const { getVersionSpy } = mockAccountContractReader({});
      getVersionSpy.mockRejectedValue(new ContractNotDeployedError());

      const { contract } = await createAccountContract(
        network,
        0,
        Cairo0Contract,
      );

      const result = await contract.isRequireDeploy();

      expect(result).toBe(true);
    });

    it('returns false if the contract is not deployed and does not has ETH', async () => {
      const { getVersionSpy } = mockAccountContractReader({
        balance: BigInt(0),
      });
      getVersionSpy.mockRejectedValue(new ContractNotDeployedError());
      const { contract } = await createAccountContract(
        network,
        0,
        Cairo1Contract,
      );

      const result = await contract.isRequireUpgrade();

      expect(result).toBe(false);
    });
  });
});
