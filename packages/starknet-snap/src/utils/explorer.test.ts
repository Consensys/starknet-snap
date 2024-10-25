import { constants } from 'starknet';

import { getExplorerUrl } from './explorer';

describe('getExplorerUrl', () => {
  const address =
    '0x074aaeb168bbd155d41290e6be09d80c9e937ee3d775eac19519a2fcc76fc61c';

  it('returns a sepolia testnet explorer url', () => {
    const result = getExplorerUrl(
      address,
      constants.StarknetChainId.SN_SEPOLIA,
    );
    expect(result).toBe(`https://sepolia.voyager.online/contract/${address}`);
  });

  it('returns a mainnet explorer url', () => {
    const result = getExplorerUrl(address, constants.StarknetChainId.SN_MAIN);
    expect(result).toBe(`https://voyager.online/contract/${address}`);
  });

  it('throws `Invalid Chain ID` error if the given Chain ID is not support', () => {
    expect(() => getExplorerUrl(address, 'some Chain ID')).toThrow(
      'Invalid Chain ID',
    );
  });
});
