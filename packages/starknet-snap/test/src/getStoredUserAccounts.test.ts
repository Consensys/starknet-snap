import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { SnapState } from '../../src/types/snapState';
import { getStoredUserAccounts } from '../../src/getStoredUserAccounts';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../src/utils/constants';
import { account1, account2, account3, account4 } from '../constants.test';
import * as snapUtils from '../../src/utils/snapUtils';
import { Mutex } from 'async-mutex';
import {
  ApiParams,
  GetStoredUserAccountsRequestParams,
} from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: getStoredUserAccounts', function () {
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [account1, account2, account3, account4],
    erc20Tokens: [],
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

  it('should get the stored user accounts correctly', async function () {
    const requestObject: GetStoredUserAccountsRequestParams = {
      chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
    };
    apiParams.requestParams = requestObject;
    const result = await getStoredUserAccounts(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
    expect(result.length).to.be.eq(4);
    expect(result).to.be.eql(state.accContracts);
  });

  it('should throw error if getAccounts failed', async function () {
    sandbox.stub(snapUtils, 'getAccounts').throws(new Error());
    const requestObject: GetStoredUserAccountsRequestParams = {};
    apiParams.requestParams = requestObject;

    let result;
    try {
      await getStoredUserAccounts(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
  });
});
