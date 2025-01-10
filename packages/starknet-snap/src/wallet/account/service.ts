import { AccountStateManager } from '../../state/account-state-manager';
import type { Network } from '../../types/snapState';
import { getBip44Deriver } from '../../utils';
import {
  AccountNotFoundError,
  MaxAccountLimitExceededError,
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
   * Removes an account from the state.
   *
   * @param account - The  `Account` object to remove.
   */
  async removeAccount(account: Account): Promise<void> {
    await this.accountStateMgr.removeAccount({
      address: account.address,
      chainId: account.chainId,
    });
  }

  /**
   * Derives a BIP44 node from an index and constructs a new `Account` object using the derived private key and public key.
   * The `Account` object is assigned a `CairoAccountContract` contract and is then serialized and persisted to the state.
   *
   * @param [index] - Optional. The hd index to derive the account from. If not provided, the next index will be used.
   * @returns A promise that resolves to the newly created `Account` object.
   */
  async deriveAccountByIndex(index?: number): Promise<Account> {
    const { chainId } = this.network;

    // use `withTransaction` to ensure that the state is not modified if an error occurs.
    return this.accountStateMgr.withTransaction(async (state) => {
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
      });

      await this.accountStateMgr.upsertAccount(await account.serialize());

      // FIXME: this is a convenience way to check if the account limit has been exceeded at the last line of the code. However, it is possible to improve if we can check it before the account is derived.
      if (
        await this.accountStateMgr.isMaxAccountLimitExceeded(
          {
            chainId,
          },
          state,
        )
      ) {
        throw new MaxAccountLimitExceededError();
      }

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
      return await this.deriveAccountByIndex(accountFromState.addressIndex);
    }

    throw new AccountNotFoundError();
  }
}
