import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import * as utils from '../../src/utils/starknetUtils';
import { executeTxn } from '../../src/executeTxn';
import { SnapState } from '../../src/types/snapState';
import {
  STARKNET_MAINNET_NETWORK,
  STARKNET_TESTNET_NETWORK,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from '../../src/utils/constants';
import { createAccountProxyTxn, getBip44EntropyStub, account1 } from '../constants.test';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import { Mutex } from 'async-mutex';
import { ApiParams, ExecuteTxnRequestParams } from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: executeTxn', function () {
  this.timeout(10000);
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_MAINNET_NETWORK, STARKNET_TESTNET_NETWORK, STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };
  const apiParams: ApiParams = {
    state,
    requestParams: {},
    wallet: walletStub,
    saveMutex: new Mutex(),
  };

  const requestObject: ExecuteTxnRequestParams = {
    chainId: STARKNET_MAINNET_NETWORK.chainId,
    senderAddress: account1.address,
    txnInvocation: {
      entrypoint: 'transfer',
      calldata: ['0', '0', '0'],
      contractAddress: createAccountProxyTxn.contractAddress,
    },
    invocationsDetails: {
      maxFee: 100,
    },
  };

  beforeEach(async function () {
    walletStub.rpcStubs.snap_getBip44Entropy.callsFake(getBip44EntropyStub);
    apiParams.keyDeriver = await getAddressKeyDeriver(walletStub);
    apiParams.requestParams = requestObject;
    sandbox.useFakeTimers(createAccountProxyTxn.timestamp);
    walletStub.rpcStubs.snap_dialog.resolves(true);
    walletStub.rpcStubs.snap_manageState.resolves(state);
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
    apiParams.requestParams = requestObject;
  });

  it('should executeTxn correctly', async function () {
    const stub = sandbox.stub(utils, 'executeTxn').resolves({
      transaction_hash: 'transaction_hash',
    });
    const result = await executeTxn(apiParams);
    const { privateKey } = await utils.getKeysFromAddress(
      apiParams.keyDeriver,
      STARKNET_MAINNET_NETWORK,
      state,
      account1.address,
    );

    expect(result).to.eql({
      transaction_hash: 'transaction_hash',
    });
    expect(stub).to.have.been.calledOnce;
    expect(stub).to.have.been.calledWith(
      STARKNET_MAINNET_NETWORK,
      account1.address,
      privateKey,
      {
        entrypoint: 'transfer',
        calldata: ['0', '0', '0'],
        contractAddress: createAccountProxyTxn.contractAddress,
      },
      undefined,
      { maxFee: 100 },
    );
  });

  it('should executeTxn multiple', async function () {
    const stub = sandbox.stub(utils, 'executeTxn').resolves({
      transaction_hash: 'transaction_hash',
    });
    apiParams.requestParams = {
      chainId: STARKNET_MAINNET_NETWORK.chainId,
      senderAddress: account1.address,
      txnInvocation: [
        {
          entrypoint: 'transfer',
          calldata: ['0', '0', '0'],
          contractAddress: createAccountProxyTxn.contractAddress,
        },
        {
          entrypoint: 'transfer2',
          calldata: ['0', '0', '0'],
          contractAddress: createAccountProxyTxn.contractAddress,
        },
      ],
      invocationsDetails: {
        maxFee: 100,
      },
    };
    const result = await executeTxn(apiParams);
    const { privateKey } = await utils.getKeysFromAddress(
      apiParams.keyDeriver,
      STARKNET_MAINNET_NETWORK,
      state,
      account1.address,
    );

    expect(result).to.eql({
      transaction_hash: 'transaction_hash',
    });
    expect(stub).to.have.been.calledOnce;
    expect(stub).to.have.been.calledWith(
      STARKNET_MAINNET_NETWORK,
      account1.address,
      privateKey,
      [
        {
          entrypoint: 'transfer',
          calldata: ['0', '0', '0'],
          contractAddress: createAccountProxyTxn.contractAddress,
        },
        {
          entrypoint: 'transfer2',
          calldata: ['0', '0', '0'],
          contractAddress: createAccountProxyTxn.contractAddress,
        },
      ],
      undefined,
      { maxFee: 100 },
    );
  });

  it('should throw error if executeTxn fail', async function () {
    const stub = sandbox.stub(utils, 'executeTxn').rejects('error');
    const { privateKey } = await utils.getKeysFromAddress(
      apiParams.keyDeriver,
      STARKNET_MAINNET_NETWORK,
      state,
      account1.address,
    );
    let result;
    try {
      await executeTxn(apiParams);
    } catch (e) {
      result = e;
    } finally {
      expect(result).to.be.an('Error');
      expect(stub).to.have.been.calledOnce;
      expect(stub).to.have.been.calledWith(
        STARKNET_MAINNET_NETWORK,
        account1.address,
        privateKey,
        {
          entrypoint: 'transfer',
          calldata: ['0', '0', '0'],
          contractAddress: createAccountProxyTxn.contractAddress,
        },
        undefined,
        { maxFee: 100 },
      );
    }
  });

  it('should return false if user rejected to sign the transaction', async function () {
    walletStub.rpcStubs.snap_dialog.resolves(false);
    const stub = sandbox.stub(utils, 'executeTxn').resolves({
      transaction_hash: 'transaction_hash',
    });
    const result = await executeTxn(apiParams);
    expect(result).to.equal(false);
    expect(stub).to.have.been.not.called;
  });
});
