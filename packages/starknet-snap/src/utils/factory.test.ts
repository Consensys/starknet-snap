import { StarkScanClient } from '../chain/data-client/starkscan';
import { Config, DataClient } from '../config';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from './constants';
import { createStarkScanClient } from './factory';

describe('createStarkScanClient', () => {
  const config = Config.dataClient[DataClient.STARKSCAN];

  it('creates a StarkScan client', () => {
    config.apiKey = 'API_KEY';
    expect(
      createStarkScanClient(STARKNET_SEPOLIA_TESTNET_NETWORK),
    ).toBeInstanceOf(StarkScanClient);
    config.apiKey = undefined;
  });

  it('throws `Missing StarkScan API key` error if the StarkScan API key is missing', () => {
    expect(() =>
      createStarkScanClient(STARKNET_SEPOLIA_TESTNET_NETWORK),
    ).toThrow('Missing StarkScan API key');
  });
});
