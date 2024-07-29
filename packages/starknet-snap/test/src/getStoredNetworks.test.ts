import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { SnapState } from '../../src/types/snapState';
import {
  STARKNET_MAINNET_NETWORK,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from '../../src/utils/constants';
import { getStoredNetworks } from '../../src/getStoredNetworks';
import * as snapUtils from '../../src/utils/snapUtils';
import { Mutex } from 'async-mutex';
import {
  ApiParams,
  GetStoredNetworksRequestParams,
} from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: getStoredNetworks', function () {
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK, STARKNET_MAINNET_NETWORK],
    transactions: [],
  };
  const apiParams: ApiParams = {
    state,
    requestParams: {},
    wallet: walletStub,
    saveMutex: new Mutex(),
  };

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should get the stored networks correctly', async function () {
    const requestObject: GetStoredNetworksRequestParams = {};
    apiParams.requestParams = requestObject;
    const result = await getStoredNetworks(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
    expect(result.length).to.be.eq(2);
    expect(result).to.be.eql(state.networks);
  });

  it('should throw error if getNetworks failed', async function () {
    sandbox.stub(snapUtils, 'getNetworks').throws(new Error());
    const requestObject: GetStoredNetworksRequestParams = {};
    apiParams.requestParams = requestObject;

    let result;
    try {
      await getStoredNetworks(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
  });
});
