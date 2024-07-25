import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { SnapState } from '../../src/types/snapState';
import { verifySignedMessage } from '../../src/verifySignedMessage';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../src/utils/constants';
import { account1, getBip44EntropyStub, signature1 } from '../constants.test';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import * as utils from '../../src/utils/starknetUtils';
import { Mutex } from 'async-mutex';
import {
  ApiParamsWithKeyDeriver,
  VerifySignedMessageRequestParams,
} from '../../src/types/snapApi';
import { UpgradeRequiredError } from '../../src/utils/exceptions';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: verifySignedMessage', function () {
  this.timeout(5000);
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [account1],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  let apiParams: ApiParamsWithKeyDeriver;

  const requestObject: VerifySignedMessageRequestParams = {
    signerAddress: account1.address,
    typedDataMessage: undefined, // will use typedDataExample.json
    signature: signature1,
  };

  beforeEach(async function () {
    walletStub.rpcStubs.snap_getBip44Entropy.callsFake(getBip44EntropyStub);
    apiParams = {
      state,
      requestParams: {},
      wallet: walletStub,
      saveMutex: new Mutex(),
      keyDeriver: await getAddressKeyDeriver(walletStub),
    };
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  describe('when request param validation fail', function () {
    let invalidRequest = Object.assign({}, requestObject);

    afterEach(async function () {
      invalidRequest = Object.assign({}, requestObject);
      apiParams.requestParams = requestObject;
    });

    it('should throw an error if the signerAddress is an invalid address', async function () {
      invalidRequest.signerAddress = 'wrongAddress';
      apiParams.requestParams = invalidRequest;
      let result;
      try {
        result = await verifySignedMessage(apiParams);
      } catch (err) {
        result = err;
      } finally {
        expect(result).to.be.an('Error');
      }
    });

    it('should throw an error if the signature is undefined', async function () {
      invalidRequest.signature = undefined as unknown as string;
      apiParams.requestParams = invalidRequest;
      let result;
      try {
        result = await verifySignedMessage(apiParams);
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
          result = await verifySignedMessage(apiParams);
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
          result = await verifySignedMessage(apiParams);
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

      it('should verify a signed message from an user account correctly', async function () {
        const requestObject: VerifySignedMessageRequestParams = {
          signerAddress: account1.address,
          typedDataMessage: undefined, // will use typedDataExample.json
          signature: signature1,
        };
        apiParams.requestParams = requestObject;
        const result = await verifySignedMessage(apiParams);
        expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
        expect(result).to.be.eql(true);
      });

      it('should throw error if getKeysFromAddress failed', async function () {
        sandbox.stub(utils, 'getKeysFromAddress').throws(new Error());
        const requestObject: VerifySignedMessageRequestParams = {
          signerAddress: account1.address,
          typedDataMessage: undefined, // will use typedDataExample.json
          signature: signature1,
        };
        apiParams.requestParams = requestObject;

        let result;
        try {
          await verifySignedMessage(apiParams);
        } catch (err) {
          result = err;
        } finally {
          expect(result).to.be.an('Error');
        }
        expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
      });
    });
  });
});
