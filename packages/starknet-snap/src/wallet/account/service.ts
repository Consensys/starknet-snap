import { Config } from '../../config';
import { AccountStateManager } from '../../state/account-state-manager';
import type {
  AccContract,
  AccountMetaData,
  Network,
} from '../../types/snapState';
import { getBip44Deriver, logger } from '../../utils';
import {
  AccountMissMatchError,
  AccountNotFoundError,
} from '../../utils/exceptions';
import { Account } from './account';
import { AccountContractDiscovery } from './discovery';
import { AccountKeyPair } from './keypair';

export class AccountService {
  protected network: Network;

  protected accountStateMgr: AccountStateManager;

  protected accountContractDiscoveryService: AccountContractDiscovery;

  constructor({
    network,
    accountStateMgr = new AccountStateManager(),
  }: {
    network: Network;
    accountStateMgr?: AccountStateManager;
  }) {
    this.network = network;
    this.accountStateMgr = accountStateMgr;
    this.accountContractDiscoveryService = new AccountContractDiscovery(
      network,
    );
  }

  /**
   * Retrieves the next available index for account derivation.
   *
   * @returns A promise that resolves to the next available index.
   */
  async getNextIndex(): Promise<number> {
    const { chainId } = this.network;

    return await this.accountStateMgr.getNextIndex(chainId);
  }

  /**
   * Derives a BIP44 node from an index and constructs a new `Account` object using the derived private key and public key.
   * The `Account` object is assigned a `CairoAccountContract` contract and is then serialized and persisted to the state.
   *
   * @param hdIndex - The hd index to derive the account from. If not provided, the next index will be used.
   * @param [jsonData] - Optional. The jsonData to assign to the account.
   * @returns A promise that resolves to a `Account` object.
   */
  async deriveAccountByIndex(
    hdIndex: number,
    jsonData?: Partial<AccContract>,
  ): Promise<Account> {
    // Derive a BIP44 node from an index. e.g m/44'/60'/0'/0/{hdIndex}
    const deriver = await getBip44Deriver();
    const node = await deriver(hdIndex);

    // Grind a new private key and public key from the derived node.
    // Private key and public key are independent from the account contract.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { privateKey, publicKey } = new AccountKeyPair(node.privateKey!);

    const accountContract =
      await this.accountContractDiscoveryService.getContract(publicKey);
    const account = new Account({
      privateKey,
      publicKey,
      chainId: this.network.chainId,
      hdIndex,
      addressSalt: publicKey,
      accountContract,
      jsonData,
    });

    return account;
  }

  /**
   * Derives an account by address.
   * if the account is not found in the state, an `AccountNotFoundError` will be thrown.
   *
   * @param address - The address of the account to derive.
   * @returns A promise that resolves to the derived `Account` object.
   * @throws `AccountNotFoundError` if the account is not found in the state.
   * @throws `AccountMissMatchError` if the derived account address does not match the provided address.
   */
  async deriveAccountByAddress(address: string): Promise<Account> {
    return await this.accountStateMgr.withTransaction(async (state) => {
      const accountFromState = await this.accountStateMgr.getAccount(
        {
          address,
          chainId: this.network.chainId,
        },
        state,
      );

      if (!accountFromState) {
        throw new AccountNotFoundError();
      }

      const account = await this.deriveAccountByIndex(
        accountFromState.addressIndex,
        accountFromState,
      );

      this.ensureAccountAddressMatch(account, accountFromState.address);

      // Ensure the derived account is in sync with the state.
      await this.accountStateMgr.updateAccountByAddress(
        await account.serialize(),
      );

      return account;
    });
  }

  /**
   * Gets the selected account for the network.
   * If there is no account selected, return an account with index 0.
   *
   * @returns A promise that resolves to a `Account` object.
   */
  async getCurrentAccount(): Promise<Account> {
    const { chainId } = this.network;

    return await this.accountStateMgr.withTransaction(async (state) => {
      const currentAccount = await this.accountStateMgr.getCurrentAccount(
        {
          chainId,
        },
        state,
      );

      // `currentAccount` may be absent if the account state is new / it was upgrade from a previous version, fallback to use the default account index.
      const addressIndex =
        currentAccount?.addressIndex ?? Config.account.defaultAccountIndex;

      const accountInState = await this.accountStateMgr.getAccount(
        {
          chainId,
          addressIndex,
        },
        state,
      );

      // Edge case, the account in the state should always exist if current account has set.
      if (currentAccount && !accountInState) {
        logger.error(
          'Account in state is missing, but current account has been set.',
        );
        throw new AccountNotFoundError();
      }

      // In case the `currentAccount`'s metadata is out-of-date, derive the account with the data from state is more reliable.
      const account = await this.deriveAccountByIndex(
        addressIndex,
        accountInState ?? undefined,
      );

      const accountJsonData = await account.serialize();

      // While getting the current account,
      // if the account is not found in the state, add it to the state.
      // Otherwise, it is not necessary to update it to the state.
      if (accountInState === null) {
        await this.accountStateMgr.addAccount(accountJsonData);
        await this.accountStateMgr.setCurrentAccount(accountJsonData);
      } else {
        this.ensureAccountAddressMatch(account, accountInState.address);
      }

      return account;
    });
  }

  /**
   * Switches the account for the network.
   * The account to switch must be in the same chain.
   *
   * @param accountToSwitch - The account to switch to.
   */
  async switchAccount(accountToSwitch: Account): Promise<void> {
    const { chainId } = this.network;

    await this.accountStateMgr.switchAccount({
      chainId,
      accountToSwitch: await accountToSwitch.serialize(),
    });
  }

  /**
   * Add an account for the network.
   * And set the current account to the newly added account.
   *
   * @param metadata
   * @returns A promise that resolves to an `Account` object.
   * @throws `Error` if an account with the same name already exists.
   */
  async addAccount(metadata?: AccountMetaData): Promise<Account> {
    const { chainId } = this.network;

    return await this.accountStateMgr.withTransaction(async (state) => {
      const nextIndex = await this.accountStateMgr.getNextIndex(chainId, state);

      const account = await this.deriveAccountByIndex(nextIndex, metadata);

      const accountJsonData = await account.serialize();

      await this.accountStateMgr.addAccount(accountJsonData);

      // Always set the current account to the newly added account.
      // Hence, the client side does not need to call `switchAccount` after adding a new account.
      await this.accountStateMgr.setCurrentAccount(accountJsonData);

      return account;
    });
  }

  /**
   * A safeguard to ensure the derived account address is match with the provided address.
   * Expecting the derived account should have the same address with the given one.
   *
   * @param account - The derived account.
   * @param address - The address to compare.
   * @throws `AccountMissMatchError` if the derived account address does not match the provided address.
   */
  protected ensureAccountAddressMatch(account: Account, address: string): void {
    if (account.address !== address) {
      throw new AccountMissMatchError();
    }
  }
}
