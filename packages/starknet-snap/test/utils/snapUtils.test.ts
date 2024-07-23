import { expect } from 'chai';
import { Mutex } from 'async-mutex';
import { constants } from 'starknet';

import {
  dappUrl,
  removeNetwork,
  getVoyagerUrl,
  getTransactionFromVoyagerUrl,
  getTransactionsFromVoyagerUrl,
  getVoyagerCredentials,
  getRPCUrl,
  getValidNumber,
  addDialogTxt,
  getNetworkTxt,
  getTxnSnapTxt,
} from '../../src/utils/snapUtils';
import { WalletMock } from '../wallet.mock.test';
import { Network, SnapState } from '../../src/types/snapState';
import {
  STARKNET_SEPOLIA_TESTNET_NETWORK,
  STARKNET_TESTNET_NETWORK,
  STARKNET_MAINNET_NETWORK,
} from '../../src/utils/constants';

describe('Snap Utils', () => {
  it('should return the proper dapp URL based on the environment', () => {
    let envt = 'dev';
    expect(dappUrl(envt)).to.be.equal('https://dev.snaps.consensys.io/starknet');

    envt = 'staging';
    expect(dappUrl(envt)).to.be.equal('https://staging.snaps.consensys.io/starknet');

    envt = 'prod';
    expect(dappUrl(envt)).to.be.equal('https://snaps.consensys.io/starknet');
  });

  it('should return the PROD URL if invalid envt detected', () => {
    const envt = 'abc123';
    expect(dappUrl(envt)).to.be.equal('https://snaps.consensys.io/starknet');
  });

  it('should return the PROD URL if envt is undefined', () => {
    expect(dappUrl(undefined)).to.be.equal('https://snaps.consensys.io/starknet');
  });
});

describe('removeNetwork', () => {
  const setupStubs = (
    currentNetwork?: Network,
    defaultNetworks: Network[] = [STARKNET_SEPOLIA_TESTNET_NETWORK, STARKNET_TESTNET_NETWORK, STARKNET_MAINNET_NETWORK],
  ) => {
    const walletStub = new WalletMock();
    const state: SnapState = {
      accContracts: [],
      erc20Tokens: [],
      networks: defaultNetworks,
      transactions: [],
      currentNetwork: currentNetwork,
    };
    walletStub.rpcStubs.snap_manageState.resolves(state);
    return { walletStub, state };
  };

  it('removes the network if the target network found', async function () {
    const { walletStub, state } = setupStubs();

    await removeNetwork(STARKNET_TESTNET_NETWORK, walletStub, new Mutex());

    expect(state.networks).to.be.eql([STARKNET_SEPOLIA_TESTNET_NETWORK, STARKNET_MAINNET_NETWORK]);
  });

  it('does not remove the network if the target network not found', async function () {
    const { walletStub, state } = setupStubs();

    await removeNetwork(STARKNET_TESTNET_NETWORK, walletStub, new Mutex());

    expect(state.networks).to.be.eql([STARKNET_SEPOLIA_TESTNET_NETWORK, STARKNET_MAINNET_NETWORK]);
  });

  it('set current network to undefined if current network is equal to target network', async function () {
    const { walletStub, state } = setupStubs(STARKNET_TESTNET_NETWORK);

    expect(state.currentNetwork).to.be.eql(STARKNET_TESTNET_NETWORK);

    await removeNetwork(STARKNET_TESTNET_NETWORK, walletStub, new Mutex());

    expect(state.networks).to.be.eql([STARKNET_SEPOLIA_TESTNET_NETWORK, STARKNET_MAINNET_NETWORK]);
    expect(state.currentNetwork).to.be.eql(undefined);
  });

  it('does not set current network to undefined if current network is not equal to target network', async function () {
    const { walletStub, state } = setupStubs(STARKNET_MAINNET_NETWORK);

    expect(state.currentNetwork).to.be.eql(STARKNET_MAINNET_NETWORK);

    await removeNetwork(STARKNET_TESTNET_NETWORK, walletStub, new Mutex());

    expect(state.networks).to.be.eql([STARKNET_SEPOLIA_TESTNET_NETWORK, STARKNET_MAINNET_NETWORK]);
    expect(state.currentNetwork).to.be.eql(STARKNET_MAINNET_NETWORK);
  });
});

describe('getVoyagerUrl', () => {
  it('returns Mainnet URL if chain id is Mainnet', () => {
    expect(getVoyagerUrl(constants.StarknetChainId.SN_MAIN)).to.be.equal('https://api.voyager.online/beta');
  });

  it('returns Mainnet URL if chain id is not either Mainnet or Sepolia', () => {
    expect(getVoyagerUrl('0x534e5f474f45524c49')).to.be.equal('https://api.voyager.online/beta');
  });

  it('returns Sepolia URL if chain id is Sepolia', () => {
    expect(getVoyagerUrl(STARKNET_SEPOLIA_TESTNET_NETWORK.chainId)).to.be.equal(
      'https://sepolia-api.voyager.online/beta',
    );
  });
});

describe('getTransactionFromVoyagerUrl', () => {
  it('returns correct URL', () => {
    expect(getTransactionFromVoyagerUrl({ chainId: constants.StarknetChainId.SN_MAIN } as Network)).to.be.equal(
      'https://api.voyager.online/beta/txn',
    );
  });
});

describe('getTransactionsFromVoyagerUrl', () => {
  it('returns correct URL', () => {
    expect(getTransactionsFromVoyagerUrl({ chainId: constants.StarknetChainId.SN_MAIN } as Network)).to.be.equal(
      'https://api.voyager.online/beta/txns',
    );
  });
});

describe('getVoyagerCredentials', () => {
  it('returns correct credentials', () => {
    expect(getVoyagerCredentials()).to.have.key('X-API-Key');
  });
});

describe('getRPCUrl', () => {
  it('returns Mainnet RPC URL if chain id is Mainnet', () => {
    expect(getRPCUrl(constants.StarknetChainId.SN_MAIN)).to.be.equal(
      'https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_7/',
    );
  });

  it('returns Sepolia RPC URL if chain id is not either Mainnet or Sepolia', () => {
    expect(getRPCUrl('0x534e5f474f45524c49')).to.be.equal(
      'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/',
    );
  });

  it('returns Sepolia RPC URL if chain id is Sepolia', () => {
    expect(getRPCUrl(STARKNET_SEPOLIA_TESTNET_NETWORK.chainId)).to.be.equal(
      'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/',
    );
  });
});

describe('getValidNumber', () => {
  it('should return the number when obj is a valid number within the range', () => {
    expect(getValidNumber('5', 0, 1, 10)).to.eq(5);
  });

  it('should return defaultValue when obj is an empty string', () => {
    expect(getValidNumber('', 0, 1, 10)).to.eq(0);
  });

  it('should return defaultValue when obj is not a number', () => {
    expect(getValidNumber('abc', 0, 1, 10)).to.eq(0);
  });

  it('should return defaultValue when number is less than minVal', () => {
    expect(getValidNumber('-5', 0, 0, 10)).to.eq(0);
  });

  it('should return defaultValue when number is greater than maxVal', () => {
    expect(getValidNumber('15', 0, 0, 10)).to.eq(0);
  });

  it('should return the defaultValue when the input is NaN', () => {
    expect(getValidNumber(NaN, 0)).to.eq(0);
  });

  it('should handle default min and max values correctly', () => {
    expect(getValidNumber('9007199254740992', 0)).to.eq(0);
    expect(getValidNumber('-9007199254740992', 0)).to.eq(0);
    expect(getValidNumber('5', 0)).to.eq(5);
  });
});

describe('addDialogTxt', () => {
  it('should add a formatted text component to the components array', () => {
    const components = [];
    const label = 'Name';
    const value = 'John Doe';

    addDialogTxt(components, label, value);

    expect(components).to.have.lengthOf(2);
    expect(components[0]).to.deep.equal({type: 'text', value: '**Name:**'});
    expect(components[1]).to.deep.equal({type: 'copyable', value: 'John Doe'});
  });

  it('should correctly format text with an empty label', () => {
    const components = [];
    const label = '';
    const value = 'Some value';

    addDialogTxt(components, label, value);

    expect(components).to.have.lengthOf(2);
    expect(components[0]).to.deep.equal({type: 'text', value: '**:**'});
    expect(components[1]).to.deep.equal({type: 'copyable', value: 'Some value'});
  });

  it('should handle special characters in label and value', () => {
    const components = [];
    const label = 'New-Label_123';
    const value = 'Value#456!';

    addDialogTxt(components, label, value);

    expect(components).to.have.lengthOf(2);
    expect(components[0]).to.deep.equal({ type: 'text', value: '**New-Label_123:**' });
    expect(components[1]).to.deep.equal({ type: 'copyable', value: 'Value#456!' });
  });
});

describe('getNetworkTxt', function() {
  let network;

  beforeEach(() => {
    network = {
      name: 'Test Network',
      chainId: '123'
    };
  });

  afterEach(() => {
    network = null
  });

  it('should return correct output with only required fields', () => {
    const result = getNetworkTxt(network);

    expect(result).to.deep.equal([
      { type: 'text', value: '**Chain Name:**' },
      { type: 'copyable', value: 'Test Network' },
      { type: 'text', value: '**Chain ID:**' },
      { type: 'copyable', value: '123' }
    ]);
  });

  it('should return correct output with all fields present', () => {
    network.baseUrl = 'https://base.url';
    network.nodeUrl = 'https://rpc.url';
    network.voyagerUrl = 'https://explorer.url';

    const result = getNetworkTxt(network);

    expect(result).to.deep.equal([
      { type: 'text', value: '**Chain Name:**' },
      { type: 'copyable', value: 'Test Network' },
      { type: 'text', value: '**Chain ID:**' },
      { type: 'copyable', value: '123' },
      { type: 'text', value: '**Base URL:**' },
      { type: 'copyable', value: 'https://base.url' },
      { type: 'text', value: '**RPC URL:**' },
      { type: 'copyable', value: 'https://rpc.url' },
      { type: 'text', value: '**Explorer URL:**' },
      { type: 'copyable', value: 'https://explorer.url' }
    ]);
  });

  it('should return correct output with some optional fields', () => {
    network.baseUrl = 'https://base.url';

    const result = getNetworkTxt(network);

    expect(result).to.deep.equal([
      { type: 'text', value: '**Chain Name:**' },
      { type: 'copyable', value: 'Test Network' },
      { type: 'text', value: '**Chain ID:**' },
      { type: 'copyable', value: '123' },
      { type: 'text', value: '**Base URL:**' },
      { type: 'copyable', value: 'https://base.url' }
    ]);
  });
});

describe('getTxnSnapTxt', () => {
  let senderAddress;
  let network;
  let txnInvocation;
  let abis;
  let invocationsDetails;

  beforeEach(() => {
    senderAddress = '0xSenderAddress';
    network = {
      name: 'Test Network',
      chainId: '123'
    };
    txnInvocation = {
      method: 'transfer',
      params: [ '0xReceiverAddress', '1000' ]
    };
    abis = [
      {
        name: 'Transfer',
        inputs: [{ name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }],
        outputs: [{ name: '', type: 'bool' }]
      }
    ];
    invocationsDetails = {
      maxFee: '1000000000000000000',
      nonce: 123,
      version: 1
    };
  });

  it('should return correct output with all fields present', () => {
    const result = getTxnSnapTxt(senderAddress, network, txnInvocation, abis, invocationsDetails);

    expect(result).to.deep.equal([
      { type: 'text', value: '**Network:**' },
      { type: 'copyable', value: 'Test Network' },
      { type: 'text', value: '**Signer Address:**' },
      { type: 'copyable', value: '0xSenderAddress' },
      { type: 'text', value: '**Transaction Invocation:**' },
      { type: 'copyable', value: JSON.stringify(txnInvocation, null, 2) },
      { type: 'text', value: '**Abis:**' },
      { type: 'copyable', value: JSON.stringify(abis, null, 2) },
      { type: 'text', value: '**Max Fee(ETH):**' },
      { type: 'copyable', value: '1' },
      { type: 'text', value: '**Nonce:**' },
      { type: 'copyable', value: '123' },
      { type: 'text', value: '**Version:**' },
      { type: 'copyable', value: '1' }
    ]);
  });

  it('should return correct output with missing optional fields', () => {
    const result = getTxnSnapTxt(senderAddress, network, txnInvocation);

    expect(result).to.deep.equal([
      { type: 'text', value: '**Network:**' },
      { type: 'copyable', value: 'Test Network' },
      { type: 'text', value: '**Signer Address:**' },
      { type: 'copyable', value: '0xSenderAddress' },
      { type: 'text', value: '**Transaction Invocation:**' },
      { type: 'copyable', value: JSON.stringify(txnInvocation, null, 2) }
    ]);
  });
});