import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { SnapState } from '../../src/types/snapState';
import { extractPublicKey } from '../../src/extractPublicKey';
import { STARKNET_TESTNET_NETWORK } from '../../src/utils/constants';
import { account1, getBip44EntropyStub, unfoundUserAddress, unfoundUserPublicKey } from '../constants.test';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import * as utils from '../../src/utils/starknetUtils';
import { Mutex } from 'async-mutex';
import { ApiParams, ExtractPublicKeyRequestParams } from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: extractPublicKey', function () {
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [account1],
    erc20Tokens: [],
    networks: [STARKNET_TESTNET_NETWORK],
    transactions: [],
  };
  const apiParams: ApiParams = {
    state,
    requestParams: {},
    wallet: walletStub,
    saveMutex: new Mutex(),
  };

  const requestObject: ExtractPublicKeyRequestParams = {
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

    it('should throw error if param userAddress is undefined', async function () {
      invalidRequest.userAddress = undefined;
      apiParams.requestParams = invalidRequest;
      let result;
      try {
        result = await extractPublicKey(apiParams);
      } catch (err) {
        result = err;
      } finally {
        expect(result).to.be.an('Error');
      }
    });

    it('should throw error if param userAddress is invalid', async function () {
      invalidRequest.userAddress = 'wrongAddress';
      apiParams.requestParams = invalidRequest;
      let result;
      try {
        result = await extractPublicKey(apiParams);
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

    describe('when require upgrade checking fail', function () {
      it('should throw error', async function () {
        const isUpgradeRequiredStub = sandbox.stub(utils, 'isUpgradeRequired').throws('network error');
        let result;
        try {
          result = await extractPublicKey(apiParams);
        } catch (err) {
          result = err;
        } finally {
          expect(isUpgradeRequiredStub).to.have.been.calledOnceWith(STARKNET_TESTNET_NETWORK, account1.address);
          expect(result).to.be.an('Error');
        }
      });
    });

    describe('when account require upgrade', function () {
      let isUpgradeRequiredStub: sinon.SinonStub;
      beforeEach(async function () {
        isUpgradeRequiredStub = sandbox.stub(utils, 'isUpgradeRequired').resolves(true);
      });

      it('should throw error if upgrade required', async function () {
        let result;
        try {
          result = await extractPublicKey(apiParams);
        } catch (err) {
          result = err;
        } finally {
          expect(isUpgradeRequiredStub).to.have.been.calledOnceWith(STARKNET_TESTNET_NETWORK, account1.address);
          expect(result).to.be.an('Error');
        }
      });
    });

    describe('when account is not require upgrade', function () {
      beforeEach(async function () {
        sandbox.stub(utils, 'isUpgradeRequired').resolves(false);
      });

      describe('when account is cairo 0', function () {
        //TODO
      });

      describe('when account is cairo 1', function () {
        it('should get the public key of the specified user account correctly', async function () {
          const requestObject: ExtractPublicKeyRequestParams = {
            userAddress: account1.address,
          };
          apiParams.requestParams = requestObject;
          const result = await extractPublicKey(apiParams);
          expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
          expect(result).to.be.eql(account1.publicKey);
        });

        it('should get the public key of the unfound user account correctly', async function () {
          const requestObject: ExtractPublicKeyRequestParams = {
            userAddress: unfoundUserAddress,
          };
          apiParams.requestParams = requestObject;
          const result = await extractPublicKey(apiParams);
          expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
          expect(result).to.be.eql(unfoundUserPublicKey);
        });

        it('should throw error if getKeysFromAddress failed', async function () {
          sandbox.stub(utils, 'getKeysFromAddress').throws(new Error());
          const requestObject: ExtractPublicKeyRequestParams = {
            userAddress: unfoundUserAddress,
          };
          apiParams.requestParams = requestObject;

          let result;
          try {
            await extractPublicKey(apiParams);
          } catch (err) {
            result = err;
          } finally {
            expect(result).to.be.an('Error');
          }
        });
      });
    });
  });
});
