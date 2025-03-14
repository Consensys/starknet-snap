import { generateMnemonic } from 'bip39';

import { AccountService } from '.';
import { generateKeyDeriver } from '../../__tests__/helper';
import { Config } from '../../config';
import { mockAccountStateManager } from '../../state/__tests__/helper';
import { getDefaultAccountName } from '../../utils/account';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../utils/constants';
import {
  AccountMissMatchError,
  AccountNotFoundError,
} from '../../utils/exceptions';
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

      mockAccountContractReader({});

      return {
        getCairoContractSpy,
        account: accountObj,
      };
    };

    it('derives an account with the given index', async () => {
      const hdIndex = 2;
      const { getCairoContractSpy, account } =
        await setupDeriveAccountByIndexTest(hdIndex);

      const service = createAccountService(network);
      const result = await service.deriveAccountByIndex(hdIndex);

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
  });

  describe('deriveAccountFromAddress', () => {
    const setupDeriveAccountByAddressTest = async () => {
      const deriveAccountByIndexSpy = jest.spyOn(
        AccountService.prototype,
        'deriveAccountByIndex',
      );

      const { updateAccountByAddressSpy, getAccountSpy } =
        mockAccountStateManager();

      updateAccountByAddressSpy.mockReturnThis();

      mockAccountContractReader({});

      const { accountObj: account } = await createAccountObject(network, 0);
      getAccountSpy.mockResolvedValue(await account.serialize());
      deriveAccountByIndexSpy.mockResolvedValue(account);

      return {
        deriveAccountByIndexSpy,
        getAccountSpy,
        updateAccountByAddressSpy,
        account,
      };
    };

    it('derives an account by address', async () => {
      const {
        getAccountSpy,
        updateAccountByAddressSpy,
        deriveAccountByIndexSpy,
        account,
      } = await setupDeriveAccountByAddressTest();

      const jsonData = await account.serialize();

      const service = createAccountService(network);
      await service.deriveAccountByAddress(account.address);

      expect(getAccountSpy).toHaveBeenCalled();
      expect(updateAccountByAddressSpy).toHaveBeenCalledWith(jsonData);
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

    it('throws `AccountMissMatchError` if the derived address is not match with state', async () => {
      const { account, deriveAccountByIndexSpy } =
        await setupDeriveAccountByAddressTest();

      const { accountObj: accountWithDifferentAddress } =
        await createAccountObject(network, 1);

      deriveAccountByIndexSpy.mockResolvedValue(accountWithDifferentAddress);

      const service = createAccountService(network);

      await expect(
        service.deriveAccountByAddress(account.address),
      ).rejects.toThrow(AccountMissMatchError);
    });
  });

  describe('getCurrentAccount', () => {
    // To test the case when the account is not selected,
    const setupGetCurrentAccountTest = async ({ hdIndex }) => {
      const { addAccountSpy, getCurrentAccountSpy, getAccountSpy } =
        mockAccountStateManager();

      const deriveAccountByIndexSpy = jest.spyOn(
        AccountService.prototype,
        'deriveAccountByIndex',
      );
      mockAccountContractReader({});

      const { accountObj } = await createAccountObject(network, hdIndex);
      const accountJsonData = await accountObj.serialize();

      deriveAccountByIndexSpy.mockResolvedValue(accountObj);
      getCurrentAccountSpy.mockResolvedValue(accountJsonData);
      getAccountSpy.mockResolvedValue(accountJsonData);
      addAccountSpy.mockReturnThis();

      return {
        deriveAccountByIndexSpy,
        getCurrentAccountSpy,
        addAccountSpy,
        getAccountSpy,
        accountObj,
      };
    };

    it('returns the selected `Account` object if the current account has been set', async () => {
      const { accountObj, addAccountSpy, deriveAccountByIndexSpy } =
        await setupGetCurrentAccountTest({ hdIndex: 1 });
      const accountJsonData = await accountObj.serialize();

      const service = createAccountService(network);
      const result = await service.getCurrentAccount();

      expect(result).toStrictEqual(accountObj);
      expect(addAccountSpy).not.toHaveBeenCalled();
      expect(deriveAccountByIndexSpy).toHaveBeenCalledWith(
        result.hdIndex,
        accountJsonData,
      );
    });

    it('returns a `Account` object that derived from index 0 if the current account has not been set', async () => {
      const defaultIndex = Config.account.defaultAccountIndex;
      const {
        accountObj,
        getCurrentAccountSpy,
        deriveAccountByIndexSpy,
        getAccountSpy,
        addAccountSpy,
      } = await setupGetCurrentAccountTest({ hdIndex: defaultIndex });
      // Simulate the case when the current account has not been set.
      getCurrentAccountSpy.mockResolvedValue(null);
      getAccountSpy.mockResolvedValue(null);
      const accountJsonData = await accountObj.serialize();

      const service = createAccountService(network);
      const result = await service.getCurrentAccount();

      expect(result).toStrictEqual(accountObj);
      expect(result.hdIndex).toStrictEqual(defaultIndex);
      expect(addAccountSpy).toHaveBeenCalledWith(accountJsonData);
      expect(deriveAccountByIndexSpy).toHaveBeenCalledWith(
        defaultIndex,
        undefined,
      );
    });

    it('throws `AccountNotFoundError` if the current account is set but the account does not exist from state', async () => {
      const defaultIndex = Config.account.defaultAccountIndex;
      const { getAccountSpy } = await setupGetCurrentAccountTest({
        hdIndex: defaultIndex,
      });
      // Simulate the case when the current account is set, but the account does not exist from state.
      getAccountSpy.mockResolvedValue(null);

      const service = createAccountService(network);
      await expect(service.getCurrentAccount()).rejects.toThrow(
        AccountNotFoundError,
      );
    });
  });

  describe('switchAccount', () => {
    it('switches the account for the network', async () => {
      const { switchAccountSpy } = mockAccountStateManager();
      switchAccountSpy.mockResolvedValue();
      mockAccountContractReader({});
      const { accountObj } = await createAccountObject(network, 0);

      const service = createAccountService(network);
      await service.switchAccount(accountObj);

      expect(switchAccountSpy).toHaveBeenCalledWith({
        chainId: accountObj.chainId,
        accountToSwitch: await accountObj.serialize(),
      });
    });
  });

  describe('addAccount', () => {
    it('addd the account for the network', async () => {
      const { addAccountSpy, getNextIndexSpy, setCurrentAccountSpy } =
        mockAccountStateManager();
      const nextIndex = 1;
      const deriveAccountByIndexSpy = jest.spyOn(
        AccountService.prototype,
        'deriveAccountByIndex',
      );
      addAccountSpy.mockReturnThis();
      getNextIndexSpy.mockResolvedValue(nextIndex);
      mockAccountContractReader({});
      const { accountObj } = await createAccountObject(network, nextIndex);
      deriveAccountByIndexSpy.mockResolvedValue(accountObj);
      const accountJsonData = await accountObj.serialize();

      const service = createAccountService(network);
      const result = await service.addAccount();

      expect(result).toStrictEqual(accountObj);
      expect(addAccountSpy).toHaveBeenCalledWith(accountJsonData);
      expect(setCurrentAccountSpy).toHaveBeenCalledWith(accountJsonData);
      expect(deriveAccountByIndexSpy).toHaveBeenCalledWith(
        nextIndex,
        undefined,
      );
    });
  });
});
