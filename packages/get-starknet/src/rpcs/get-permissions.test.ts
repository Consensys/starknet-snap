import { Permission } from 'get-starknet-core';

import { mockWalletInit, createWallet } from '../__tests__/helper';
import { WalletGetPermissions } from './get-permissions';

describe('WalletGetPermissions', () => {
  it('returns the permissions', async () => {
    const wallet = createWallet();
    mockWalletInit({});

    const walletGetPermissions = new WalletGetPermissions(wallet);
    const result = await walletGetPermissions.execute();

    expect(result).toStrictEqual([Permission.ACCOUNTS]);
  });
});
