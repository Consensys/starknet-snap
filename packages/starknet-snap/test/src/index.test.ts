import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { SnapError } from '@metamask/snaps-sdk';

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
import * as createAccountApi from '../../src/createAccount';
import * as keyPairUtils from '../../src/utils/keyPair';
import * as logger from '../../src/utils/logger';
import { onHomePage, onRpcRequest } from '../../src';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('onRpcRequest', function () {
  const walletStub = new WalletMock();

  const mockSnap = () => {
    const globalAny: any = global;
    globalAny.snap = walletStub;
  };

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
    // Temp solution: Switch off logger after each test
    logger.logger.init('off');
  });

  it('processes request successfully', async function () {
    mockSnap();
    const createAccountSpy = sandbox.stub(createAccountApi, 'createAccount');
    const keyPairSpy = sandbox.stub(keyPairUtils, 'getAddressKeyDeriver');

    createAccountSpy.resolvesThis();
    keyPairSpy.resolvesThis();

    await onRpcRequest({
      origin: 'http://localhost:3000',
      request: {
        method: 'starkNet_createAccount',
        params: [],
        jsonrpc: '2.0',
        id: 1,
      },
    });

    expect(keyPairSpy).to.have.been.calledOnce;
    expect(createAccountSpy).to.have.been.calledOnce;
  });

  it('throws `Unable to execute the rpc request` error if an error has thrown and `LogLevel` is `OFF`', async function () {
    mockSnap();
    const createAccountSpy = sandbox.stub(createAccountApi, 'createAccount');
    const keyPairSpy = sandbox.stub(keyPairUtils, 'getAddressKeyDeriver');

    createAccountSpy.rejects(new Error('Custom Error'));
    keyPairSpy.resolvesThis();

    let expectedError;

    try {
      await onRpcRequest({
        origin: 'http://localhost:3000',
        request: {
          method: 'starkNet_createAccount',
          params: [],
          jsonrpc: '2.0',
          id: 1,
        },
      });
    } catch (error) {
      expectedError = error;
    } finally {
      expect(expectedError).to.be.instanceOf(SnapError);
      expect(expectedError.message).to.equal(
        'Unable to execute the rpc request',
      );
    }
  });

  it('does not hide the error message if an error is thrown and `LogLevel` is not `OFF`', async function () {
    mockSnap();
    const createAccountSpy = sandbox.stub(createAccountApi, 'createAccount');
    const keyPairSpy = sandbox.stub(keyPairUtils, 'getAddressKeyDeriver');

    createAccountSpy.rejects(new Error('Custom Error'));
    keyPairSpy.resolvesThis();

    let expectedError;

    try {
      await onRpcRequest({
        origin: 'http://localhost:3000',
        request: {
          method: 'starkNet_createAccount',
          params: {
            debugLevel: 'DEBUG',
          },
          jsonrpc: '2.0',
          id: 1,
        },
      });
    } catch (error) {
      expectedError = error;
    } finally {
      expect(expectedError).to.be.instanceOf(SnapError);
      expect(expectedError.message).to.equal('Custom Error');
    }
  });
});

describe('onHomePage', function () {
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
    const getKeysFromAddressIndexSpy = sandbox.stub(
      starknetUtils,
      'getKeysFromAddressIndex',
    );
    const getCorrectContractAddressSpy = sandbox.stub(
      starknetUtils,
      'getCorrectContractAddress',
    );
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

  it('throws `Unable to initialize Snap HomePage` error when state not found', async function () {
    let error;
    try {
      await onHomePage();
    } catch (err) {
      error = err;
    } finally {
      expect(error).to.be.instanceOf(SnapError);
      expect(error.message).to.equal('Unable to initialize Snap HomePage');
    }
  });
});
