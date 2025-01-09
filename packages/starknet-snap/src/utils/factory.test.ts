import { StarkScanClient } from '../chain/data-client/starkscan';
import { TransactionService } from '../chain/transaction-service';
import { Config, DataClient } from '../config';
import { AccountService } from '../wallet/account';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from './constants';
import {
  createAccountService,
  createStarkScanClient,
  createTransactionService,
} from './factory';

const config = Config.dataClient[DataClient.STARKSCAN];

describe('createStarkScanClient', () => {
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

describe('createTransactionService', () => {
  it('creates a Transaction service', () => {
    config.apiKey = 'API_KEY';
    expect(
      createTransactionService(STARKNET_SEPOLIA_TESTNET_NETWORK),
    ).toBeInstanceOf(TransactionService);
    config.apiKey = undefined;
  });
});

describe('createAccountService', () => {
  it('creates a Account service', () => {
    expect(
      createAccountService(STARKNET_SEPOLIA_TESTNET_NETWORK),
    ).toBeInstanceOf(AccountService);
  });
});
