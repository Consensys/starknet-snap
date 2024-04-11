import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { signTransaction } from '../../src/signTransaction';
import { SnapState } from '../../src/types/snapState';
import { STARKNET_MAINNET_NETWORK, STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../src/utils/constants';
import { createAccountProxyTxn, getBip44EntropyStub, account1, signature3 } from '../constants.test';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import { Mutex } from 'async-mutex';
import { ApiParams, SignTransactionRequestParams } from '../../src/types/snapApi';
import { constants } from 'starknet';
import * as utils from '../../src/utils/starknetUtils';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: signMessage', function () {
  this.timeout(10000);
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [],
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

  const requestObject: SignTransactionRequestParams = {
    chainId: STARKNET_MAINNET_NETWORK.chainId,
    signerAddress: account1.address,
    transactions: [
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
    transactionsDetail: {
      walletAddress: '0x00b28a089e7fb83debee4607b6334d687918644796b47d9e9e38ea8213833137',
      chainId: constants.StarknetChainId.SN_MAIN,
      cairoVersion: '0',
      nonce: '0x1',
      version: '0x0',
      maxFee: 100,
    },
    enableAuthorize: true,
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

  it('should sign a transaction from an user account correctly', async function () {
    const result = await signTransaction(apiParams);
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
    expect(result).to.be.eql(signature3);
  });

  it('should throw error if signTransaction fail', async function () {
    sandbox.stub(utils, 'signTransactions').throws(new Error());
    let result;
    try {
      await signTransaction(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
      expect(result).to.be.an('Error');
    }
  });

  it('should return false if user deny to sign the transaction', async function () {
    const stub = sandbox.stub(utils, 'signTransactions');
    walletStub.rpcStubs.snap_dialog.resolves(false);

    const result = await signTransaction(apiParams);
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
    expect(stub).to.have.been.callCount(0);
    expect(result).to.be.eql(false);
  });

  it('should skip dialog if enableAuthorize is false', async function () {
    const paramsObject = apiParams.requestParams as SignTransactionRequestParams;
    paramsObject.enableAuthorize = false;
    const result = await signTransaction(apiParams);
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.callCount(0);
    expect(result).to.be.eql(signature3);
    paramsObject.enableAuthorize = true;
  });

  it('should skip dialog if enableAuthorize is omit', async function () {
    const paramsObject = apiParams.requestParams as SignTransactionRequestParams;
    paramsObject.enableAuthorize = undefined;
    const result = await signTransaction(apiParams);
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.callCount(0);
    expect(result).to.be.eql(signature3);
    paramsObject.enableAuthorize = true;
  });
});
