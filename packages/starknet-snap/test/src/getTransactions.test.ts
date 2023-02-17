import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import * as utils from '../../src/utils/starknetUtils';
import * as snapUtils from '../../src/utils/snapUtils';
import { SnapState } from '../../src/types/snapState';
import { STARKNET_TESTNET_NETWORK, STARKNET_MAINNET_NETWORK } from '../../src/utils/constants';
import {
  createAccountProxyTxn,
  expectedMassagedTxn4,
  expectedMassagedTxn5,
  expectedMassagedTxns,
  getTxnFromSequencerResp1,
  getTxnFromSequencerResp2,
  getTxnsFromVoyagerResp,
  initAccountTxn,
  txn1,
  txn2,
  txn3,
  txn4,
  txn5,
} from '../constants.test';
import { getTransactions } from '../../src/getTransactions';
import { Mutex } from 'async-mutex';
import { ApiParams, GetTransactionsRequestParams } from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: getTransactions', function () {
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_TESTNET_NETWORK, STARKNET_MAINNET_NETWORK],
    transactions: [txn1, txn2, txn3, txn4, txn5, createAccountProxyTxn, initAccountTxn],
  };
  const apiParams: ApiParams = {
    state,
    requestParams: {},
    wallet: walletStub,
    saveMutex: new Mutex(),
  };

  beforeEach(function () {
    sandbox.useFakeTimers(1653553083147);
    sandbox.stub(utils, 'getTransactionsFromVoyager').callsFake(async () => {
      return getTxnsFromVoyagerResp;
    });
    sandbox.stub(utils, 'getTransactionFromSequencer').callsFake(async (...args) => {
      if (args?.[0] === getTxnsFromVoyagerResp.items[0].hash) {
        return getTxnFromSequencerResp1;
      } else if (args?.[0] === getTxnsFromVoyagerResp.items[1].hash) {
        return getTxnFromSequencerResp2;
      } else {
        return null;
      }
    });
    sandbox.stub(utils, 'getTransactionStatus').callsFake(async (...args) => {
      if (args?.[0] === expectedMassagedTxn5.txnHash) {
        return undefined;
      }
      return 'ACCEPTED_ON_L2';
    });
    walletStub.rpcStubs.snap_manageState.resolves(state);
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should get the transactions from Voyager of testnet correctly', async function () {
    const requestObject: GetTransactionsRequestParams = {
      senderAddress: '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
      pageSize: '10',
    };
    apiParams.requestParams = requestObject;
    const result = await getTransactions(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).to.have.been.called;
    expect(result.length).to.be.eq(4);
    expect(result).to.be.eql(expectedMassagedTxns);
  });

  it('should get the transactions of testnet stored in snap state correctly', async function () {
    const requestObject: GetTransactionsRequestParams = {
      senderAddress: '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
      pageSize: '10',
      onlyFromState: true,
    };
    apiParams.requestParams = requestObject;
    const result = await getTransactions(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).to.have.been.called;
    expect(result.length).to.be.eq(2);
    expect(result).to.be.eql([expectedMassagedTxn5, expectedMassagedTxn4]);
  });

  it('should get the transactions with deploy txn from Voyager of testnet correctly', async function () {
    const requestObject: GetTransactionsRequestParams = {
      senderAddress: '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
      pageSize: '10',
      withDeployTxn: true,
    };
    apiParams.requestParams = requestObject;
    const result = await getTransactions(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).to.have.been.called;
    expect(result.length).to.be.eq(4);
    expect(result).to.be.eql(expectedMassagedTxns);
  });

  it('should throw error if upsertTransactions failed', async function () {
    sandbox.stub(snapUtils, 'upsertTransactions').throws(new Error());
    const requestObject: GetTransactionsRequestParams = {
      senderAddress: '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
      pageSize: '10',
      withDeployTxn: true,
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await getTransactions(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw an error if the sender address is an invalid address', async function () {
    const requestObject: GetTransactionsRequestParams = {
      senderAddress: 'wrongAddress',
      pageSize: '10',
      withDeployTxn: true,
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await getTransactions(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw an error if the contract address is an invalid address', async function () {
    const requestObject: GetTransactionsRequestParams = {
      senderAddress: '0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2',
      pageSize: '10',
      withDeployTxn: true,
      contractAddress: 'wrongAddress',
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await getTransactions(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });
});
