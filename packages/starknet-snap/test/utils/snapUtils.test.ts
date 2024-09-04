import { expect } from 'chai';
import { Mutex } from 'async-mutex';
import { constants } from 'starknet';

import {
  removeNetwork,
  getVoyagerUrl,
  getTransactionFromVoyagerUrl,
  getTransactionsFromVoyagerUrl,
  getVoyagerCredentials,
  getRPCUrl,
} from '../../src/utils/snapUtils';
import { WalletMock } from '../wallet.mock.test';
import { Network, SnapState } from '../../src/types/snapState';
import {
  STARKNET_SEPOLIA_TESTNET_NETWORK,
  STARKNET_TESTNET_NETWORK,
  STARKNET_MAINNET_NETWORK,
} from '../../src/utils/constants';
import { SnapsProvider } from '@metamask/snaps-sdk';

describe('removeNetwork', () => {
  const setupStubs = (
    currentNetwork?: Network,
    defaultNetworks: Network[] = [
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      STARKNET_TESTNET_NETWORK,
      STARKNET_MAINNET_NETWORK,
    ],
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

    await removeNetwork(
      STARKNET_TESTNET_NETWORK,
      walletStub as unknown as SnapsProvider,
      new Mutex(),
    );

    expect(state.networks).to.be.eql([
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      STARKNET_MAINNET_NETWORK,
    ]);
  });

  it('does not remove the network if the target network not found', async function () {
    const { walletStub, state } = setupStubs();

    await removeNetwork(
      STARKNET_TESTNET_NETWORK,
      walletStub as unknown as SnapsProvider,
      new Mutex(),
    );

    expect(state.networks).to.be.eql([
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      STARKNET_MAINNET_NETWORK,
    ]);
  });

  it('set current network to undefined if current network is equal to target network', async function () {
    const { walletStub, state } = setupStubs(STARKNET_TESTNET_NETWORK);

    expect(state.currentNetwork).to.be.eql(STARKNET_TESTNET_NETWORK);

    await removeNetwork(
      STARKNET_TESTNET_NETWORK,
      walletStub as unknown as SnapsProvider,
      new Mutex(),
    );

    expect(state.networks).to.be.eql([
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      STARKNET_MAINNET_NETWORK,
    ]);
    expect(state.currentNetwork).to.be.eql(undefined);
  });

  it('does not set current network to undefined if current network is not equal to target network', async function () {
    const { walletStub, state } = setupStubs(STARKNET_MAINNET_NETWORK);

    expect(state.currentNetwork).to.be.eql(STARKNET_MAINNET_NETWORK);

    await removeNetwork(
      STARKNET_TESTNET_NETWORK,
      walletStub as unknown as SnapsProvider,
      new Mutex(),
    );

    expect(state.networks).to.be.eql([
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      STARKNET_MAINNET_NETWORK,
    ]);
    expect(state.currentNetwork).to.be.eql(STARKNET_MAINNET_NETWORK);
  });
});

describe('getVoyagerUrl', () => {
  it('returns Mainnet URL if chain id is Mainnet', () => {
    expect(getVoyagerUrl(constants.StarknetChainId.SN_MAIN)).to.be.equal(
      'https://api.voyager.online/beta',
    );
  });

  it('returns Mainnet URL if chain id is not either Mainnet or Sepolia', () => {
    expect(getVoyagerUrl('0x534e5f474f45524c49')).to.be.equal(
      'https://api.voyager.online/beta',
    );
  });

  it('returns Sepolia URL if chain id is Sepolia', () => {
    expect(getVoyagerUrl(STARKNET_SEPOLIA_TESTNET_NETWORK.chainId)).to.be.equal(
      'https://sepolia-api.voyager.online/beta',
    );
  });
});

describe('getTransactionFromVoyagerUrl', () => {
  it('returns correct URL', () => {
    expect(
      getTransactionFromVoyagerUrl({
        chainId: constants.StarknetChainId.SN_MAIN,
      } as Network),
    ).to.be.equal('https://api.voyager.online/beta/txn');
  });
});

describe('getTransactionsFromVoyagerUrl', () => {
  it('returns correct URL', () => {
    expect(
      getTransactionsFromVoyagerUrl({
        chainId: constants.StarknetChainId.SN_MAIN,
      } as Network),
    ).to.be.equal('https://api.voyager.online/beta/txns');
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
