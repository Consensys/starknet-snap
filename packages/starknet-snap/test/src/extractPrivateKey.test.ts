import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { SnapState } from '../../src/types/snapState';
import { extractPrivateKey } from '../../src/extractPrivateKey';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../src/utils/constants';
import {
  account1,
  getBip44EntropyStub,
  unfoundUserAddress,
} from '../constants.test';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import * as utils from '../../src/utils/starknetUtils';
import { Mutex } from 'async-mutex';
import {
  ApiParams,
  ExtractPrivateKeyRequestParams,
} from '../../src/types/snapApi';
import { UpgradeRequiredError } from '../../src/utils/exceptions';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: extractPrivateKey', function () {
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [account1],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  const apiParams: ApiParams = {
    state,
    requestParams: {},
    wallet: walletStub,
    saveMutex: new Mutex(),
  };

  const requestObject: ExtractPrivateKeyRequestParams = {
    userAddress: account1.address,
  };

  beforeEach(async function () {
    walletStub.rpcStubs.snap_getBip44Entropy.callsFake(getBip44EntropyStub);
    apiParams.keyDeriver = await getAddressKeyDeriver(walletStub);
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  describe('when request param validation fail', function () {
    let invalidRequest = Object.assign({}, requestObject);

    afterEach(async function () {
      invalidRequest = Object.assign({}, requestObject);
    });

    it('should throw an error if the user address is undefined', async function () {
      invalidRequest.userAddress = undefined as unknown as string;
      apiParams.requestParams = invalidRequest;
      let result;
      try {
        result = await extractPrivateKey(apiParams);
      } catch (err) {
        result = err;
      } finally {
        expect(result).to.be.an('Error');
      }
    });

    it('should throw an error if the user address is invalid', async function () {
      invalidRequest.userAddress = 'wrongAddress';
      apiParams.requestParams = invalidRequest;
      let result;
      try {
        result = await extractPrivateKey(apiParams);
      } catch (err) {
        result = err;
      } finally {
        expect(result).to.be.an('Error');
      }
    });
  });

  describe('when request param validation pass', function () {
    beforeEach(async function () {
      apiParams.requestParams = Object.assign({}, requestObject);
    });

    afterEach(async function () {
      apiParams.requestParams = Object.assign({}, requestObject);
    });

    describe('when validateAccountRequireUpgradeOrDeploy fail', function () {
      it('should throw error', async function () {
        const validateAccountRequireUpgradeOrDeployStub = sandbox
          .stub(utils, 'validateAccountRequireUpgradeOrDeploy')
          .throws('network error');
        let result;
        try {
          result = await extractPrivateKey(apiParams);
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
          expect(result).to.be.an('Error');
        }
      });
    });

    describe('when account require upgrade', function () {
      let validateAccountRequireUpgradeOrDeployStub: sinon.SinonStub;
      beforeEach(async function () {
        validateAccountRequireUpgradeOrDeployStub = sandbox
          .stub(utils, 'validateAccountRequireUpgradeOrDeploy')
          .throws(new UpgradeRequiredError('Upgrade Required'));
      });

      it('should throw error if upgrade required', async function () {
        let result;
        try {
          result = await extractPrivateKey(apiParams);
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
          expect(result).to.be.an('Error');
        }
      });
    });

    describe('when account is not require upgrade', function () {
      beforeEach(async function () {
        sandbox
          .stub(utils, 'validateAccountRequireUpgradeOrDeploy')
          .resolvesThis();
      });

      it('should get the private key of the specified user account correctly', async function () {
        walletStub.rpcStubs.snap_dialog.resolves(true);
        const requestObject: ExtractPrivateKeyRequestParams = {
          userAddress: account1.address,
        };
        apiParams.requestParams = requestObject;
        const result = await extractPrivateKey(apiParams);
        expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledTwice;
        expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
        expect(result).to.be.equal(null);
      });

      it('should get the private key of the unfound user account correctly', async function () {
        walletStub.rpcStubs.snap_dialog.resolves(true);
        const requestObject: ExtractPrivateKeyRequestParams = {
          userAddress: unfoundUserAddress,
        };
        apiParams.requestParams = requestObject;
        const result = await extractPrivateKey(apiParams);
        expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledTwice;
        expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
        expect(result).to.be.eql(null);
      });

      it('should not get the private key of the specified user account if user rejected', async function () {
        walletStub.rpcStubs.snap_dialog.resolves(false);
        const requestObject: ExtractPrivateKeyRequestParams = {
          userAddress: account1.address,
        };
        apiParams.requestParams = requestObject;
        const result = await extractPrivateKey(apiParams);
        expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
        expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
        expect(result).to.be.equal(null);
      });

      it('should throw error if getKeysFromAddress failed', async function () {
        sandbox.stub(utils, 'getKeysFromAddress').throws(new Error());
        walletStub.rpcStubs.snap_dialog.resolves(true);
        const requestObject: ExtractPrivateKeyRequestParams = {
          userAddress: account1.address,
        };
        apiParams.requestParams = requestObject;

        let result;
        try {
          await extractPrivateKey(apiParams);
        } catch (err) {
          result = err;
        } finally {
          expect(result).to.be.an('Error');
        }
      });
    });
  });
});
