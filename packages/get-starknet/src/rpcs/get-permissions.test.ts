import { Permission } from 'get-starknet-core';

import { WalletGetPermissions } from './get-permissions';

describe('WalletGetPermissions', () => {
  it('returns the permissions', async () => {
    const walletGetPermissions = new WalletGetPermissions();
    const result = await walletGetPermissions.execute();

    expect(result).toStrictEqual([Permission.ACCOUNTS]);
  });
});
