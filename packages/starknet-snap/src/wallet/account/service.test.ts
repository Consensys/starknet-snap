import { generateMnemonic } from 'bip39';

import { AccountContractReader, AccountService, Cairo1Contract } from '.';
import { generateAccounts, generateKeyDeriver } from '../../__tests__/helper';
import { AccountStateManager } from '../../state/account-state-manager';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../utils/constants';
import { AccountNotFoundError } from '../../utils/exceptions';
import { createAccountService } from '../../utils/factory';
import * as snapUtils from '../../utils/snap';
import {
  createAccountObject,
  mockAccountContractReader,
} from './__test__/helper';
import { Account } from './account';
import { AccountContractDiscovery } from './discovery';

jest.mock('../../utils/logger');

describe('AccountService', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  describe('deriveAccountByIndex', () => {
    const setupDeriveAccountByIndexTest = async (hdIndex) => {
      const mnemonicString = generateMnemonic();

      const [account] = await generateAccounts(
        network.chainId,
        1,
        '1',
        hdIndex,
        mnemonicString,
      );
      const deriver = await generateKeyDeriver(mnemonicString);

      const getNextIndexSpy = jest.spyOn(
        AccountStateManager.prototype,
        'getNextIndex',
      );
      const upsertAccountSpy = jest.spyOn(
        AccountStateManager.prototype,
        'upsertAccount',
      );
      const getCairoContractSpy = jest.spyOn(
        AccountContractDiscovery.prototype,
        'getContract',
      );
      jest.spyOn(snapUtils, 'getBip44Deriver').mockResolvedValue(deriver);

      mockAccountContractReader({});

      const cairo1Contract = new Cairo1Contract(
        account.publicKey,
        new AccountContractReader(network),
      );

      getCairoContractSpy.mockResolvedValue(cairo1Contract);
      getNextIndexSpy.mockResolvedValue(hdIndex);

      return {
        upsertAccountSpy,
        getNextIndexSpy,
        getCairoContractSpy,
        cairo1Contract,
        account,
      };
    };

    it('derive an account with the auto increment index', async () => {
      const hdIndex = 0;
      const {
        getNextIndexSpy,
        getCairoContractSpy,
        upsertAccountSpy,
        cairo1Contract,
        account,
      } = await setupDeriveAccountByIndexTest(hdIndex);

      const service = createAccountService(network);
      const accountObject = await service.deriveAccountByIndex();

      expect(getNextIndexSpy).toHaveBeenCalled();
      expect(upsertAccountSpy).toHaveBeenCalledWith(
        await accountObject.serialize(),
      );
      expect(getCairoContractSpy).toHaveBeenCalledWith(account.publicKey);
      expect(accountObject).toBeInstanceOf(Account);
      expect(accountObject).toHaveProperty('accountContract', cairo1Contract);
      expect(accountObject).toHaveProperty('address', account.address);
      expect(accountObject).toHaveProperty('chainId', account.chainId);
      expect(accountObject).toHaveProperty('privateKey', account.privateKey);
      expect(accountObject).toHaveProperty('publicKey', account.publicKey);
      expect(accountObject).toHaveProperty('hdIndex', hdIndex);
      expect(accountObject).toHaveProperty('addressSalt', account.publicKey);
    });

    it('derive an account with the given index', async () => {
      const hdIndex = 2;
      const {
        getNextIndexSpy,
        getCairoContractSpy,
        cairo1Contract,
        account,
        upsertAccountSpy,
      } = await setupDeriveAccountByIndexTest(hdIndex);

      const service = createAccountService(network);
      const accountObject = await service.deriveAccountByIndex(hdIndex);

      expect(getNextIndexSpy).not.toHaveBeenCalled();
      expect(upsertAccountSpy).toHaveBeenCalledWith(
        await accountObject.serialize(),
      );
      expect(getCairoContractSpy).toHaveBeenCalledWith(account.publicKey);
      expect(accountObject).toBeInstanceOf(Account);
      expect(accountObject).toHaveProperty('accountContract', cairo1Contract);
      expect(accountObject).toHaveProperty('address', account.address);
      expect(accountObject).toHaveProperty('chainId', account.chainId);
      expect(accountObject).toHaveProperty('privateKey', account.privateKey);
      expect(accountObject).toHaveProperty('publicKey', account.publicKey);
      expect(accountObject).toHaveProperty('hdIndex', hdIndex);
      expect(accountObject).toHaveProperty('addressSalt', account.publicKey);
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
