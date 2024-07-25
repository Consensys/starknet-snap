import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import * as utils from '../../src/utils/starknetUtils';
import * as snapsUtil from '../../src/utils/snapUtils';
import { declareContract } from '../../src/declareContract';
import { SnapState } from '../../src/types/snapState';
import {
  STARKNET_MAINNET_NETWORK,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from '../../src/utils/constants';
import {
  createAccountProxyTxn,
  getBip44EntropyStub,
  account1,
} from '../constants.test';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import { Mutex } from 'async-mutex';
import {
  ApiParams,
  ApiParamsWithKeyDeriver,
  DeclareContractRequestParams,
} from '../../src/types/snapApi';
import {
  DeployRequiredError,
  UpgradeRequiredError,
} from '../../src/utils/exceptions';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: declareContract', function () {
  this.timeout(10000);
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [account1],
    erc20Tokens: [],
    networks: [STARKNET_MAINNET_NETWORK, STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };
  let apiParams: ApiParamsWithKeyDeriver;

  const requestObject: DeclareContractRequestParams = {
    chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
    senderAddress: account1.address,
    contractPayload: {
      contract: 'TestContract',
    },
    invocationsDetails: {
      maxFee: 100,
    },
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

    sandbox
      .stub(snapsUtil, 'showAccountRequireUpgradeOrDeployModal')
      .callsFake(async (wallet, e) => {
        if (e instanceof DeployRequiredError) {
          await snapsUtil.showDeployRequestModal(wallet);
        } else if (e instanceof UpgradeRequiredError) {
          await snapsUtil.showUpgradeRequestModal(wallet);
        }
      });
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should 1) throw an error and 2) show upgrade modal if account upgrade required', async function () {
    const validateAccountRequireUpgradeOrDeployStub = sandbox
      .stub(utils, 'validateAccountRequireUpgradeOrDeploy')
      .throws(new UpgradeRequiredError('Upgrade Required'));
    const showUpgradeRequestModalStub = sandbox
      .stub(snapsUtil, 'showUpgradeRequestModal')
      .resolves();
    let result;
    try {
      result = await declareContract(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(
        validateAccountRequireUpgradeOrDeployStub,
      ).to.have.been.calledOnceWith(
        STARKNET_SEPOLIA_TESTNET_NETWORK,
        account1.address,
        account1.publicKey,
      );
      expect(showUpgradeRequestModalStub).to.have.been.calledOnce;
      expect(result).to.be.an('Error');
    }
  });

  it('should 1) throw an error and 2) show deploy modal if account deployed required', async function () {
    const validateAccountRequireUpgradeOrDeployStub = sandbox
      .stub(utils, 'validateAccountRequireUpgradeOrDeploy')
      .throws(
        new DeployRequiredError(
          `Cairo 0 contract address ${account1.address} balance is not empty, deploy required`,
        ),
      );
    const showDeployRequestModalStub = sandbox
      .stub(snapsUtil, 'showDeployRequestModal')
      .resolves();
    let result;
    try {
      result = await declareContract(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(
        validateAccountRequireUpgradeOrDeployStub,
      ).to.have.been.calledOnceWith(
        STARKNET_SEPOLIA_TESTNET_NETWORK,
        account1.address,
        account1.publicKey,
      );
      expect(showDeployRequestModalStub).to.have.been.calledOnce;
      expect(result).to.be.an('Error');
    }
  });

  it('should declareContract correctly', async function () {
    sandbox.stub(utils, 'validateAccountRequireUpgradeOrDeploy').resolvesThis();
    const declareContractStub = sandbox
      .stub(utils, 'declareContract')
      .resolves({
        transaction_hash: 'transaction_hash',
        class_hash: 'class_hash',
      });
    const result = await declareContract(apiParams);
    const { privateKey } = await utils.getKeysFromAddress(
      apiParams.keyDeriver,
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      state,
      account1.address,
    );

    expect(result).to.eql({
      transaction_hash: 'transaction_hash',
      class_hash: 'class_hash',
    });
    expect(declareContractStub).to.have.been.calledOnce;
    expect(declareContractStub).to.have.been.calledWith(
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      account1.address,
      privateKey,
      { contract: 'TestContract' },
      { maxFee: 100 },
    );
  });

  it('should throw error if declareContract fail', async function () {
    sandbox.stub(utils, 'validateAccountRequireUpgradeOrDeploy').resolvesThis();
    const declareContractStub = sandbox
      .stub(utils, 'declareContract')
      .rejects('error');
    const { privateKey } = await utils.getKeysFromAddress(
      apiParams.keyDeriver,
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      state,
      account1.address,
    );
    let result;
    try {
      await declareContract(apiParams);
    } catch (e) {
      result = e;
    } finally {
      expect(result).to.be.an('Error');
      expect(declareContractStub).to.have.been.calledOnce;
      expect(declareContractStub).to.have.been.calledWith(
        STARKNET_SEPOLIA_TESTNET_NETWORK,
        account1.address,
        privateKey,
        { contract: 'TestContract' },
        { maxFee: 100 },
      );
    }
  });

  it('should return false if user rejected to sign the transaction', async function () {
    sandbox.stub(utils, 'validateAccountRequireUpgradeOrDeploy').resolvesThis();
    walletStub.rpcStubs.snap_dialog.resolves(false);
    const declareContractStub = sandbox
      .stub(utils, 'declareContract')
      .resolves({
        transaction_hash: 'transaction_hash',
        class_hash: 'class_hash',
      });
    const result = await declareContract(apiParams);
    expect(result).to.equal(false);
    expect(declareContractStub).to.have.been.not.called;
  });
});
