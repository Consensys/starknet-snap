import { originPermissions, validateOrigin, RpcMethod } from './permission';

describe('validateOrigin', () => {
  const walletUIDappPermissions = Array.from(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    originPermissions.get('https://snaps.consensys.io')!,
  );
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const publicPermissions = Array.from(originPermissions.get('*')!);
  const restrictedPermissions = [
    RpcMethod.DeployCario0Account,
    RpcMethod.GetTransactions,
    RpcMethod.UpgradeAccContract,
    RpcMethod.GetStarkName,
    RpcMethod.GetAddressByStarkName,
    RpcMethod.ReadContract,
    RpcMethod.GetStoredErc20Tokens,
    RpcMethod.AddAccount,
    RpcMethod.SwitchAccount,
  ];

  it.each(walletUIDappPermissions)(
    "pass the validation with a valid Wallet UI Dapp's origin and a whitelisted method. method - %s",
    (method: string) => {
      expect(() =>
        validateOrigin('https://snaps.consensys.io', method),
      ).not.toThrow();
    },
  );

  it.each(publicPermissions)(
    'pass the validation with any origin and a whitelisted method. method - %s',
    (method: string) => {
      expect(() => validateOrigin('https://any.io', method)).not.toThrow();
    },
  );

  it.each(restrictedPermissions)(
    'throw a `Permission denied` if the method is restricted for public. method - %s',
    (method: string) => {
      expect(() => validateOrigin('https://any.io', method)).toThrow(
        'Permission denied',
      );
    },
  );

  it('throw a `Permission denied` if the method is not exist.', () => {
    expect(() => validateOrigin('https://any.io', 'method_not_exist')).toThrow(
      'Permission denied',
    );
    expect(() =>
      validateOrigin('https://snaps.consensys.io', 'method_not_exist'),
    ).toThrow('Permission denied');
  });

  it('throw a `Origin not found` if the orgin is not given or empty.', () => {
    expect(() => validateOrigin('', 'method_not_exist')).toThrow(
      'Origin not found',
    );
  });
});
