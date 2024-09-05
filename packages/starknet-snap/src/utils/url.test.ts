import { Config } from '../config';
import { SnapEnv } from './constants';
import { DappUrl, getDappUrl, getDappUrlByEnv } from './url';

describe('getDappUrlByEnv', () => {
  it.each([Object.values(SnapEnv)])(
    'returns the dapp URL based on the environment',
    (snapEnv: SnapEnv) => {
      expect(getDappUrlByEnv(snapEnv)).toStrictEqual(DappUrl[snapEnv]);
    },
  );

  it('returns the production URL if the given environment is invalid', () => {
    expect(getDappUrlByEnv('invalid-env' as unknown as SnapEnv)).toStrictEqual(
      DappUrl[SnapEnv.Prod],
    );
  });
});

describe('getDappUrl', () => {
  it('returns the dapp URL', () => {
    expect(getDappUrl()).toStrictEqual(DappUrl[Config.snapEnv]);
  });
});
