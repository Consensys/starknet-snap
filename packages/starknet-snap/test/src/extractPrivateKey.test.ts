import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { SnapState } from '../../src/types/snapState';
import { extractPrivateKey } from '../../src/extractPrivateKey';
import { STARKNET_TESTNET_NETWORK } from '../../src/utils/constants';
import { account1, getBip44EntropyStub, unfoundUserAddress } from '../constants.test';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import * as utils from '../../src/utils/starknetUtils';
import { Mutex } from 'async-mutex';
import { ApiParams, ExtractPrivateKeyRequestParams } from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: extractPrivateKey', function () {
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [account1],
    erc20Tokens: [],
    networks: [STARKNET_TESTNET_NETWORK],
    transactions: [],
  };
  const apiParams: ApiParams = {
    state,
    requestParams: {},
    wallet: walletStub,
    saveMutex: new Mutex(),
  };

  beforeEach(async function () {
    walletStub.rpcStubs.snap_getBip44Entropy.callsFake(getBip44EntropyStub);
    apiParams.keyDeriver = await getAddressKeyDeriver(walletStub);
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should get the private key of the specified user account correctly', async function () {
    walletStub.rpcStubs.snap_dialog.resolves(true);
    const requestObject: ExtractPrivateKeyRequestParams = {
      userAddress: account1.address,
    };
    apiParams.requestParams = requestObject;
    const result = await extractPrivateKey(apiParams);
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledTwice;
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
    expect(result).to.be.equal(null);
  });

  it('should get the private key of the unfound user account correctly', async function () {
    walletStub.rpcStubs.snap_dialog.resolves(true);
    const requestObject: ExtractPrivateKeyRequestParams = {
      userAddress: unfoundUserAddress,
    };
    apiParams.requestParams = requestObject;
    const result = await extractPrivateKey(apiParams);
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledTwice;
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
    expect(result).to.be.eql(null);
  });

  it('should not get the private key of the specified user account if user rejected', async function () {
    walletStub.rpcStubs.snap_dialog.resolves(false);
    const requestObject: ExtractPrivateKeyRequestParams = {
      userAddress: account1.address,
    };
    apiParams.requestParams = requestObject;
    const result = await extractPrivateKey(apiParams);
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
    expect(result).to.be.equal(null);
  });

  it('should throw error if getKeysFromAddress failed', async function () {
    sandbox.stub(utils, 'getKeysFromAddress').throws(new Error());
    walletStub.rpcStubs.snap_dialog.resolves(true);
    const requestObject: ExtractPrivateKeyRequestParams = {
      userAddress: account1.address,
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await extractPrivateKey(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw an error if the user address is undefined', async function () {
    const requestObject: ExtractPrivateKeyRequestParams = {
      userAddress: undefined,
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await extractPrivateKey(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw an error if the user address is invalid', async function () {
    const requestObject: ExtractPrivateKeyRequestParams = {
      userAddress: 'wrongAddress',
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await extractPrivateKey(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });
});
