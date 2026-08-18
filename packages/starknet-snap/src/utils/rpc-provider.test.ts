import { constants } from 'starknet';

import { Config } from '../config';
import { getRPCUrl } from './rpc-provider';

describe('getRPCUrl', () => {
  beforeEach(function () {
    Config.rpcApiKeyAlchemy = 'API_KEY';
    Config.rpcApiKeyDin = 'API_KEY';
  });
  afterEach(function () {
    Config.rpcApiKeyAlchemy = '';
    Config.rpcApiKeyDin = '';
  });

  it('returns Mainnet RPC URL if chain id is Mainnet', () => {
    expect(getRPCUrl(constants.StarknetChainId.SN_MAIN)).toBe(
      `https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_9/${Config.rpcApiKeyAlchemy}`,
    );
  });

  it('returns Sepolia RPC URL if chain id is not either Mainnet or Sepolia', () => {
    expect(getRPCUrl('0x534e5f474f45524c49')).toBe(
      `https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_9/${Config.rpcApiKeyAlchemy}`,
    );
  });

  it('returns Sepolia RPC URL if chain id is Sepolia', () => {
    expect(getRPCUrl(constants.StarknetChainId.SN_SEPOLIA)).toBe(
      `https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_9/${Config.rpcApiKeyAlchemy}`,
    );
  });
});
