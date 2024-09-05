import type { DataClientDriver } from '../config';
import { Config } from '../config';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import { ChainService } from './chain';
import { createChainService } from './factory';

describe('createChainService', () => {
  it('creates a chain service', () => {
    const instance = createChainService(STARKNET_SEPOLIA_TESTNET_NETWORK);
    expect(instance).toBeInstanceOf(ChainService);
  });

  it('throws `Invalid Data Client` if the data client driver is not exist', () => {
    const originalDriver = Config.transaction.dataClient.driver;

    Config.transaction.dataClient.driver =
      'invalid' as unknown as DataClientDriver;

    expect(() => createChainService(STARKNET_SEPOLIA_TESTNET_NETWORK)).toThrow(
      'Invalid Data Client',
    );

    Config.transaction.dataClient.driver = originalDriver;
  });
});
