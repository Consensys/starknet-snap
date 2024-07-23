import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { getBip44EntropyStub, account1 } from '../constants.test';
import { SnapState } from '../../src/types/snapState';
import {
  ETHER_MAINNET,
  ETHER_SEPOLIA_TESTNET,
  STARKNET_MAINNET_NETWORK,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from '../../src/utils/constants';
import * as starknetUtils from '../../src/utils/starknetUtils';
import { onHomePage } from '../../src';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: onHomePage', function () {
  const walletStub = new WalletMock();
  // eslint-disable-next-line no-restricted-globals, @typescript-eslint/no-explicit-any
  const globalAny: any = global;
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [ETHER_MAINNET, ETHER_SEPOLIA_TESTNET],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK, STARKNET_MAINNET_NETWORK],
    transactions: [],
    currentNetwork: undefined,
  };

  beforeEach(function () {
    globalAny.snap = walletStub;
    walletStub.rpcStubs.snap_getBip44Entropy.callsFake(getBip44EntropyStub);
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
    globalAny.snap = undefined;
  });

  const prepareAccountDiscovery = () => {
    const getKeysFromAddressIndexSpy = sandbox.stub(starknetUtils, 'getKeysFromAddressIndex');
    const getCorrectContractAddressSpy = sandbox.stub(starknetUtils, 'getCorrectContractAddress');
    const getBalanceSpy = sandbox.stub(starknetUtils, 'getBalance');

    getKeysFromAddressIndexSpy.resolves({
      privateKey: 'pk',
      publicKey: 'pubkey',
      addressIndex: 1,
      derivationPath: `m / bip32:1' / bip32:1' / bip32:1' / bip32:1'`,
    });

    getCorrectContractAddressSpy.resolves({
      address: account1.address,
      signerPubKey: account1.publicKey,
      upgradeRequired: false,
      deployRequired: false,
    });

    getBalanceSpy.resolves('1000');
  };

  it('renders user address, user balance and network', async function () {
    walletStub.rpcStubs.snap_manageState.resolves(state);
    prepareAccountDiscovery();

    const result = await onHomePage();
    expect(result).to.eql({
      content: {
        type: 'panel',
        children: [
          { type: 'text', value: 'Address' },
          {
            type: 'copyable',
            value: account1.address,
          },
          {
            type: 'row',
            label: 'Network',
            value: {
              type: 'text',
              value: STARKNET_SEPOLIA_TESTNET_NETWORK.name,
            },
          },
          {
            type: 'row',
            label: 'Balance',
            value: {
              type: 'text',
              value: '0.000000000000001 ETH',
            },
          },
          { type: 'divider' },
          {
            type: 'text',
            value:
              'Visit the [companion dapp for Starknet](https://snaps.consensys.io/starknet) to manage your account.',
          },
        ],
      },
    });
  });

  it('renders selected network from state if `currentNetwork` is not undefined', async function () {
    walletStub.rpcStubs.snap_manageState.resolves({
      ...state,
      currentNetwork: ETHER_MAINNET,
    });
    prepareAccountDiscovery();

    const result = await onHomePage();
    expect(result).to.eql({
      content: {
        type: 'panel',
        children: [
          { type: 'text', value: 'Address' },
          {
            type: 'copyable',
            value: account1.address,
          },
          {
            type: 'row',
            label: 'Network',
            value: {
              type: 'text',
              value: ETHER_MAINNET.name,
            },
          },
          {
            type: 'row',
            label: 'Balance',
            value: {
              type: 'text',
              value: '0.000000000000001 ETH',
            },
          },
          { type: 'divider' },
          {
            type: 'text',
            value:
              'Visit the [companion dapp for Starknet](https://snaps.consensys.io/starknet) to manage your account.',
          },
        ],
      },
    });
  });

  it('throws error when state not found', async function () {
    let error;
    try {
      await onHomePage();
    } catch (err) {
      error = err;
    } finally {
      expect(error).to.be.an('error');
    }
  });
});
