import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { SnapState } from '../../src/types/snapState';
import * as snapUtils from '../../src/utils/snapUtils';
import {
  STARKNET_MAINNET_NETWORK,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from '../../src/utils/constants';
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
    networks: [STARKNET_MAINNET_NETWORK, STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };
  const apiParams: ApiParams = {
    state,
    requestParams: {},
    wallet: walletStub,
    saveMutex: new Mutex(),
  };
  let stateStub: sinon.SinonStub;
  let dialogStub: sinon.SinonStub;
  beforeEach(function () {
    stateStub = walletStub.rpcStubs.snap_manageState;
    dialogStub = walletStub.rpcStubs.snap_dialog;
    stateStub.resolves(state);
    dialogStub.resolves(true);
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should add the network correctly', async function () {
    const requestObject: AddNetworkRequestParams = {
      networkName: 'Starknet Unit SN_SEPOLIA',
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: 'https://alpha-unit-SN_SEPOLIA.starknet.io',
      networkNodeUrl: 'https://alpha-unit-SN_SEPOLIA.starknet.io',
    };
    apiParams.requestParams = requestObject;
    const result = await addNetwork(apiParams);
    expect(result).to.be.eql(true);
    expect(stateStub).to.be.calledOnce;
    expect(state.networks.length).to.be.eql(3);
  });

  it('should update the network correctly', async function () {
    const requestObject: AddNetworkRequestParams = {
      networkName: 'Starknet Unit SN_SEPOLIA 2',
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: 'https://alpha-unit-SN_SEPOLIA-2.starknet.io',
      networkNodeUrl: 'https://alpha-unit-SN_SEPOLIA.starknet.io',
    };
    apiParams.requestParams = requestObject;
    const result = await addNetwork(apiParams);
    expect(result).to.be.eql(true);
    expect(stateStub).to.be.calledOnce;
    expect(state.networks.length).to.be.eql(3);
  });

  it('should not update snap state with the duplicated network', async function () {
    const requestObject: AddNetworkRequestParams = {
      networkName: 'Starknet Unit SN_SEPOLIA 2',
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: 'https://alpha-unit-SN_SEPOLIA-2.starknet.io',
      networkNodeUrl: 'https://alpha-unit-SN_SEPOLIA.starknet.io',
    };
    apiParams.requestParams = requestObject;
    const result = await addNetwork(apiParams);
    expect(result).to.be.eql(true);
    expect(stateStub).to.be.callCount(0);
    expect(state.networks.length).to.be.eql(3);
  });

  it('should throw an error if upsertNetwork failed', async function () {
    sandbox.stub(snapUtils, 'upsertNetwork').throws(new Error());
    const requestObject: AddNetworkRequestParams = {
      networkName: 'Starknet Unit SN_SEPOLIA 2',
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: 'https://alpha-unit-SN_SEPOLIA-2.starknet.io',
      networkNodeUrl: 'https://alpha-unit-SN_SEPOLIA.starknet.io',
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

  it('should throw an error if the network name is undefined', async function () {
    const requestObject: AddNetworkRequestParams = {
      networkName: undefined as unknown as string,
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: 'https://alpha-unit-SN_SEPOLIA-2.starknet.io',
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
      networkName: 'Starknet Unit SN_SEPOLIA 2',
      networkChainId: undefined as unknown as string,
      networkBaseUrl: 'https://alpha-unit-SN_SEPOLIA-2.starknet.io',
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
      networkName: 'Starknet Unit SN_SEPOLIA 2',
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
      networkName: 'аррӏе SN_SEPOLIA',
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: 'https://alpha-unit-SN_SEPOLIA-2.starknet.io',
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
      networkName:
        'Starknet Unit SN_SEPOLIA xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: 'https://alpha-unit-SN_SEPOLIA-2.starknet.io',
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
      networkBaseUrl: 'https://alpha-unit-SN_SEPOLIA-2.starknet.io',
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
      networkName: 'Starknet Unit SN_SEPOLIA',
      networkChainId: '534e5f474f777',
      networkBaseUrl: 'https://alpha-unit-SN_SEPOLIA-2.starknet.io',
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
      networkName: 'Starknet Unit SN_SEPOLIA',
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: 'wss://alpha-unit-SN_SEPOLIA-2.starknet.io',
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
      networkName: 'Starknet Unit SN_SEPOLIA',
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: '',
      networkNodeUrl: 'wss://alpha-unit-SN_SEPOLIA-2.starknet.io',
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
      networkName: 'Starknet Unit SN_SEPOLIA',
      networkChainId: '0x534e5f474f777',
      networkBaseUrl: '',
      networkNodeUrl: 'http://alpha-unit-SN_SEPOLIA-2.starknet.io',
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

  it('should throw an error if the network chainId is one of the preloaded network chainId', async function () {
    const requestObject: AddNetworkRequestParams = {
      networkName: 'Starknet Unit SN_SEPOLIA',
      networkChainId: '0x534e5f5345504f4c4941',
      networkBaseUrl: 'http://alpha-unit-SN_SEPOLIA-2.starknet.io',
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

  it('should throw an error if the network name is one of the preloaded network name', async function () {
    const requestObject: AddNetworkRequestParams = {
      networkName: STARKNET_SEPOLIA_TESTNET_NETWORK.name,
      networkChainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
      networkBaseUrl: STARKNET_SEPOLIA_TESTNET_NETWORK.baseUrl,
      networkNodeUrl: STARKNET_SEPOLIA_TESTNET_NETWORK.nodeUrl,
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
