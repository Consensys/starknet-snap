import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { SnapState } from '../../src/types/snapState';
import * as snapUtils from '../../src/utils/snapUtils';
import { STARKNET_MAINNET_NETWORK, STARKNET_TESTNET_NETWORK } from '../../src/utils/constants';
import { addNetwork } from '../../src/addNetwork';
import { Mutex } from 'async-mutex';
import { AddNetworkRequestParams, ApiParams } from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: addNetwork', function () {
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_TESTNET_NETWORK, STARKNET_MAINNET_NETWORK],
    transactions: [],
  };
  const apiParams: ApiParams = {
    state,
    requestParams: {},
    wallet: walletStub,
    saveMutex: new Mutex(),
  };

  beforeEach(function () {
    walletStub.rpcStubs.snap_manageState.resolves(state);
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should add the network correctly (should throw error as temporarily disabled)', async function () {
    const requestObject: AddNetworkRequestParams = {
      networkName: 'StarkNet Unit Testnet',
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: 'https://alpha-unit-testnet.starknet.io',
      networkNodeUrl: '',
    };
    apiParams.requestParams = requestObject;
    try {
      await addNetwork(apiParams);
      return;
    } catch (err) {
      expect(err).to.be.an('Error');
      expect(err.message).to.be.eql('addNetwork is currently disabled');
    }
  });

  it('should update the network correctly (should throw error as temporarily disabled)', async function () {
    const requestObject: AddNetworkRequestParams = {
      networkName: 'StarkNet Unit Testnet 2',
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: 'https://alpha-unit-testnet-2.starknet.io',
      networkNodeUrl: '',
    };
    apiParams.requestParams = requestObject;
    try {
      await addNetwork(apiParams);
    } catch (err) {
      expect(err).to.be.an('Error');
      expect(err.message).to.be.eql('addNetwork is currently disabled');
    }
  });

  it('should not update snap state with the duplicated network (should throw error as temporarily disabled)', async function () {
    const requestObject: AddNetworkRequestParams = {
      networkName: 'StarkNet Unit Testnet 2',
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: 'https://alpha-unit-testnet-2.starknet.io',
      networkNodeUrl: '',
    };
    apiParams.requestParams = requestObject;
    try {
      await addNetwork(apiParams);
    } catch (err) {
      expect(err).to.be.an('Error');
      expect(err.message).to.be.eql('addNetwork is currently disabled');
    }
  });

  it('should throw error if upsertNetwork failed', async function () {
    sandbox.stub(snapUtils, 'upsertNetwork').throws(new Error());
    const requestObject: AddNetworkRequestParams = {
      networkName: 'StarkNet Unit Testnet 2',
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: 'https://alpha-unit-testnet-2.starknet.io',
      networkNodeUrl: '',
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await addNetwork(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw an error if the network name is undefined', async function () {
    const requestObject: AddNetworkRequestParams = {
      networkName: undefined,
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: 'https://alpha-unit-testnet-2.starknet.io',
      networkNodeUrl: '',
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await addNetwork(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw an error if the network chain id is undefined', async function () {
    const requestObject: AddNetworkRequestParams = {
      networkName: 'StarkNet Unit Testnet 2',
      networkChainId: undefined,
      networkBaseUrl: 'https://alpha-unit-testnet-2.starknet.io',
      networkNodeUrl: '',
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await addNetwork(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw an error if both the network base url and node url are empty string', async function () {
    const requestObject: AddNetworkRequestParams = {
      networkName: 'StarkNet Unit Testnet 2',
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: '',
      networkNodeUrl: '',
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await addNetwork(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw an error if the network name is not in ASCII chars', async function () {
    const requestObject: AddNetworkRequestParams = {
      networkName: 'аррӏе testnet',
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: 'https://alpha-unit-testnet-2.starknet.io',
      networkNodeUrl: '',
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await addNetwork(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw an error if the network name is longer than 64 chars', async function () {
    const requestObject: AddNetworkRequestParams = {
      networkName: 'StarkNet Unit Testnet xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: 'https://alpha-unit-testnet-2.starknet.io',
      networkNodeUrl: '',
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await addNetwork(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw an error if the network name is in all spaces', async function () {
    const requestObject: AddNetworkRequestParams = {
      networkName: '        ',
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: 'https://alpha-unit-testnet-2.starknet.io',
      networkNodeUrl: '',
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await addNetwork(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw an error if the network chainId is not in hex string', async function () {
    const requestObject: AddNetworkRequestParams = {
      networkName: 'StarkNet Unit Testnet',
      networkChainId: '534e5f474f777',
      networkBaseUrl: 'https://alpha-unit-testnet-2.starknet.io',
      networkNodeUrl: '',
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await addNetwork(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw an error if the network base URL is not valid', async function () {
    const requestObject: AddNetworkRequestParams = {
      networkName: 'StarkNet Unit Testnet',
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: 'wss://alpha-unit-testnet-2.starknet.io',
      networkNodeUrl: '',
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await addNetwork(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw an error if the network node URL is not valid', async function () {
    const requestObject: AddNetworkRequestParams = {
      networkName: 'StarkNet Unit Testnet',
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: '',
      networkNodeUrl: 'wss://alpha-unit-testnet-2.starknet.io',
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await addNetwork(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw an error if the network Voyager URL is not valid', async function () {
    const requestObject: AddNetworkRequestParams = {
      networkName: 'StarkNet Unit Testnet',
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: '',
      networkNodeUrl: 'http://alpha-unit-testnet-2.starknet.io',
      networkVoyagerUrl: 'wss://test.com',
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await addNetwork(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw an error if the network account class hash is not valid', async function () {
    const requestObject: AddNetworkRequestParams = {
      networkName: 'StarkNet Unit Testnet',
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: '',
      networkNodeUrl: 'http://alpha-unit-testnet-2.starknet.io',
      accountClassHash: '0x811111111111111111111111111111111111111111111111111111111111111',
      // a valid StarkNet hash is essentially a cario felt, which is a 251 bit positive number
      // which means it can only be 63 hex character long with the leading char being [1-7]
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await addNetwork(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw an error if the network chainId is one of the preloaded network chainId', async function () {
    const requestObject: AddNetworkRequestParams = {
      networkName: 'StarkNet Unit Testnet',
      networkChainId: '0x534e5f474f45524c49',
      networkBaseUrl: 'http://alpha-unit-testnet-2.starknet.io',
      networkNodeUrl: '',
      accountClassHash: '0x3e327de1c40540b98d05cbcb13552008e36f0ec8d61d46956d2f9752c294328',
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await addNetwork(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw an error if the network name is one of the preloaded network name', async function () {
    const requestObject: AddNetworkRequestParams = {
      networkName: 'Goerli Testnet',
      networkChainId: '0x12345678',
      networkBaseUrl: 'http://alpha-unit-testnet-2.starknet.io',
      networkNodeUrl: '',
      accountClassHash: '0x3e327de1c40540b98d05cbcb13552008e36f0ec8d61d46956d2f9752c294328',
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await addNetwork(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });
});
