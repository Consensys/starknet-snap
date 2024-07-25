import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import * as utils from '../../src/utils/starknetUtils';
import * as snapUtils from '../../src/utils/snapUtils';
import {
  SnapState,
  VoyagerTransactionType,
  TransactionStatus,
} from '../../src/types/snapState';
import { upgradeAccContract } from '../../src/upgradeAccContract';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../src/utils/constants';
import {
  account1,
  estimateFeeResp,
  getBip44EntropyStub,
  sendTransactionResp,
} from '../constants.test';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import { Mutex } from 'async-mutex';
import {
  ApiParamsWithKeyDeriver,
  UpgradeTransactionRequestParams,
} from '../../src/types/snapApi';
import {
  CAIRO_VERSION_LEGACY,
  ACCOUNT_CLASS_HASH,
} from '../../src/utils/constants';
import { CallData, num } from 'starknet';

chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe('Test function: upgradeAccContract', function () {
  this.timeout(5000);
  let walletStub: WalletMock;
  let apiParams: ApiParamsWithKeyDeriver;
  let state: SnapState;

  beforeEach(async function () {
    const requestObject = {
      contractAddress: account1.address,
      chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
    };

    walletStub = new WalletMock();
    walletStub.rpcStubs.snap_getBip44Entropy.callsFake(getBip44EntropyStub);

    state = {
      accContracts: [account1],
      erc20Tokens: [],
      networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
      transactions: [],
    };

    apiParams = {
      state,
      requestParams: requestObject,
      wallet: walletStub,
      saveMutex: new Mutex(),
      keyDeriver: await getAddressKeyDeriver(walletStub),
    };
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  describe('when validation fail', function () {
    it('should show error when request contractAddress is not given', async function () {
      (
        apiParams.requestParams as UpgradeTransactionRequestParams
      ).contractAddress = undefined as unknown as string;

      let result;
      try {
        result = await upgradeAccContract(apiParams);
      } catch (err) {
        result = err;
      } finally {
        expect(result).to.be.an('Error');
        expect(result.message).to.be.include(
          'The given contract address need to be non-empty string',
        );
      }
    });

    it('should show error when request contractAddress is invalid', async function () {
      (
        apiParams.requestParams as UpgradeTransactionRequestParams
      ).contractAddress = '0x0';

      let result;
      try {
        result = await upgradeAccContract(apiParams);
      } catch (err) {
        result = err;
      } finally {
        expect(result).to.be.an('Error');
        expect(result.message).to.be.include(
          'The given contract address is invalid',
        );
      }
    });

    it('should show error when account is not deployed', async function () {
      sandbox.stub(utils, 'isAccountDeployed').resolves(false);

      let result;
      try {
        result = await upgradeAccContract(apiParams);
      } catch (err) {
        result = err;
      } finally {
        expect(result).to.be.an('Error');
        expect(result.message).to.be.include('Contract has not deployed');
      }
    });

    it('should show error when account is not required to upgrade', async function () {
      sandbox.stub(utils, 'isAccountDeployed').resolves(true);
      sandbox.stub(utils, 'isUpgradeRequired').resolves(false);

      let result;
      try {
        result = await upgradeAccContract(apiParams);
      } catch (err) {
        result = err;
      } finally {
        expect(result).to.be.an('Error');
        expect(result.message).to.be.include('Upgrade is not required');
      }
    });
  });

  describe('when validation pass', function () {
    let upsertTransactionStub: sinon.SinonStub;
    let executeTxnStub: sinon.SinonStub;
    let estimateFeeStub: sinon.SinonStub;

    beforeEach(async function () {
      sandbox.stub(utils, 'isAccountDeployed').resolves(true);
      sandbox.stub(utils, 'isUpgradeRequired').resolves(true);
      sandbox.stub(utils, 'getKeysFromAddress').resolves({
        privateKey: 'pk',
        publicKey: account1.publicKey,
        addressIndex: account1.addressIndex,
        derivationPath: `m / bip32:1' / bip32:1' / bip32:1' / bip32:1'`,
      });
      upsertTransactionStub = sandbox.stub(snapUtils, 'upsertTransaction');
      executeTxnStub = sandbox.stub(utils, 'executeTxn');
      estimateFeeStub = sandbox.stub(utils, 'estimateFee');
    });

    it('should use provided max fee to execute txn when max fee provided', async function () {
      (apiParams.requestParams as UpgradeTransactionRequestParams).maxFee =
        '10000';
      walletStub.rpcStubs.snap_dialog.resolves(true);
      executeTxnStub.resolves(sendTransactionResp);

      const address = (
        apiParams.requestParams as UpgradeTransactionRequestParams
      ).contractAddress;
      const calldata = CallData.compile({
        implementation: ACCOUNT_CLASS_HASH,
        calldata: [0],
      });

      const txnInvocation = {
        contractAddress: address,
        entrypoint: 'upgrade',
        calldata,
      };

      const result = await upgradeAccContract(apiParams);

      expect(executeTxnStub).to.calledOnce;
      expect(executeTxnStub).to.calledWith(
        STARKNET_SEPOLIA_TESTNET_NETWORK,
        address,
        'pk',
        txnInvocation,
        undefined,
        {
          maxFee: num.toBigInt(10000),
        },
        CAIRO_VERSION_LEGACY,
      );
      expect(result).to.be.equal(sendTransactionResp);
    });

    it('should use calculated max fee to execute txn when max fee not provided', async function () {
      walletStub.rpcStubs.snap_dialog.resolves(true);
      executeTxnStub.resolves(sendTransactionResp);
      estimateFeeStub.resolves(estimateFeeResp);

      const address = (
        apiParams.requestParams as UpgradeTransactionRequestParams
      ).contractAddress;
      const calldata = CallData.compile({
        implementation: ACCOUNT_CLASS_HASH,
        calldata: [0],
      });

      const txnInvocation = {
        contractAddress: address,
        entrypoint: 'upgrade',
        calldata,
      };

      const result = await upgradeAccContract(apiParams);

      expect(executeTxnStub).to.calledOnce;
      expect(executeTxnStub).to.calledWith(
        STARKNET_SEPOLIA_TESTNET_NETWORK,
        address,
        'pk',
        txnInvocation,
        undefined,
        {
          maxFee: num.toBigInt(estimateFeeResp.suggestedMaxFee),
        },
        CAIRO_VERSION_LEGACY,
      );
      expect(result).to.be.equal(sendTransactionResp);
    });

    it('should return executed txn result when user accept to sign the transaction', async function () {
      executeTxnStub.resolves(sendTransactionResp);
      estimateFeeStub.resolves(estimateFeeResp);
      walletStub.rpcStubs.snap_dialog.resolves(true);

      const result = await upgradeAccContract(apiParams);

      expect(result).to.be.equal(sendTransactionResp);
      expect(walletStub.rpcStubs.snap_dialog).to.calledOnce;
      expect(executeTxnStub).to.calledOnce;
    });

    it('should return false when user rejected to sign the transaction', async function () {
      executeTxnStub.resolves(sendTransactionResp);
      estimateFeeStub.resolves(estimateFeeResp);
      walletStub.rpcStubs.snap_dialog.resolves(false);

      const result = await upgradeAccContract(apiParams);

      expect(result).to.be.equal(false);
      expect(walletStub.rpcStubs.snap_dialog).to.calledOnce;
      expect(executeTxnStub).to.not.called;
    });

    it('should return executed txn result when execute transaction success', async function () {
      executeTxnStub.resolves(sendTransactionResp);
      estimateFeeStub.resolves(estimateFeeResp);
      walletStub.rpcStubs.snap_dialog.resolves(true);

      const result = await upgradeAccContract(apiParams);

      expect(result).to.be.equal(sendTransactionResp);
      expect(walletStub.rpcStubs.snap_dialog).to.calledOnce;
      expect(executeTxnStub).to.calledOnce;
    });

    it('should throw exception when execute transaction result null', async function () {
      executeTxnStub.resolves(null);
      estimateFeeStub.resolves(estimateFeeResp);
      walletStub.rpcStubs.snap_dialog.resolves(true);

      let result;
      try {
        result = await upgradeAccContract(apiParams);
      } catch (err) {
        result = err;
      } finally {
        expect(result).to.be.an('Error');
        expect(result.message).to.be.include('Transaction hash is not found');
      }
    });

    it('should save transaction when execute transaction success', async function () {
      executeTxnStub.resolves(sendTransactionResp);
      estimateFeeStub.resolves(estimateFeeResp);
      walletStub.rpcStubs.snap_dialog.resolves(true);
      const address = (
        apiParams.requestParams as UpgradeTransactionRequestParams
      ).contractAddress;
      const calldata = CallData.compile({
        implementation: ACCOUNT_CLASS_HASH,
        calldata: [0],
      });
      const txn = {
        txnHash: sendTransactionResp.transaction_hash,
        txnType: VoyagerTransactionType.INVOKE,
        chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
        senderAddress: address,
        contractAddress: address,
        contractFuncName: 'upgrade',
        contractCallData: CallData.compile(calldata),
        finalityStatus: TransactionStatus.RECEIVED,
        executionStatus: TransactionStatus.RECEIVED,
        status: '',
        failureReason: '',
        eventIds: [],
      };

      const result = await upgradeAccContract(apiParams);
      expect(result).to.be.equal(sendTransactionResp);
      expect(upsertTransactionStub).to.calledOnceWith(sinon.match(txn));
    });
  });
});
