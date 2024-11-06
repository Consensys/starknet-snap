import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import * as utils from '../../src/utils/starknetUtils';
import * as snapUtils from '../../src/utils/snapUtils';
import { SnapState, Transaction } from '../../src/types/snapState';
import {
  STARKNET_SEPOLIA_TESTNET_NETWORK,
  STARKNET_MAINNET_NETWORK,
} from '../../src/utils/constants';
import {
  createAccountProxyTxn,
  expectedMassagedTxn4,
  expectedMassagedTxn5,
  expectedMassagedTxns,
  getTxnFromSequencerResp1,
  getTxnFromSequencerResp2,
  getTxnStatusAcceptL2Resp,
  getTxnStatusResp,
  getTxnsFromVoyagerResp,
  unsettedTransactionInMassagedTxn,
  initAccountTxn,
  txn1,
  txn2,
  txn3,
  txn4,
  txn5,
  mainnetTxn1,
} from '../constants.test';
import { getTransactions, updateStatus } from '../../src/getTransactions';
import { Mutex } from 'async-mutex';
import {
  ApiParams,
  GetTransactionsRequestParams,
} from '../../src/types/snapApi';
import { GetTransactionResponse, num } from 'starknet';
import { VoyagerTransactions } from '../../src/types/voyager';
import { TransactionStatuses } from '../../src/types/starknet';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();
describe('Test function: getTransactions', function () {
  const walletStub = new WalletMock();
  let getTransactionStatusStub: sinon.SinonStub;
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK, STARKNET_MAINNET_NETWORK],
    transactions: [
      { ...unsettedTransactionInMassagedTxn },
      { ...txn1 },
      { ...txn2 },
      { ...txn3 },
      { ...txn4 },
      { ...txn5 },
      { ...mainnetTxn1 },
      { ...createAccountProxyTxn },
      { ...initAccountTxn },
    ],
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
      return getTxnsFromVoyagerResp as unknown as VoyagerTransactions;
    });
    sandbox.stub(utils, 'getTransaction').callsFake(async (...args) => {
      if (args?.[0] === getTxnsFromVoyagerResp.items[0].hash) {
        return getTxnFromSequencerResp1 as unknown as GetTransactionResponse;
      } else if (args?.[0] === getTxnsFromVoyagerResp.items[1].hash) {
        return getTxnFromSequencerResp2 as unknown as GetTransactionResponse;
      } else {
        return null as unknown as GetTransactionResponse;
      }
    });
    getTransactionStatusStub = sandbox
      .stub(utils, 'getTransactionStatus')
      .callsFake(async (...args) => {
        if (args?.[0] === getTxnsFromVoyagerResp.items[0].hash) {
          return getTxnStatusResp as unknown as TransactionStatuses;
        } else if (args?.[0] === getTxnsFromVoyagerResp.items[1].hash) {
          return getTxnStatusResp as unknown as TransactionStatuses;
        } else if (args?.[0] === expectedMassagedTxn5.txnHash) {
          return undefined as unknown as TransactionStatuses;
        }
        return getTxnStatusAcceptL2Resp as unknown as TransactionStatuses;
      });
    walletStub.rpcStubs.snap_manageState.resolves(state);
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should get the transactions from Voyager of testnet correctly', async function () {
    const requestObject: GetTransactionsRequestParams = {
      senderAddress: txn4.senderAddress,
      pageSize: '10',
      chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
    };
    apiParams.requestParams = requestObject;

    const result = await getTransactions(apiParams);

    expect(walletStub.rpcStubs.snap_manageState).to.have.been.called;
    expect(result.length).to.be.eq(4);
    expect(result).to.be.eql(expectedMassagedTxns);
  });

  it('should merge the transactions stored in snap state correctly', async function () {
    const requestObject: GetTransactionsRequestParams = {
      senderAddress: txn4.senderAddress,
      pageSize: '10',
      chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
    };
    apiParams.requestParams = requestObject;

    const result = await getTransactions(apiParams);
    const mergeTxn = result.find(
      (e) =>
        num.toBigInt(e.txnHash) ===
        num.toBigInt(unsettedTransactionInMassagedTxn.txnHash),
    );
    expect(getTransactionStatusStub.callCount).to.be.eq(4);
    expect(walletStub.rpcStubs.snap_manageState).to.have.been.called;
    expect(mergeTxn).not.to.be.undefined;
    if (mergeTxn !== undefined) {
      expect(mergeTxn.status).to.be.eq('');
      expect(mergeTxn.finalityStatus).to.be.eq(getTxnStatusResp.finalityStatus);
      expect(mergeTxn.executionStatus).to.be.eq(
        getTxnStatusResp.executionStatus,
      );
    }
    expect(result.length).to.be.eq(4);
    expect(result).to.be.eql(expectedMassagedTxns);
  });

  it('should get the transactions of testnet stored in snap state correctly', async function () {
    const requestObject: GetTransactionsRequestParams = {
      senderAddress: txn4.senderAddress,
      pageSize: '10',
      onlyFromState: true,
      chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
    };
    apiParams.requestParams = requestObject;
    const result = await getTransactions(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).to.have.been.called;
    expect(result.length).to.be.eq(2);
    expect(result).to.be.eql([expectedMassagedTxn5, expectedMassagedTxn4]);
  });

  it('should get the transactions with deploy txn from Voyager of testnet correctly', async function () {
    const requestObject: GetTransactionsRequestParams = {
      senderAddress: txn4.senderAddress,
      pageSize: '10',
      withDeployTxn: true,
      chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
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
      senderAddress: txn4.senderAddress,
      pageSize: '10',
      withDeployTxn: true,
      chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
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
      senderAddress: txn4.senderAddress,
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

describe('Test function: getTransactions.updateStatus', function () {
  let getTransactionStatusStub: sinon.SinonStub;
  let txns: Transaction[] = [];
  beforeEach(function () {
    txns = [{ ...unsettedTransactionInMassagedTxn }];
    getTransactionStatusStub = sandbox
      .stub(utils, 'getTransactionStatus')
      .callsFake(async () => {
        return getTxnStatusAcceptL2Resp;
      });
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('should update status correctly', async function () {
    await updateStatus(txns[0], STARKNET_SEPOLIA_TESTNET_NETWORK);
    expect(getTransactionStatusStub.callCount).to.be.eq(1);
    expect(txns[0].finalityStatus).to.be.eq(
      getTxnStatusAcceptL2Resp.finalityStatus,
    );
    expect(txns[0].executionStatus).to.be.eq(
      getTxnStatusAcceptL2Resp.executionStatus,
    );
    expect(txns[0].status).to.be.eq('');
  });

  describe('when getTransactionStatus throw error', function () {
    beforeEach(function () {
      sandbox.restore();
      getTransactionStatusStub = sandbox
        .stub(utils, 'getTransactionStatus')
        .throws(new Error());
    });
    it('should not throw error', async function () {
      await updateStatus(txns[0], STARKNET_SEPOLIA_TESTNET_NETWORK);
      expect(txns[0].finalityStatus).to.be.eq(
        unsettedTransactionInMassagedTxn.finalityStatus,
      );
      expect(txns[0].executionStatus).to.be.eq(
        unsettedTransactionInMassagedTxn.executionStatus,
      );
      expect(txns[0].status).to.be.eq(unsettedTransactionInMassagedTxn.status);
    });
  });
});
