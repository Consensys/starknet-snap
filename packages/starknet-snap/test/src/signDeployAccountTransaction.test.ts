import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { signDeployAccountTransaction } from '../../src/signDeployAccountTransaction';
import { SnapState } from '../../src/types/snapState';
import {
  STARKNET_MAINNET_NETWORK,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from '../../src/utils/constants';
import {
  createAccountProxyTxn,
  getBip44EntropyStub,
  account1,
  signature3,
} from '../constants.test';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import { Mutex } from 'async-mutex';
import {
  ApiParamsWithKeyDeriver,
  SignDeployAccountTransactionRequestParams,
} from '../../src/types/snapApi';
import { DeployAccountSignerDetails, constants } from 'starknet';
import * as utils from '../../src/utils/starknetUtils';
import * as snapsUtil from '../../src/utils/snapUtils';
import {
  DeployRequiredError,
  UpgradeRequiredError,
} from '../../src/utils/exceptions';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: signDeployAccountTransaction', function () {
  this.timeout(10000);
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_MAINNET_NETWORK, STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };
  let apiParams: ApiParamsWithKeyDeriver;

  const declareNDeployPayload = {
    classHash:
      '0x025ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918',
    contractAddress: account1.address,
    constructorCalldata: [],
    addressSalt:
      '0x025ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918',
    chainId: constants.StarknetChainId.SN_MAIN,
    nonce: '0x1',
    version: '0x0',
    maxFee: 100,
  } as unknown as DeployAccountSignerDetails;

  const requestObject: SignDeployAccountTransactionRequestParams = {
    chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
    signerAddress: account1.address,
    transaction: declareNDeployPayload,
    enableAuthorize: true,
  };

  beforeEach(async function () {
    walletStub.rpcStubs.snap_getBip44Entropy.callsFake(getBip44EntropyStub);
    apiParams = {
      state,
      requestParams: requestObject,
      wallet: walletStub,
      saveMutex: new Mutex(),
      keyDeriver: await getAddressKeyDeriver(walletStub),
    };
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
    sandbox.stub(utils, 'validateAccountRequireUpgradeOrDeploy').resolvesThis();
    sandbox.stub(utils, 'signDeployAccountTransaction').resolves(signature3);
    const result = await signDeployAccountTransaction(apiParams);
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
    expect(result).to.be.eql(signature3);
  });

  it('should throw error if signDeployAccountTransaction fail', async function () {
    sandbox.stub(utils, 'validateAccountRequireUpgradeOrDeploy').resolvesThis();
    sandbox.stub(utils, 'signDeployAccountTransaction').throws(new Error());
    let result;
    try {
      await signDeployAccountTransaction(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
      expect(result).to.be.an('Error');
    }
  });

  it('should return false if user deny to sign the transaction', async function () {
    sandbox.stub(utils, 'validateAccountRequireUpgradeOrDeploy').resolvesThis();
    const stub = sandbox.stub(utils, 'signDeployAccountTransaction');
    walletStub.rpcStubs.snap_dialog.resolves(false);

    const result = await signDeployAccountTransaction(apiParams);
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
    expect(stub).to.have.been.callCount(0);
    expect(result).to.be.eql(false);
  });

  it('should skip dialog if enableAuthorize is false', async function () {
    sandbox.stub(utils, 'validateAccountRequireUpgradeOrDeploy').resolvesThis();
    sandbox.stub(utils, 'signDeployAccountTransaction').resolves(signature3);
    const paramsObject =
      apiParams.requestParams as SignDeployAccountTransactionRequestParams;
    paramsObject.enableAuthorize = false;
    const result = await signDeployAccountTransaction(apiParams);
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.callCount(0);
    expect(result).to.be.eql(signature3);
    paramsObject.enableAuthorize = true;
  });

  it('should skip dialog if enableAuthorize is omit', async function () {
    sandbox.stub(utils, 'validateAccountRequireUpgradeOrDeploy').resolvesThis();
    sandbox.stub(utils, 'signDeployAccountTransaction').resolves(signature3);
    const paramsObject =
      apiParams.requestParams as SignDeployAccountTransactionRequestParams;
    paramsObject.enableAuthorize = undefined;
    const result = await signDeployAccountTransaction(apiParams);
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.callCount(0);
    expect(result).to.be.eql(signature3);
    paramsObject.enableAuthorize = true;
  });
});
