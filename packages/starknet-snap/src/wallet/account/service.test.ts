import { generateMnemonic } from 'bip39';

import { AccountService } from '.';
import { generateKeyDeriver } from '../../__tests__/helper';
import {
  mockAccountStateManager,
  mockState,
} from '../../state/__tests__/helper';
import { AccountStateManager } from '../../state/account-state-manager';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../utils/constants';
import {
  AccountNotFoundError,
  MaxAccountLimitExceededError,
} from '../../utils/exceptions';
import { createAccountService } from '../../utils/factory';
import * as snapUtils from '../../utils/snap';
import {
  createAccountObject,
  mockAccountContractReader,
} from './__test__/helper';
import { Account } from './account';
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

      const {
        getNextIndexSpy,
        isMaxAccountLimitExceededSpy,
        upsertAccountSpy,
      } = mockAccountStateManager();

      mockAccountContractReader({});

      getNextIndexSpy.mockResolvedValue(hdIndex);
      isMaxAccountLimitExceededSpy.mockResolvedValue(false);

      return {
        upsertAccountSpy,
        getNextIndexSpy,
        getCairoContractSpy,
        account: accountObj,
        isMaxAccountLimitExceededSpy,
      };
    };

    it('derive an account with the auto increment index', async () => {
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
    });

    it('derive an account with the given index', async () => {
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
    });

    it('throws `MaxAccountLimitExceededError` error if the account to derive reach the maximum', async () => {
      const { isMaxAccountLimitExceededSpy } =
        await setupDeriveAccountByIndexTest(0);
      isMaxAccountLimitExceededSpy.mockResolvedValue(true);

      const service = createAccountService(network);

      await expect(service.deriveAccountByIndex()).rejects.toThrow(
        MaxAccountLimitExceededError,
      );
    });

    it('does not modify the state if an error has thrown', async () => {
      const { setDataSpy } = await mockState({});
      // mockAccountStateManager is only returning the spies,
      // it will not mock the function to return a value.
      const { isMaxAccountLimitExceededSpy } = mockAccountStateManager();

      const mnemonicString = generateMnemonic();
      await mockDeriveAccount(0, mnemonicString);
      await mockSnapDeriver(mnemonicString);
      mockAccountContractReader({});

      // A `MaxAccountLimitExceededError` will be thrown when `isMaxAccountLimitExceeded` is true.
      // Since this checking is placed at the end of the function,
      // it is the best way to test if the state is not modified if an error occurs.
      isMaxAccountLimitExceededSpy.mockResolvedValue(true);

      const service = createAccountService(network);

      await expect(service.deriveAccountByIndex()).rejects.toThrow(
        MaxAccountLimitExceededError,
      );
      expect(setDataSpy).not.toHaveBeenCalled();
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

      const { accountObj } = await createAccountObject(network, 0);
      getAccountSpy.mockResolvedValue(await accountObj.serialize());
      deriveAccountByIndexSpy.mockResolvedValue(accountObj);

      return {
        deriveAccountByIndexSpy,
        getAccountSpy,
        accountObj,
      };
    };

    it('derive an account by address', async () => {
      const { getAccountSpy, deriveAccountByIndexSpy, accountObj } =
        await setupDeriveAccountByAddressTest();

      const service = createAccountService(network);
      const accountObject = await service.deriveAccountByAddress(
        accountObj.address,
      );

      expect(getAccountSpy).toHaveBeenCalled();
      expect(deriveAccountByIndexSpy).toHaveBeenCalledWith(accountObj.hdIndex);
      expect(accountObject).toStrictEqual(accountObj);
    });

    it('throws `AccountNotFoundError` if the given address is not found', async () => {
      const { getAccountSpy, accountObj } =
        await setupDeriveAccountByAddressTest();

      getAccountSpy.mockResolvedValue(null);

      const service = createAccountService(network);

      await expect(
        service.deriveAccountByAddress(accountObj.address),
      ).rejects.toThrow(AccountNotFoundError);
    });
  });

  describe('removeAccount', () => {
    it('remove an account', async () => {
      const { accountObj } = await createAccountObject(network, 0);
      const removeAccountSpy = jest.spyOn(
        AccountStateManager.prototype,
        'removeAccount',
      );
      removeAccountSpy.mockResolvedValue();

      const service = createAccountService(network);
      await service.removeAccount(accountObj);

      expect(removeAccountSpy).toHaveBeenCalledWith({
        address: accountObj.address,
        chainId: accountObj.chainId,
      });
    });
  });
});
