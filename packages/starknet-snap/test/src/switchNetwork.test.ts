import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { SnapState } from '../../src/types/snapState';
import * as snapUtils from '../../src/utils/snapUtils';
import { STARKNET_MAINNET_NETWORK, STARKNET_TESTNET_NETWORK, STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../src/utils/constants';
import { Mutex } from 'async-mutex';
import { SwitchNetworkRequestParams, ApiParams } from '../../src/types/snapApi';
import { switchNetwork } from '../../src/switchNetwork';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: switchNetwork', function () {
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_TESTNET_NETWORK, STARKNET_MAINNET_NETWORK, STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
    currentNetwork: STARKNET_TESTNET_NETWORK,
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

  it('should switch the network correctly', async function () {
    const requestObject: SwitchNetworkRequestParams = {
      chainId: STARKNET_MAINNET_NETWORK.chainId,
      enableAutherize: true,
    };
    apiParams.requestParams = requestObject;
    const result = await switchNetwork(apiParams);
    expect(result).to.be.eql(true);
    expect(stateStub).to.be.calledOnce;
    expect(dialogStub).to.be.calledOnce;
    expect(state.currentNetwork).to.be.eql(STARKNET_MAINNET_NETWORK);
    expect(state.networks.length).to.be.eql(3);
  });

  it('should skip autherize when enableAutherize is false or omit', async function () {
    const requestObject: SwitchNetworkRequestParams = {
      chainId: STARKNET_MAINNET_NETWORK.chainId,
    };
    apiParams.requestParams = requestObject;
    const result = await switchNetwork(apiParams);
    expect(result).to.be.eql(true);
    expect(stateStub).to.be.calledOnce;
    expect(dialogStub).to.be.callCount(0);
    expect(state.currentNetwork).to.be.eql(STARKNET_MAINNET_NETWORK);
    expect(state.networks.length).to.be.eql(3);
  });

  it('should throw an error if network not found', async function () {
    const requestObject: SwitchNetworkRequestParams = {
      chainId: '123',
      enableAutherize: true,
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      await switchNetwork(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
      expect(stateStub).to.be.callCount(0);
      expect(dialogStub).to.be.callCount(0);
      expect(state.currentNetwork).to.be.eql(STARKNET_MAINNET_NETWORK);
    }
  });

  it('should throw an error if setCurrentNetwork failed', async function () {
    sandbox.stub(snapUtils, 'setCurrentNetwork').throws(new Error());
    const requestObject: SwitchNetworkRequestParams = {
      chainId: STARKNET_TESTNET_NETWORK.chainId,
      enableAutherize: true,
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      await switchNetwork(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
      expect(dialogStub).to.be.callCount(1);
      expect(state.currentNetwork).to.be.eql(STARKNET_MAINNET_NETWORK);
    }
  });
});
