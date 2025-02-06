import { AccountStateManager } from '../../state/account-state-manager';
import type { AccContract, Network } from '../../types/snapState';
import { getBip44Deriver } from '../../utils';
import { AccountNotFoundError } from '../../utils/exceptions';
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
   * Derives a BIP44 node from an index and constructs a new `Account` object using the derived private key and public key.
   * The `Account` object is assigned a `CairoAccountContract` contract and is then serialized and persisted to the state.
   *
   * @param [index] - Optional. The hd index to derive the account from. If not provided, the next index will be used.
   * @param [jsonData] - Optional. The jsonData to assign to the account.
   * @returns A promise that resolves to the newly created `Account` object.
   */
  async deriveAccountByIndex(
    index?: number,
    jsonData?: AccContract,
  ): Promise<Account> {
    const { chainId } = this.network;

    // use `withTransaction` to ensure that the state is not modified if an error occurs.
    return this.accountStateMgr.withTransaction(async () => {
      let hdIndex = index;
      if (hdIndex === undefined) {
        hdIndex = await this.accountStateMgr.getNextIndex(chainId);
      }

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

      await this.accountStateMgr.upsertAccount(await account.serialize());

      return account;
    });
  }

  /**
   * Derives an account by address.
   * if the account is not found in the state, an `AccountNotFoundError` will be thrown.
   *
   * @param address - The address of the account to derive.
   * @returns A promise that resolves to the derived `Account` object.
   */
  async deriveAccountByAddress(address: string): Promise<Account> {
    const accountFromState = await this.accountStateMgr.getAccount({
      address,
      chainId: this.network.chainId,
    });

    if (accountFromState) {
      return await this.deriveAccountByIndex(
        accountFromState.addressIndex,
        accountFromState,
      );
    }

    throw new AccountNotFoundError();
  }

  /**
   * Gets the selected account for the network.
   * if there is no account selected, return an account with index 0.
   *
   * @returns A promise that resolves to a `Account` object.
   */
  async getCurrentAccount(): Promise<Account> {
    const activeAccount = await this.accountStateMgr.getCurrentAccount({
      chainId: this.network.chainId,
    });
    // Active account only be undefined if the account state is new.
    // In that case, we will derive a index 0 account with default metadata.
    return await this.deriveAccountByIndex(
      activeAccount ? activeAccount.addressIndex : 0,
      activeAccount ?? undefined,
    );
  }

  /**
   * Switches the account for the network.
   * The account to switch must be in the same chain.
   *
   * @param chainId - The chain ID.
   * @param accountToSwitch - The account to switch to.
   */
  async switchAccount(
    chainId: string,
    accountToSwitch: Account,
  ): Promise<void> {
    await this.accountStateMgr.switchAccount({
      chainId,
      accountToSwitch: await accountToSwitch.serialize(),
    });
  }
}
