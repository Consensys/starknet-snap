import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import * as utils from '../../src/utils/starknetUtils';
import * as snapUtils from '../../src/utils/snapUtils';
import { SnapState } from '../../src/types/snapState';
import { STARKNET_MAINNET_NETWORK, STARKNET_TESTNET_NETWORK } from '../../src/utils/constants';
import {
  createAccountProxyTxn,
  testnetAccAddresses,
  testnetPublicKeys,
  mainnetPublicKeys,
  mainnetAccAddresses,
  invalidNetwork as INVALID_NETWORK,
  getBip44EntropyStub,
} from '../constants.test';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import { recoverAccounts } from '../../src/recoverAccounts';
import { constants, number } from 'starknet';
import { Mutex } from 'async-mutex';
import { ApiParams, RecoverAccountsRequestParams } from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: recoverAccounts', function () {
  this.timeout(5000);
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_TESTNET_NETWORK, STARKNET_MAINNET_NETWORK, INVALID_NETWORK],
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
    sandbox.useFakeTimers(createAccountProxyTxn.timestamp);
    walletStub.rpcStubs.snap_manageState.resolves(state);
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should recover accounts in mainnet correctly', async function () {
    state.accContracts = [];
    const maxScanned = 5;
    const maxMissed = 3;
    const validPublicKeys = 2;
    const getSignerStub = sandbox.stub(utils, 'getSigner');
    for (let i = 0; i < validPublicKeys; i++) {
      getSignerStub.onCall(i).resolves(mainnetPublicKeys[i]);
    }
    getSignerStub.onCall(validPublicKeys).resolves(number.toHex(constants.ZERO));
    getSignerStub.resolves(number.toHex(constants.ZERO));

    const requestObject: RecoverAccountsRequestParams = {
      startScanIndex: 0,
      maxScanned,
      maxMissed,
      chainId: STARKNET_MAINNET_NETWORK.chainId,
    };
    apiParams.requestParams = requestObject;

    const result = await recoverAccounts(apiParams);
    const expectedCalledTimes = validPublicKeys + maxMissed;
    expect(walletStub.rpcStubs.snap_manageState.callCount).to.be.eq(expectedCalledTimes * 2);
    expect(result.length).to.be.eq(expectedCalledTimes);
    expect(state.accContracts.map((acc) => acc.address)).to.be.eql(mainnetAccAddresses.slice(0, expectedCalledTimes));
    expect(state.accContracts.map((acc) => acc.addressSalt)).to.be.eql(mainnetPublicKeys.slice(0, expectedCalledTimes));
    expect(
      state.accContracts
        .filter((acc) => acc.publicKey && acc.publicKey !== number.toHex(constants.ZERO))
        .map((acc) => acc.publicKey),
    ).to.be.eql(mainnetPublicKeys.slice(0, validPublicKeys));
    expect(state.accContracts.length).to.be.eq(expectedCalledTimes);
  });

  it('should recover accounts in testnet correctly', async function () {
    state.accContracts = [];
    const maxScanned = 5;
    const maxMissed = 3;
    const validPublicKeys = 2;
    const getSignerStub = sandbox.stub(utils, 'getSigner');
    for (let i = 0; i < validPublicKeys; i++) {
      getSignerStub.onCall(i).resolves(testnetPublicKeys[i]);
    }
    getSignerStub.throws(new Error());

    const requestObject: RecoverAccountsRequestParams = {
      startScanIndex: 0,
      maxScanned,
      maxMissed,
    };

    apiParams.requestParams = requestObject;
    const result = await recoverAccounts(apiParams);
    const expectedCalledTimes = validPublicKeys + maxMissed;
    expect(walletStub.rpcStubs.snap_manageState.callCount).to.be.eq(expectedCalledTimes * 2);
    expect(result.length).to.be.eq(expectedCalledTimes);
    expect(state.accContracts.map((acc) => acc.address)).to.be.eql(testnetAccAddresses.slice(0, expectedCalledTimes));
    expect(state.accContracts.map((acc) => acc.addressSalt)).to.be.eql(testnetPublicKeys.slice(0, expectedCalledTimes));
    expect(
      state.accContracts
        .filter((acc) => acc.publicKey && acc.publicKey !== number.toHex(constants.ZERO))
        .map((acc) => acc.publicKey),
    ).to.be.eql(testnetPublicKeys.slice(0, validPublicKeys));
    expect(state.accContracts.length).to.be.eq(expectedCalledTimes);
  });

  it('should recover accounts in testnet with same parameters correctly', async function () {
    const maxScanned = 5;
    const maxMissed = 3;
    const validPublicKeys = 2;
    const getSignerStub = sandbox.stub(utils, 'getSigner');
    for (let i = 0; i < validPublicKeys; i++) {
      getSignerStub.onCall(i).resolves(testnetPublicKeys[i]);
    }
    getSignerStub.throws(new Error());

    const requestObject: RecoverAccountsRequestParams = {
      startScanIndex: 0,
      maxScanned,
      maxMissed,
    };

    apiParams.requestParams = requestObject;
    const result = await recoverAccounts(apiParams);
    const expectedCalledTimes = validPublicKeys + maxMissed;
    expect(walletStub.rpcStubs.snap_manageState.callCount).to.be.eq(expectedCalledTimes);
    expect(result.length).to.be.eq(expectedCalledTimes);
    expect(state.accContracts.map((acc) => acc.address)).to.be.eql(testnetAccAddresses.slice(0, expectedCalledTimes));
    expect(state.accContracts.map((acc) => acc.addressSalt)).to.be.eql(testnetPublicKeys.slice(0, expectedCalledTimes));
    expect(
      state.accContracts
        .filter((acc) => acc.publicKey && acc.publicKey !== number.toHex(constants.ZERO))
        .map((acc) => acc.publicKey),
    ).to.be.eql(testnetPublicKeys.slice(0, validPublicKeys));
    expect(state.accContracts.length).to.be.eq(expectedCalledTimes);
  });

  it('should throw error if upsertAccount failed', async function () {
    sandbox.stub(snapUtils, 'upsertAccount').throws(new Error());
    const maxScanned = 5;
    const maxMissed = 3;
    const validPublicKeys = 2;
    const getSignerStub = sandbox.stub(utils, 'getSigner');
    for (let i = 0; i < validPublicKeys; i++) {
      getSignerStub.onCall(i).resolves(mainnetPublicKeys[i]);
    }
    getSignerStub.onCall(validPublicKeys).resolves(number.toHex(constants.ZERO));
    getSignerStub.resolves(number.toHex(constants.ZERO));

    const requestObject: RecoverAccountsRequestParams = {
      startScanIndex: 0,
      maxScanned,
      maxMissed,
      chainId: STARKNET_MAINNET_NETWORK.chainId,
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await recoverAccounts(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should show confirmation box with failure msg if network accountClassHash is missing', async function () {
    const maxScanned = 5;
    const maxMissed = 3;
    const validPublicKeys = 2;
    const getSignerStub = sandbox.stub(utils, 'getSigner');
    for (let i = 0; i < validPublicKeys; i++) {
      getSignerStub.onCall(i).resolves(testnetPublicKeys[i]);
    }
    getSignerStub.throws(new Error());

    const requestObject: RecoverAccountsRequestParams = {
      startScanIndex: 0,
      maxScanned,
      maxMissed,
      chainId: INVALID_NETWORK.chainId,
    };
    apiParams.requestParams = requestObject;
    const result = await recoverAccounts(apiParams);
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
    expect(result).eql(null);
  });
});
