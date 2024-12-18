import { constants } from 'starknet';

import { Config } from '../config';
import { getRPCUrl } from './rpc-provider';

describe('getRPCUrl', () => {
  beforeEach(function () {
    Config.rpcApiKey = 'API_KEY';
  });
  afterEach(function () {
    Config.rpcApiKey = '';
  });

  it('returns Mainnet RPC URL if chain id is Mainnet', () => {
    expect(getRPCUrl(constants.StarknetChainId.SN_MAIN)).toBe(
      `https://starknet-mainnet.infura.io/v3/${Config.rpcApiKey}`,
    );
  });

  it('returns Sepolia RPC URL if chain id is not either Mainnet or Sepolia', () => {
    expect(getRPCUrl('0x534e5f474f45524c49')).toBe(
      `https://starknet-sepolia.infura.io/v3/${Config.rpcApiKey}`,
    );
  });

  it('returns Sepolia RPC URL if chain id is Sepolia', () => {
    expect(getRPCUrl(constants.StarknetChainId.SN_SEPOLIA)).toBe(
      `https://starknet-sepolia.infura.io/v3/${Config.rpcApiKey}`,
    );
  });
});
