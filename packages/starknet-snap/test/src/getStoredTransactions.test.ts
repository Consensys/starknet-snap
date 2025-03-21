import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { SnapState, VoyagerTransactionType } from '../../src/types/snapState';
import {
  STARKNET_MAINNET_NETWORK,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from '../../src/utils/constants';
import { getStoredTransactions } from '../../src/getStoredTransactions';
import {
  createAccountProxyTxn,
  initAccountTxn,
  invalidNetwork,
  txn1,
  txn2,
  txn3,
} from '../constants.test';
import * as snapUtils from '../../src/utils/snapUtils';
import { Mutex } from 'async-mutex';
import {
  ApiParams,
  GetStoredTransactionsRequestParams,
} from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: getStoredTransactions', function () {
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [
      STARKNET_MAINNET_NETWORK,
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      invalidNetwork,
    ],
    transactions: [txn1, txn2, txn3, createAccountProxyTxn, initAccountTxn],
  };
  const apiParams: ApiParams = {
    state,
    requestParams: {},
    wallet: walletStub,
    saveMutex: new Mutex(),
  };

  beforeEach(function () {
    sandbox.useFakeTimers(1653553083147);
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should get the stored transactions of SN_SEPOLIA correctly', async function () {
    const requestObject: GetStoredTransactionsRequestParams = {
      chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
    };
    apiParams.requestParams = requestObject;
    const result = await getStoredTransactions(apiParams);

    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
    expect(result.length).to.be.eq(3);
    expect(result).to.be.eql([txn3, createAccountProxyTxn, initAccountTxn]);
  });

  it('should get the stored transactions of mainnet correctly', async function () {
    const requestObject: GetStoredTransactionsRequestParams = {};
    apiParams.requestParams = requestObject;
    const result = await getStoredTransactions(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
    expect(result.length).to.be.eq(2);
    expect(result).to.be.eql([txn1, txn2]);
  });

  it('should get the stored transactions of mainnet from a specific sender correctly', async function () {
    const requestObject: GetStoredTransactionsRequestParams = {
      chainId: STARKNET_MAINNET_NETWORK.chainId,
      senderAddress:
        '0x6f60fca373d9e1e8ea878e5d5add68ef7cb52b5d1f0a8e825e72fcf9811e139',
    };
    apiParams.requestParams = requestObject;
    const result = await getStoredTransactions(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
    expect(result.length).to.be.eq(1);
    expect(result).to.be.eql([txn1]);
  });

  it('should get the stored transactions of mainnet from another specific sender correctly', async function () {
    const requestObject: GetStoredTransactionsRequestParams = {
      chainId: STARKNET_MAINNET_NETWORK.chainId,
      senderAddress:
        '0x7ec3edbb88ce9d4d1ed62ccee34cf46a405bd15be0409ac9a23ffc1f36e190c',
    };
    apiParams.requestParams = requestObject;
    const result = await getStoredTransactions(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
    expect(result.length).to.be.eq(1);
    expect(result).to.be.eql([txn2]);
  });

  it('should get the stored transactions of mainnet of a specific contract correctly', async function () {
    const requestObject: GetStoredTransactionsRequestParams = {
      chainId: STARKNET_MAINNET_NETWORK.chainId,
      contractAddress:
        '0x06a09ccb1caaecf3d9683efe335a667b2169a409d19c589ba1eb771cd210af75',
    };
    apiParams.requestParams = requestObject;
    const result = await getStoredTransactions(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
    expect(result.length).to.be.eq(2);
    expect(result).to.be.eql([txn1, txn2]);
  });

  it('should get the stored transactions of mainnet of a specific contract and time range correctly', async function () {
    const requestObject: GetStoredTransactionsRequestParams = {
      chainId: STARKNET_MAINNET_NETWORK.chainId,
      contractAddress:
        '0x06a09ccb1caaecf3d9683efe335a667b2169a409d19c589ba1eb771cd210af75',
      txnsInLastNumOfDays: 2,
    };
    apiParams.requestParams = requestObject;
    const result = await getStoredTransactions(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
    expect(result.length).to.be.eq(1);
    expect(result).to.be.eql([txn1]);
  });

  it('should get the stored transactions of mainnet of a specific contract, sender address, and time range correctly', async function () {
    const requestObject: GetStoredTransactionsRequestParams = {
      chainId: STARKNET_MAINNET_NETWORK.chainId,
      contractAddress:
        '0x06a09ccb1caaecf3d9683efe335a667b2169a409d19c589ba1eb771cd210af75',
      senderAddress:
        '0x6f60fca373d9e1e8ea878e5d5add68ef7cb52b5d1f0a8e825e72fcf9811e139',
      txnsInLastNumOfDays: 2,
    };
    apiParams.requestParams = requestObject;
    const result = await getStoredTransactions(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
    expect(result.length).to.be.eq(1);
    expect(result).to.be.eql([txn1]);
  });

  it('should not get any stored transactions of SN_SEPOLIA of an unfound sender address correctly', async function () {
    const requestObject: GetStoredTransactionsRequestParams = {
      chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
      contractAddress:
        '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
      senderAddress:
        '0x7ec3edbb88ce9d4d1ed62ccee34cf46a405bd15be0409ac9a23ffc1f36e190c',
      txnsInLastNumOfDays: 2,
    };
    apiParams.requestParams = requestObject;
    const result = await getStoredTransactions(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
    expect(result.length).to.be.eq(0);
  });

  it('should get the stored DEPLOY transactions of SN_SEPOLIA correctly', async function () {
    const requestObject: GetStoredTransactionsRequestParams = {
      chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
      txnType: VoyagerTransactionType.DEPLOY,
    };
    apiParams.requestParams = requestObject;
    const result = await getStoredTransactions(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
    expect(result.length).to.be.eq(1);
    expect(result).to.be.eql([createAccountProxyTxn]);
  });

  it('should get the stored INVOKE transactions of SN_SEPOLIA correctly', async function () {
    const requestObject: GetStoredTransactionsRequestParams = {
      chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
      txnType: VoyagerTransactionType.INVOKE,
    };
    apiParams.requestParams = requestObject;
    const result = await getStoredTransactions(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
    expect(result.length).to.be.eq(2);
    expect(result).to.be.eql([txn3, initAccountTxn]);
  });

  it('should throw error if getTransactions failed', async function () {
    sandbox.stub(snapUtils, 'getTransactions').throws(new Error());
    const requestObject: GetStoredTransactionsRequestParams = {
      chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
      txnType: VoyagerTransactionType.INVOKE,
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await getStoredTransactions(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
  });
});
