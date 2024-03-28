import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import * as utils from '../../src/utils/starknetUtils';
import { estimateFee } from '../../src/estimateFee';
import { SnapState } from '../../src/types/snapState';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../src/utils/constants';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import {
  account2,
  estimateDeployFeeResp4,
  estimateFeeResp,
  estimateFeeResp2,
  getBip44EntropyStub,
  getBalanceResp,
} from '../constants.test';
import { Mutex } from 'async-mutex';
import { ApiParams, EstimateFeeRequestParams } from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: estimateFee', function () {
  const walletStub = new WalletMock();

  const state: SnapState = {
    accContracts: [account2],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };
  const requestObject: EstimateFeeRequestParams = {
    contractAddress: '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
    contractFuncName: 'balanceOf',
    contractCallData: '0x7426b2da7a8978e0d472d64f15f984d658226cb55a4fd8aa7689688a7eab37b',
    senderAddress: account2.address,
  };
  const apiParams: ApiParams = {
    state,
    requestParams: requestObject,
    wallet: walletStub,
    saveMutex: new Mutex(),
  };

  beforeEach(async function () {
    walletStub.rpcStubs.snap_getBip44Entropy.callsFake(getBip44EntropyStub);
    apiParams.keyDeriver = await getAddressKeyDeriver(walletStub);
    sandbox.stub(utils, 'callContract').resolves(getBalanceResp);
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should estimate the fee correctly', async function () {
    sandbox.stub(utils, 'getSigner').callsFake(async () => {
      return account2.publicKey;
    });
    sandbox.stub(utils, 'estimateFee').callsFake(async () => {
      return estimateFeeResp;
    });
    // The following will be commented out later when starknet.js
    // supports estimateFeeBulk in rpc mode
    // sandbox.stub(utils, 'estimateFeeBulk').callsFake(async () => {
    //   return [estimateFeeResp];
    // });
    const result = await estimateFee(apiParams);
    expect(result.suggestedMaxFee).to.be.eq(estimateFeeResp.suggestedMaxFee.toString(10));
  });

  it('should estimate the fee including deploy txn correctly', async function () {
    sandbox.stub(utils, 'getSigner').throws(new Error());
    sandbox.stub(utils, 'estimateFeeBulk').callsFake(async () => {
      return [estimateDeployFeeResp4, estimateFeeResp];
    });
    const expectedSuggestedMaxFee = estimateDeployFeeResp4.suggestedMaxFee + estimateFeeResp.suggestedMaxFee;
    const result = await estimateFee(apiParams);
    expect(result.suggestedMaxFee).to.be.eq(expectedSuggestedMaxFee.toString(10));
  });

  it('should estimate the fee without gas consumed and gas price correctly', async function () {
    sandbox.stub(utils, 'getSigner').callsFake(async () => {
      return account2.publicKey;
    });
    sandbox.stub(utils, 'estimateFee').callsFake(async () => {
      return estimateFeeResp2;
    });
    // The following will be commented out later when starknet.js
    // supports estimateFeeBulk in rpc mode
    // sandbox.stub(utils, 'estimateFeeBulk').callsFake(async () => {
    //   return [estimateFeeResp2];
    // });
    const result = await estimateFee(apiParams);
    expect(result.suggestedMaxFee).to.be.eq(estimateFeeResp.suggestedMaxFee.toString(10));
  });

  it('should throw error if estimateFee failed', async function () {
    sandbox.stub(utils, 'getSigner').callsFake(async () => {
      return account2.publicKey;
    });
    sandbox.stub(utils, 'estimateFee').throws(new Error());
    apiParams.requestParams = requestObject;

    let result;
    try {
      await estimateFee(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw an error if the function name is undefined', async function () {
    sandbox.stub(utils, 'getSigner').callsFake(async () => {
      return account2.publicKey;
    });
    apiParams.requestParams = {
      contractAddress: '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
      contractFuncName: undefined,
      contractCallData: '0x7426b2da7a8978e0d472d64f15f984d658226cb55a4fd8aa7689688a7eab37b',
      senderAddress: account2.address,
    };
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
    sandbox.stub(utils, 'getSigner').callsFake(async () => {
      return account2.publicKey;
    });
    apiParams.requestParams = {
      contractAddress: 'wrongAddress',
      contractFuncName: 'balanceOf',
      contractCallData: '0x7426b2da7a8978e0d472d64f15f984d658226cb55a4fd8aa7689688a7eab37b',
      senderAddress: account2.address,
    };
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
    sandbox.stub(utils, 'getSigner').callsFake(async () => {
      return account2.publicKey;
    });
    apiParams.requestParams = {
      contractAddress: '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
      contractFuncName: 'balanceOf',
      contractCallData: '0x7426b2da7a8978e0d472d64f15f984d658226cb55a4fd8aa7689688a7eab37b',
      senderAddress: 'wrongAddress',
    };
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
