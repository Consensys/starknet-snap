import { generateMnemonic } from 'bip39';

import { AccountService } from '.';
import { generateKeyDeriver } from '../../__tests__/helper';
import { mockAccountStateManager } from '../../state/__tests__/helper';
import { AccountStateManager } from '../../state/account-state-manager';
import { getDefaultAccountName } from '../../utils/account';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../utils/constants';
import { AccountNotFoundError } from '../../utils/exceptions';
import { createAccountService } from '../../utils/factory';
import * as snapUtils from '../../utils/snap';
import {
  createAccountObject,
  mockAccountContractReader,
} from './__test__/helper';
import { Account, DefaultAccountMetaData } from './account';
import { AccountContractDiscovery } from './discovery';

jest.mock('../../utils/logger');
jest.mock('../../utils/snap');

describe('AccountService', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  describe('deriveAccountByIndex', () => {
    const mockDeriveAccount = async (
      hdIndex,
      mnemonicString = generateMnemonic(),
    ) => {
      const { accountObj } = await createAccountObject(
        network,
        hdIndex,
        mnemonicString,
      );
      const getCairoContractSpy = jest.spyOn(
        AccountContractDiscovery.prototype,
        'getContract',
      );
      getCairoContractSpy.mockResolvedValue(accountObj.accountContract);

      return {
        accountObj,
        getCairoContractSpy,
      };
    };

    const mockSnapDeriver = async (mnemonicString) => {
      const deriver = await generateKeyDeriver(mnemonicString);
      jest.spyOn(snapUtils, 'getBip44Deriver').mockResolvedValue(deriver);
    };

    const setupDeriveAccountByIndexTest = async (hdIndex) => {
      const mnemonicString = generateMnemonic();

      const { accountObj, getCairoContractSpy } = await mockDeriveAccount(
        hdIndex,
        mnemonicString,
      );
      await mockSnapDeriver(mnemonicString);

      const { getNextIndexSpy, upsertAccountSpy } = mockAccountStateManager();

      mockAccountContractReader({});

      getNextIndexSpy.mockResolvedValue(hdIndex);

      return {
        upsertAccountSpy,
        getNextIndexSpy,
        getCairoContractSpy,
        account: accountObj,
      };
    };

    it('derives an account with the auto increment index', async () => {
      const hdIndex = 0;
      const {
        getNextIndexSpy,
        getCairoContractSpy,
        upsertAccountSpy,
        account,
      } = await setupDeriveAccountByIndexTest(hdIndex);

      const service = createAccountService(network);
      const result = await service.deriveAccountByIndex();
      expect(getNextIndexSpy).toHaveBeenCalled();
      expect(upsertAccountSpy).toHaveBeenCalledWith(await result.serialize());
      expect(getCairoContractSpy).toHaveBeenCalledWith(account.publicKey);
      expect(result).toBeInstanceOf(Account);
      expect(result).toHaveProperty('accountContract', account.accountContract);
      expect(result).toHaveProperty('address', account.address);
      expect(result).toHaveProperty('chainId', account.chainId);
      expect(result).toHaveProperty('privateKey', account.privateKey);
      expect(result).toHaveProperty('publicKey', account.publicKey);
      expect(result).toHaveProperty('hdIndex', hdIndex);
      expect(result).toHaveProperty('addressSalt', account.publicKey);
      expect(result).toHaveProperty('metadata', DefaultAccountMetaData);
    });

    it('derives an account with the given index', async () => {
      const hdIndex = 2;
      const {
        getNextIndexSpy,
        getCairoContractSpy,
        account,
        upsertAccountSpy,
      } = await setupDeriveAccountByIndexTest(hdIndex);

      const service = createAccountService(network);
      const result = await service.deriveAccountByIndex(hdIndex);

      expect(getNextIndexSpy).not.toHaveBeenCalled();
      expect(upsertAccountSpy).toHaveBeenCalledWith(await result.serialize());
      expect(getCairoContractSpy).toHaveBeenCalledWith(account.publicKey);
      expect(result).toBeInstanceOf(Account);
      expect(result).toHaveProperty('accountContract', account.accountContract);
      expect(result).toHaveProperty('address', account.address);
      expect(result).toHaveProperty('chainId', account.chainId);
      expect(result).toHaveProperty('privateKey', account.privateKey);
      expect(result).toHaveProperty('publicKey', account.publicKey);
      expect(result).toHaveProperty('hdIndex', hdIndex);
      expect(result).toHaveProperty('addressSalt', account.publicKey);
      expect(result).toHaveProperty('metadata', {
        ...DefaultAccountMetaData,
        accountName: getDefaultAccountName(hdIndex),
      });
    });

    it('derives an account along with the metadata', async () => {
      const hdIndex = 0;
      const { account } = await setupDeriveAccountByIndexTest(hdIndex);

      const jsonData = {
        ...(await account.serialize()),
        visibility: false,
      };

      const service = createAccountService(network);
      const result = await service.deriveAccountByIndex(hdIndex, jsonData);

      expect(await result.serialize()).toStrictEqual(jsonData);
    });
  });

  describe('deriveAccountFromAddress', () => {
    const setupDeriveAccountByAddressTest = async () => {
      const getAccountSpy = jest.spyOn(
        AccountStateManager.prototype,
        'getAccount',
      );
      const deriveAccountByIndexSpy = jest.spyOn(
        AccountService.prototype,
        'deriveAccountByIndex',
      );
      mockAccountContractReader({});

      const { accountObj: account } = await createAccountObject(network, 0);
      getAccountSpy.mockResolvedValue(await account.serialize());
      deriveAccountByIndexSpy.mockResolvedValue(account);

      return {
        deriveAccountByIndexSpy,
        getAccountSpy,
        account,
      };
    };

    it('derives an account by address', async () => {
      const { getAccountSpy, deriveAccountByIndexSpy, account } =
        await setupDeriveAccountByAddressTest();

      const jsonData = {
        ...(await account.serialize()),
        visibility: false,
      };

      getAccountSpy.mockResolvedValue(jsonData);

      const service = createAccountService(network);
      await service.deriveAccountByAddress(account.address);

      expect(getAccountSpy).toHaveBeenCalled();
      expect(deriveAccountByIndexSpy).toHaveBeenCalledWith(
        account.hdIndex,
        jsonData,
      );
    });

    it('throws `AccountNotFoundError` if the given address is not found', async () => {
      const { getAccountSpy, account } =
        await setupDeriveAccountByAddressTest();

      getAccountSpy.mockResolvedValue(null);

      const service = createAccountService(network);

      await expect(
        service.deriveAccountByAddress(account.address),
      ).rejects.toThrow(AccountNotFoundError);
    });
  });

  describe('getCurrentAccount', () => {
    // To test the case when the account is not selected,
    // make sure the mock account is not derived from 0.
    const setupGetCurrentAccountTest = async (hdIndex = 1) => {
      const getCurrentAccountSpy = jest.spyOn(
        AccountStateManager.prototype,
        'getCurrentAccount',
      );
      const deriveAccountByIndexSpy = jest.spyOn(
        AccountService.prototype,
        'deriveAccountByIndex',
      );
      mockAccountContractReader({});

      const { accountObj } = await createAccountObject(network, hdIndex);
      getCurrentAccountSpy.mockResolvedValue(await accountObj.serialize());
      deriveAccountByIndexSpy.mockResolvedValue(accountObj);

      return {
        deriveAccountByIndexSpy,
        getCurrentAccountSpy,
        accountObj,
      };
    };

    it('returns the selected `Account` object', async () => {
      const { accountObj, getCurrentAccountSpy, deriveAccountByIndexSpy } =
        await setupGetCurrentAccountTest();

      const service = createAccountService(network);
      const result = await service.getCurrentAccount();

      expect(deriveAccountByIndexSpy).toHaveBeenCalledWith(
        result.hdIndex,
        await accountObj.serialize(),
      );
      expect(getCurrentAccountSpy).toHaveBeenCalledWith({
        chainId: accountObj.chainId,
      });
      expect(result).toStrictEqual(accountObj);
    });

    it('returns a `Account` object that derived from index 0 if no account selected', async () => {
      const defaultIndex = 0;
      const { accountObj, getCurrentAccountSpy, deriveAccountByIndexSpy } =
        await setupGetCurrentAccountTest(defaultIndex);
      getCurrentAccountSpy.mockResolvedValue(null);

      const service = createAccountService(network);
      const result = await service.getCurrentAccount();

      expect(deriveAccountByIndexSpy).toHaveBeenCalledWith(
        defaultIndex,
        undefined,
      );
      expect(result).toStrictEqual(accountObj);
      expect(result.hdIndex).toStrictEqual(defaultIndex);
    });
  });

  describe('switchAccount', () => {
    it('switches the account for the network', async () => {
      const switchAccountSpy = jest.spyOn(
        AccountStateManager.prototype,
        'switchAccount',
      );
      switchAccountSpy.mockResolvedValue();
      mockAccountContractReader({});
      const { accountObj } = await createAccountObject(network, 0);

      const service = createAccountService(network);
      await service.switchAccount(accountObj.chainId, accountObj);

      expect(switchAccountSpy).toHaveBeenCalledWith({
        chainId: accountObj.chainId,
        accountToSwitch: await accountObj.serialize(),
      });
    });
  });
});
