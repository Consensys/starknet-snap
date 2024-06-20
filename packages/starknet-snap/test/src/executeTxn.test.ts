import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import * as utils from '../../src/utils/starknetUtils';
import { executeTxn } from '../../src/executeTxn';
import { SnapState } from '../../src/types/snapState';
import { STARKNET_MAINNET_NETWORK, STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../src/utils/constants';
import {
  createAccountProxyTxn,
  estimateDeployFeeResp,
  getBip44EntropyStub,
  account1,
  estimateFeeResp,
} from '../constants.test';
import * as createAccountUtils from '../../src/createAccount';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import { Mutex } from 'async-mutex';
import { ApiParams, ExecuteTxnRequestParams } from '../../src/types/snapApi';
import { GetTransactionReceiptResponse } from 'starknet';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: executeTxn', function () {
  this.timeout(10000);
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [account1],
    erc20Tokens: [],
    networks: [STARKNET_MAINNET_NETWORK, STARKNET_SEPOLIA_TESTNET_NETWORK],
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
    sandbox.stub(utils, 'estimateFeeBulk').callsFake(async () => {
      return [estimateFeeResp];
    });
    sandbox.stub(utils, 'estimateFee').callsFake(async () => {
      return estimateFeeResp;
    });
    sandbox.stub(utils, 'estimateAccountDeployFee').callsFake(async () => {
      return estimateDeployFeeResp;
    });
    sandbox.stub(utils, 'getSigner').callsFake(async () => {
      return account1.publicKey;
    });
    sandbox.useFakeTimers(createAccountProxyTxn.timestamp);
    walletStub.rpcStubs.snap_dialog.resolves(true);
    walletStub.rpcStubs.snap_manageState.resolves(state);
    sandbox.stub(utils, 'waitForTransaction').resolves({} as unknown as GetTransactionReceiptResponse);
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
    apiParams.requestParams = requestObject;
  });

  it('should executeTxn correctly and deploy an account', async function () {
    sandbox.stub(utils, 'isAccountDeployed').resolves(false);
    const createAccountStub = sandbox.stub(createAccountUtils, 'createAccount').resolvesThis();
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
    expect(stub).to.have.been.calledOnceWith(
      STARKNET_MAINNET_NETWORK,
      account1.address,
      privateKey,
      {
        entrypoint: 'transfer',
        calldata: ['0', '0', '0'],
        contractAddress: createAccountProxyTxn.contractAddress,
      },
      undefined,
      { maxFee: '22702500105945', nonce: 1 },
    );
    expect(createAccountStub).to.have.been.calledOnceWith(sinon.match.any, true, true);
  });

  it('should executeTxn multiple and deploy an account', async function () {
    sandbox.stub(utils, 'isAccountDeployed').resolves(false);
    const createAccountStub = sandbox.stub(createAccountUtils, 'createAccount').resolvesThis();
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
      { maxFee: '22702500105945', nonce: 1 },
    );
    expect(createAccountStub).to.have.been.calledOnceWith(sinon.match.any, true, true);
  });

  it('should executeTxn and not deploy an account', async function () {
    const createAccountStub = sandbox.stub(createAccountUtils, 'createAccount');
    sandbox.stub(utils, 'isAccountDeployed').resolves(true);
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
      { maxFee: '22702500105945', nonce: undefined },
    );
    expect(createAccountStub).to.not.have.been.called;
  });

  it('should executeTxn multiple and not deploy an account', async function () {
    const createAccountStub = sandbox.stub(createAccountUtils, 'createAccount');
    sandbox.stub(utils, 'isAccountDeployed').resolves(true);
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
      { maxFee: '22702500105945', nonce: undefined },
    );
    expect(createAccountStub).to.not.have.been.called;
  });

  it('should throw error if executeTxn fail', async function () {
    sandbox.stub(utils, 'isAccountDeployed').resolves(true);
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
        { maxFee: '22702500105945', nonce: undefined },
      );
    }
  });

  it('should return false if user rejected to sign the transaction', async function () {
    sandbox.stub(utils, 'isAccountDeployed').resolves(true);
    walletStub.rpcStubs.snap_dialog.resolves(false);
    const stub = sandbox.stub(utils, 'executeTxn').resolves({
      transaction_hash: 'transaction_hash',
    });

    const result = await executeTxn(apiParams);
    expect(result).to.equal(false);
    expect(stub).to.have.been.not.called;
  });
});
