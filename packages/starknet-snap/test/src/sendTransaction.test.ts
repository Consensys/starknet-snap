import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import * as utils from '../../src/utils/starknetUtils';
import * as snapUtils from '../../src/utils/snapUtils';
import { SnapState } from '../../src/types/snapState';
import { sendTransaction } from '../../src/sendTransaction';
import * as estimateFeeSnap from '../../src/estimateFee';
import { STARKNET_TESTNET_NETWORK } from '../../src/utils/constants';
import {
  account1,
  createAccountProxyResp,
  estimateDeployFeeResp,
  estimateFeeResp,
  getBalanceResp,
  getBip44EntropyStub,
  sendTransactionFailedResp,
  sendTransactionResp,
  token2,
  token3,
  unfoundUserAddress,
} from '../constants.test';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import { Mutex } from 'async-mutex';
import { ApiParams, SendTransactionRequestParams } from '../../src/types/snapApi';

chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe('Test function: sendTransaction', function () {
  this.timeout(5000);
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [account1],
    erc20Tokens: [token2, token3],
    networks: [STARKNET_TESTNET_NETWORK],
    transactions: [],
  };
  const apiParams: ApiParams = {
    state,
    requestParams: {},
    wallet: walletStub,
    saveMutex: new Mutex(),
  };

  const requestObject: SendTransactionRequestParams = {
    contractAddress: '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
    contractFuncName: 'transfer',
    contractCallData: '0x0256d8f49882cc9366037415f48fa9fd2b5b7344ded7573ebfcef7c90e3e6b75,100000000000000000000,0',
    senderAddress: account1.address,
    chainId: STARKNET_TESTNET_NETWORK.chainId,
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
    let invalidRequest: SendTransactionRequestParams = Object.assign({}, requestObject);

    afterEach(function () {
      invalidRequest = Object.assign({}, requestObject);
      apiParams.requestParams = requestObject;
    });

    it('it should show error when request contractAddress is not given', async function () {
      invalidRequest.contractAddress = undefined;
      apiParams.requestParams = invalidRequest;
      let result;
      try {
        result = await sendTransaction(apiParams);
      } catch (err) {
        result = err;
      } finally {
        expect(result).to.be.an('Error');
        expect(result.message).to.be.include(
          'The given contract address, sender address, and function name need to be non-empty string',
        );
      }
    });

    it('it should show error when request contractAddress is invalid', async function () {
      invalidRequest.contractAddress = '0x0';
      apiParams.requestParams = invalidRequest;
      let result;
      try {
        result = await sendTransaction(apiParams);
      } catch (err) {
        result = err;
      } finally {
        expect(result).to.be.an('Error');
        expect(result.message).to.be.include('The given contract address is invalid');
      }
    });

    it('it should show error when request senderAddress is not given', async function () {
      invalidRequest.senderAddress = undefined;
      apiParams.requestParams = invalidRequest;
      let result;
      try {
        result = await sendTransaction(apiParams);
      } catch (err) {
        result = err;
      } finally {
        expect(result).to.be.an('Error');
        expect(result.message).to.be.include(
          'The given contract address, sender address, and function name need to be non-empty string',
        );
      }
    });

    it('it should show error when request contractAddress is invalid', async function () {
      invalidRequest.senderAddress = '0x0';
      apiParams.requestParams = invalidRequest;
      let result;
      try {
        result = await sendTransaction(apiParams);
      } catch (err) {
        result = err;
      } finally {
        expect(result).to.be.an('Error');
        expect(result.message).to.be.include('The given sender address is invalid');
      }
    });

    it('it should show error when request contractFuncName is not given', async function () {
      invalidRequest.contractFuncName = undefined;
      apiParams.requestParams = invalidRequest;
      let result;
      try {
        result = await sendTransaction(apiParams);
      } catch (err) {
        result = err;
      } finally {
        expect(result).to.be.an('Error');
        expect(result.message).to.be.include(
          'The given contract address, sender address, and function name need to be non-empty string',
        );
      }
    });

    it('it should show error when request network not found', async function () {
      invalidRequest.chainId = '0x0';
      apiParams.requestParams = invalidRequest;
      let result;
      try {
        result = await sendTransaction(apiParams);
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
          result = await sendTransaction(apiParams);
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
          result = await sendTransaction(apiParams);
        } catch (err) {
          result = err;
        } finally {
          expect(isUpgradeRequiredStub).to.have.been.calledOnceWith(STARKNET_TESTNET_NETWORK, account1.address);
          expect(result).to.be.an('Error');
        }
      });
    });

    describe('when account is not require upgrade', function () {
      let executeTxnResp;
      let executeTxnStub: sinon.SinonStub;
      beforeEach(async function () {
        sandbox.stub(utils, 'isUpgradeRequired').resolves(false);
        sandbox.stub(estimateFeeSnap, 'estimateFee').resolves({
          suggestedMaxFee: estimateFeeResp.suggestedMaxFee.toString(10),
          overallFee: estimateFeeResp.overall_fee.toString(10),
          gasConsumed: '0',
          gasPrice: '0',
          unit: 'wei',
          includeDeploy: true,
        });
        executeTxnResp = sendTransactionResp;
        executeTxnStub = sandbox.stub(utils, 'executeTxn').resolves(executeTxnResp);
        walletStub.rpcStubs.snap_manageState.resolves(state);
      });

      it('should return false if user rejected to sign the transaction', async function () {
        sandbox.stub(utils, 'isAccountAddressDeployed').resolves(true);
        walletStub.rpcStubs.snap_dialog.resolves(false);
        apiParams.requestParams = requestObject;
        const result = await sendTransaction(apiParams);
        expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
        expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
        expect(result).to.be.eql(false);
      });

      it('should use heading, text and copyable component', async function () {
        sandbox.stub(utils, 'isAccountAddressDeployed').resolves(true);
        executeTxnResp = sendTransactionFailedResp;
        const requestObject: SendTransactionRequestParams = {
          contractAddress: account1.address,
          contractFuncName: 'get_signer',
          contractCallData: '**foo**',
          senderAddress: account1.address,
        };
        apiParams.requestParams = requestObject;
        await sendTransaction(apiParams);
        const expectedDialogParams = {
          type: 'confirmation',
          content: {
            type: 'panel',
            children: [
              { type: 'heading', value: 'Do you want to sign this transaction ?' },
              {
                type: 'text',
                value: `**Signer Address:**`,
              },
              {
                type: 'copyable',
                value: '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd',
              },
              {
                type: 'text',
                value: `**Contract:**`,
              },
              {
                type: 'copyable',
                value: '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd',
              },
              {
                type: 'text',
                value: `**Call Data:**`,
              },
              {
                type: 'copyable',
                value: '[**foo**]',
              },
              {
                type: 'text',
                value: `**Estimated Gas Fee(ETH):**`,
              },
              {
                type: 'copyable',
                value: '0.000022702500105945',
              },
              {
                type: 'text',
                value: `**Network:**`,
              },
              {
                type: 'copyable',
                value: 'Goerli Testnet',
              },
            ],
          },
        };
        expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
        expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledWith(expectedDialogParams);
      });

      describe('when account is cairo 0', function () {
        //TODO
      });

      describe('when account is cairo 1', function () {
        beforeEach(async function () {
          walletStub.rpcStubs.snap_dialog.resolves(true);
        });

        describe('when account is deployed', function () {
          beforeEach(async function () {
            sandbox.stub(utils, 'isAccountAddressDeployed').resolves(true);
          });

          it('should send a transaction for transferring 10 tokens correctly', async function () {
            const requestObject: SendTransactionRequestParams = {
              contractAddress: '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
              contractFuncName: 'transfer',
              contractCallData:
                '0x0256d8f49882cc9366037415f48fa9fd2b5b7344ded7573ebfcef7c90e3e6b75,100000000000000000000,0',
              senderAddress: account1.address,
            };
            apiParams.requestParams = requestObject;
            const result = await sendTransaction(apiParams);
            expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
            expect(walletStub.rpcStubs.snap_manageState).to.have.been.called;
            expect(result).to.be.eql(sendTransactionResp);
          });

          it('should send a transaction for transferring 10 tokens but not update snap state if transaction_hash is missing from response', async function () {
            executeTxnStub.restore();
            executeTxnStub = sandbox.stub(utils, 'executeTxn').resolves(sendTransactionFailedResp);
            const requestObject: SendTransactionRequestParams = {
              contractAddress: '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
              contractFuncName: 'transfer',
              contractCallData:
                '0x0256d8f49882cc9366037415f48fa9fd2b5b7344ded7573ebfcef7c90e3e6b75,100000000000000000000,0',
              senderAddress: account1.address,
            };
            apiParams.requestParams = requestObject;
            const result = await sendTransaction(apiParams);
            expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
            expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
            expect(result).to.be.eql(sendTransactionFailedResp);
          });

          it('should send a transaction with given max fee for transferring 10 tokens correctly', async function () {
            const requestObject: SendTransactionRequestParams = {
              contractAddress: '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
              contractFuncName: 'transfer',
              contractCallData:
                '0x0256d8f49882cc9366037415f48fa9fd2b5b7344ded7573ebfcef7c90e3e6b75,100000000000000000000,0',
              senderAddress: account1.address,
              maxFee: '15135825227039',
            };
            apiParams.requestParams = requestObject;
            const result = await sendTransaction(apiParams);
            expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
            expect(walletStub.rpcStubs.snap_manageState).to.have.been.called;
            expect(result).to.be.eql(sendTransactionResp);
          });

          it('should send a transfer transaction for empty call data', async function () {
            const requestObject: SendTransactionRequestParams = {
              contractAddress: '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
              contractFuncName: 'transfer',
              contractCallData: undefined,
              senderAddress: account1.address,
            };
            apiParams.requestParams = requestObject;
            const result = await sendTransaction(apiParams);
            expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
            expect(walletStub.rpcStubs.snap_manageState).to.have.been.called;
            expect(result).to.be.eql(sendTransactionResp);
          });

          it('should send a transaction for empty call data', async function () {
            const requestObject: SendTransactionRequestParams = {
              contractAddress: account1.address,
              contractFuncName: 'get_signer',
              contractCallData: undefined,
              senderAddress: account1.address,
            };
            apiParams.requestParams = requestObject;
            const result = await sendTransaction(apiParams);
            expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
            expect(walletStub.rpcStubs.snap_manageState).to.have.been.called;
            expect(result).to.be.eql(sendTransactionResp);
          });

          it('should send a transaction for transferring 10 tokens from an unfound user correctly', async function () {
            const requestObject: SendTransactionRequestParams = {
              contractAddress: '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
              contractFuncName: 'transfer',
              contractCallData:
                '0x0256d8f49882cc9366037415f48fa9fd2b5b7344ded7573ebfcef7c90e3e6b75,100000000000000000000,0',
              senderAddress: unfoundUserAddress,
            };
            apiParams.requestParams = requestObject;
            const result = await sendTransaction(apiParams);
            expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
            expect(walletStub.rpcStubs.snap_manageState).to.have.been.called;
            expect(result).to.be.eql(sendTransactionResp);
          });

          it('should send a transaction for transferring 10 tokens (token of 10 decimal places) from an unfound user correctly', async function () {
            const requestObject: SendTransactionRequestParams = {
              contractAddress: '0x06a09ccb1caaecf3d9683efe335a667b2169a409d19c589ba1eb771cd210af75',
              contractFuncName: 'transfer',
              contractCallData:
                '0x0256d8f49882cc9366037415f48fa9fd2b5b7344ded7573ebfcef7c90e3e6b75,100000000000000000000,0',
              senderAddress: unfoundUserAddress,
            };
            apiParams.requestParams = requestObject;
            const result = await sendTransaction(apiParams);
            expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
            expect(walletStub.rpcStubs.snap_manageState).to.have.been.called;
            expect(result).to.be.eql(sendTransactionResp);
          });

          it('should throw error if upsertTransaction failed', async function () {
            sandbox.stub(snapUtils, 'upsertTransaction').throws(new Error());
            const requestObject: SendTransactionRequestParams = {
              contractAddress: '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
              contractFuncName: 'transfer',
              contractCallData:
                '0x0256d8f49882cc9366037415f48fa9fd2b5b7344ded7573ebfcef7c90e3e6b75,100000000000000000000,0',
              senderAddress: unfoundUserAddress,
            };
            apiParams.requestParams = requestObject;

            let result;
            try {
              await sendTransaction(apiParams);
            } catch (err) {
              result = err;
            } finally {
              expect(result).to.be.an('Error');
            }
          });
        });

        describe('when account is not deployed', function () {
          beforeEach(async function () {
            sandbox.stub(utils, 'isAccountAddressDeployed').resolves(false);
          });

          it('should send a transaction for transferring 10 tokens and a transaction for deploy correctly', async function () {
            sandbox.stub(utils, 'deployAccount').callsFake(async () => {
              return createAccountProxyResp;
            });
            sandbox.stub(utils, 'getBalance').callsFake(async () => {
              return getBalanceResp[0];
            });
            sandbox.stub(utils, 'estimateAccountDeployFee').callsFake(async () => {
              return estimateDeployFeeResp;
            });
            const requestObject: SendTransactionRequestParams = {
              contractAddress: '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
              contractFuncName: 'transfer',
              contractCallData:
                '0x0256d8f49882cc9366037415f48fa9fd2b5b7344ded7573ebfcef7c90e3e6b75,100000000000000000000,0',
              senderAddress: account1.address,
            };
            apiParams.requestParams = requestObject;
            const result = await sendTransaction(apiParams);
            expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
            expect(walletStub.rpcStubs.snap_manageState).to.have.been.called;
            expect(result).to.be.eql(sendTransactionResp);
          });
        });
      });
    });
  });
});
