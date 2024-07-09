import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { SnapState } from '../../src/types/snapState';
import { signMessage } from '../../src/signMessage';
import typedDataExample from '../../src/typedData/typedDataExample.json';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../src/utils/constants';
import {
  account1,
  Cairo1Account1,
  getBip44EntropyStub,
  signature4SignMessageWithUnfoundAddress,
  unfoundUserAddress,
  signature4Cairo1SignMessage,
} from '../constants.test';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import * as utils from '../../src/utils/starknetUtils';
import { Mutex } from 'async-mutex';
import { ApiParams, SignMessageRequestParams } from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: signMessage', function () {
  this.timeout(5000);
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [],
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

  const requestObject: SignMessageRequestParams = {
    chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
    signerAddress: account1.address,
    typedDataMessage: typedDataExample,
    enableAuthorize: true,
  };

  beforeEach(async function () {
    walletStub.rpcStubs.snap_getBip44Entropy.callsFake(getBip44EntropyStub);
    apiParams.keyDeriver = await getAddressKeyDeriver(walletStub);
    apiParams.requestParams = requestObject;
    walletStub.rpcStubs.snap_dialog.resolves(true);
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

    it('should throw an error if the signerAddress is undefined', async function () {
      invalidRequest.signerAddress = undefined;
      apiParams.requestParams = invalidRequest;
      let result;
      try {
        result = await signMessage(apiParams);
      } catch (err) {
        result = err;
      } finally {
        expect(result).to.be.an('Error');
      }
    });

    it('should throw an error if the signerAddress is an invalid address', async function () {
      invalidRequest.signerAddress = 'wrongAddress';
      apiParams.requestParams = invalidRequest;
      let result;
      try {
        result = await signMessage(apiParams);
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

    it('skip dialog if enableAuthorize is false or omit', async function () {
      sandbox
        .stub(utils, 'getCorrectContractAddress')
        .resolves({ address: '', signerPubKey: '', upgradeRequired: false, deployRequired: false });
      const paramsObject = apiParams.requestParams as SignMessageRequestParams;

      paramsObject.enableAuthorize = false;
      await signMessage(apiParams);
      expect(walletStub.rpcStubs.snap_dialog).to.have.been.callCount(0);

      paramsObject.enableAuthorize = undefined;
      await signMessage(apiParams);
      expect(walletStub.rpcStubs.snap_dialog).to.have.been.callCount(0);

      paramsObject.enableAuthorize = true;
    });

    describe('when require upgrade checking fail', function () {
      it('should throw error', async function () {
        const getCorrectContractAddressStub = sandbox.stub(utils, 'getCorrectContractAddress').throws('network error');
        let result;
        try {
          result = await signMessage(apiParams);
        } catch (err) {
          result = err;
        } finally {
          expect(getCorrectContractAddressStub).to.have.been.calledOnceWith(
            STARKNET_SEPOLIA_TESTNET_NETWORK,
            account1.publicKey,
          );
          expect(result).to.be.an('Error');
        }
      });
    });

    describe('when account require upgrade', function () {
      let getCorrectContractAddressStub: sinon.SinonStub;
      beforeEach(async function () {
        getCorrectContractAddressStub = sandbox
          .stub(utils, 'getCorrectContractAddress')
          .resolves({ address: '', signerPubKey: '', upgradeRequired: true, deployRequired: false });
      });

      it('should throw error if upgrade required', async function () {
        let result;
        try {
          result = await signMessage(apiParams);
        } catch (err) {
          result = err;
        } finally {
          expect(getCorrectContractAddressStub).to.have.been.calledOnceWith(
            STARKNET_SEPOLIA_TESTNET_NETWORK,
            account1.publicKey,
          );
          expect(result).to.be.an('Error');
        }
      });
    });

    describe('when account is not require upgrade', function () {
      beforeEach(async function () {
        apiParams.requestParams = {
          ...apiParams.requestParams,
          signerAddress: Cairo1Account1.address,
        };
        sandbox
          .stub(utils, 'getCorrectContractAddress')
          .resolves({ address: '', signerPubKey: '', upgradeRequired: false, deployRequired: false });
      });

      it('should sign a message from an user account correctly', async function () {
        const result = await signMessage(apiParams);
        expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
        expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
        expect(result).to.be.eql(signature4Cairo1SignMessage);
      });

      it('should sign a message from an unfound user account correctly', async function () {
        const paramsObject = apiParams.requestParams as SignMessageRequestParams;
        paramsObject.signerAddress = unfoundUserAddress;
        const result = await signMessage(apiParams);
        expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
        expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
        expect(result).to.be.eql(signature4SignMessageWithUnfoundAddress);
      });

      it('should throw error if getKeysFromAddress failed', async function () {
        sandbox.stub(utils, 'getKeysFromAddress').throws(new Error());
        let result;
        try {
          await signMessage(apiParams);
        } catch (err) {
          result = err;
        } finally {
          expect(result).to.be.an('Error');
        }
        expect(walletStub.rpcStubs.snap_dialog).to.have.not.been.called;
        expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
      });

      it('should return false if the user not confirmed', async function () {
        walletStub.rpcStubs.snap_dialog.resolves(false);
        const result = await signMessage(apiParams);
        expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
        expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
        expect(result).to.be.eql(false);
      });

      it('should throw an error if the signerAddress is undefined', async function () {
        const requestObject: SignMessageRequestParams = {
          signerAddress: undefined,
          typedDataMessage: typedDataExample,
        };
        apiParams.requestParams = requestObject;
        let result;
        try {
          result = await signMessage(apiParams);
        } catch (err) {
          result = err;
        } finally {
          expect(result).to.be.an('Error');
        }
      });

      it('should throw an error if the signerAddress is an invalid address', async function () {
        const invalidAddress = 'wrongAddress';
        const requestObject: SignMessageRequestParams = {
          signerAddress: invalidAddress,
          typedDataMessage: typedDataExample,
        };
        apiParams.requestParams = requestObject;
        let result;
        try {
          result = await signMessage(apiParams);
        } catch (err) {
          result = err;
        } finally {
          expect(result).to.be.an('Error');
        }
      });

      it('should skip dialog if enableAuthorize is false', async function () {
        const paramsObject = apiParams.requestParams as SignMessageRequestParams;
        paramsObject.enableAuthorize = false;
        const result = await signMessage(apiParams);
        expect(walletStub.rpcStubs.snap_dialog).to.have.been.callCount(0);
        expect(result).to.be.eql(signature4Cairo1SignMessage);
        paramsObject.enableAuthorize = true;
      });

      it('should skip dialog if enableAuthorize is omit', async function () {
        const paramsObject = apiParams.requestParams as SignMessageRequestParams;
        paramsObject.enableAuthorize = undefined;
        const result = await signMessage(apiParams);
        expect(walletStub.rpcStubs.snap_dialog).to.have.been.callCount(0);
        expect(result).to.be.eql(signature4Cairo1SignMessage);
        paramsObject.enableAuthorize = true;
      });
    });
  });
});
