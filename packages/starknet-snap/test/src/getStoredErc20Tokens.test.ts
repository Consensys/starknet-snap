import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { SnapState } from '../../src/types/snapState';
import { getStoredErc20Tokens } from '../../src/getStoredErc20Tokens';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../src/utils/constants';
import { token1, token2 } from '../constants.test';
import * as snapUtils from '../../src/utils/snapUtils';
import { Mutex } from 'async-mutex';
import {
  ApiParams,
  GetStoredErc20TokensRequestParams,
} from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: getStoredErc20Tokens', function () {
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [token1, token2],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
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

  it('should get the stored ERC-20 tokens correctly', async function () {
    const requestObject: GetStoredErc20TokensRequestParams = {
      chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
    };
    apiParams.requestParams = requestObject;
    const result = await getStoredErc20Tokens(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
    expect(result.length).to.be.eq(2);
    expect(result).to.be.eql(state.erc20Tokens);
  });

  it('should throw error if getErc20Tokens failed', async function () {
    sandbox.stub(snapUtils, 'getErc20Tokens').throws(new Error());
    const requestObject: GetStoredErc20TokensRequestParams = {
      chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await getStoredErc20Tokens(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
  });
});
