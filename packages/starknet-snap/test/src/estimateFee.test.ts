import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import * as utils from '../../src/utils/starknetUtils';
import { estimateFee } from '../../src/estimateFee';
import { SnapState } from '../../src/types/snapState';
import {
  ACCOUNT_CLASS_HASH,
  STARKNET_MAINNET_NETWORK,
} from '../../src/utils/constants';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import {
  account2,
  Cairo1Account1,
  estimateDeployFeeResp4,
  estimateFeeResp,
  getBip44EntropyStub,
  getBalanceResp,
} from '../constants.test';
import { Mutex } from 'async-mutex';
import {
  ApiParamsWithKeyDeriver,
  EstimateFeeRequestParams,
} from '../../src/types/snapApi';
import { TransactionType } from 'starknet';
import { UpgradeRequiredError } from '../../src/utils/exceptions';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: estimateFee', function () {
  const walletStub = new WalletMock();

  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_MAINNET_NETWORK],
    transactions: [],
  };
  const requestObject: EstimateFeeRequestParams = {
    contractAddress:
      '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
    contractFuncName: 'balanceOf',
    contractCallData:
      '0x7426b2da7a8978e0d472d64f15f984d658226cb55a4fd8aa7689688a7eab37b',
    senderAddress: account2.address,
  };
  let apiParams: ApiParamsWithKeyDeriver;

  beforeEach(async function () {
    walletStub.rpcStubs.snap_getBip44Entropy.callsFake(getBip44EntropyStub);
    apiParams = {
      state,
      requestParams: requestObject,
      wallet: walletStub,
      saveMutex: new Mutex(),
      keyDeriver: await getAddressKeyDeriver(walletStub),
    };

    sandbox.stub(utils, 'callContract').resolves(getBalanceResp);
    sandbox
      .stub(utils, 'getAccContractAddressAndCallDataLegacy')
      .resolves(account2.address);
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

    it('should throw an error if the function name is undefined', async function () {
      invalidRequest.contractFuncName = undefined as unknown as string;
      apiParams.requestParams = invalidRequest;
      let result;
      try {
        result = await estimateFee(apiParams);
      } catch (err) {
        result = err;
      } finally {
        expect(result).to.be.an('Error');
      }
    });

    it('should throw an error if the contract address is invalid', async function () {
      invalidRequest.contractAddress = 'wrongAddress';
      apiParams.requestParams = invalidRequest;
      let result;
      try {
        result = await estimateFee(apiParams);
      } catch (err) {
        result = err;
      } finally {
        expect(result).to.be.an('Error');
      }
    });

    it('should throw an error if the sender address is invalid', async function () {
      invalidRequest.senderAddress = 'wrongAddress';
      apiParams.requestParams = invalidRequest;
      let result;
      try {
        result = await estimateFee(apiParams);
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
      sandbox.stub(utils, 'getKeysFromAddress').resolves({
        privateKey: 'pk',
        publicKey: account2.publicKey,
        addressIndex: account2.addressIndex,
        derivationPath: `m / bip32:1' / bip32:1' / bip32:1' / bip32:1'`,
      });
    });

    afterEach(async function () {
      apiParams.requestParams = Object.assign({}, requestObject);
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
          result = await estimateFee(apiParams);
        } catch (err) {
          result = err;
        } finally {
          expect(
            validateAccountRequireUpgradeOrDeployStub,
          ).to.have.been.calledOnceWith(
            STARKNET_MAINNET_NETWORK,
            account2.address,
            account2.publicKey,
          );
          expect(result).to.be.an('Error');
          expect(result.message).to.equal('Upgrade Required');
        }
      });
    });

    describe('when account is not require upgrade', function () {
      let estimateFeeBulkStub: sinon.SinonStub;

      beforeEach(async function () {
        sandbox.stub(utils, 'isUpgradeRequired').resolves(false);
        apiParams.requestParams = {
          ...apiParams.requestParams,
          senderAddress: Cairo1Account1.address,
        };
      });

      describe('when account is deployed', function () {
        beforeEach(async function () {
          estimateFeeBulkStub = sandbox
            .stub(utils, 'estimateFeeBulk')
            .resolves([estimateFeeResp]);
          sandbox
            .stub(utils, 'validateAccountRequireUpgradeOrDeploy')
            .resolvesThis();
        });

        it('should estimate the fee correctly', async function () {
          const result = await estimateFee(apiParams);
          expect(result.suggestedMaxFee).to.be.eq(
            estimateFeeResp.suggestedMaxFee.toString(10),
          );
          expect(estimateFeeBulkStub).callCount(1);
        });
      });

      describe('when account is not deployed', function () {
        beforeEach(async function () {
          sandbox
            .stub(utils, 'validateAccountRequireUpgradeOrDeploy')
            .resolvesThis();
          sandbox.stub(utils, 'isAccountDeployed').resolves(false);
        });

        it('should estimate the fee including deploy txn correctly', async function () {
          estimateFeeBulkStub = sandbox
            .stub(utils, 'estimateFeeBulk')
            .resolves([estimateFeeResp, estimateDeployFeeResp4]);
          const expectedSuggestedMaxFee =
            estimateDeployFeeResp4.suggestedMaxFee +
            estimateFeeResp.suggestedMaxFee;
          const result = await estimateFee(apiParams);

          const { privateKey, publicKey } = await utils.getKeysFromAddress(
            apiParams.keyDeriver,
            STARKNET_MAINNET_NETWORK,
            state,
            Cairo1Account1.address,
          );
          const { callData } =
            utils.getAccContractAddressAndCallData(publicKey);
          const apiRequest =
            apiParams.requestParams as EstimateFeeRequestParams;

          const expectedBulkTransaction = [
            {
              type: TransactionType.DEPLOY_ACCOUNT,
              payload: {
                classHash: ACCOUNT_CLASS_HASH,
                contractAddress: Cairo1Account1.address,
                constructorCalldata: callData,
                addressSalt: publicKey,
              },
            },
            {
              type: TransactionType.INVOKE,
              payload: {
                contractAddress: apiRequest.contractAddress,
                entrypoint: apiRequest.contractFuncName,
                calldata: utils.getCallDataArray(
                  apiRequest.contractCallData as unknown as string,
                ),
              },
            },
          ];

          expect(result.suggestedMaxFee).to.be.eq(
            expectedSuggestedMaxFee.toString(10),
          );
          expect(estimateFeeBulkStub).callCount(1);
          expect(estimateFeeBulkStub).to.be.calledWith(
            STARKNET_MAINNET_NETWORK,
            Cairo1Account1.address,
            privateKey,
            expectedBulkTransaction,
          );
        });

        it('should throw error if estimateFee failed', async function () {
          estimateFeeBulkStub = sandbox
            .stub(utils, 'estimateFeeBulk')
            .throws('Error');
          apiParams.requestParams = requestObject;

          let result;
          try {
            await estimateFee(apiParams);
          } catch (err) {
            result = err;
          } finally {
            expect(result).to.be.an('Error');
            expect(estimateFeeBulkStub).callCount(1);
          }
        });
      });
    });
  });
});
