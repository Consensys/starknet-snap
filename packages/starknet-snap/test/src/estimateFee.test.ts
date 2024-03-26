import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { constants } from 'starknet';
import { Mutex } from 'async-mutex';

import { WalletMock } from '../wallet.mock.test';
import { account2, estimateDeployFeeResp4, estimateFeeResp, getBip44EntropyStub } from '../constants.test';

import * as utils from '../../src/utils/starknetUtils';
import { estimateFee } from '../../src/estimateFee';
import { SnapState } from '../../src/types/snapState';
import { PRICE_UNIT, STARKNET_TESTNET_NETWORK } from '../../src/utils/constants';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import { ApiParams, EstimateFeeRequestParams } from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: estimateFee', function () {
  const setupMock = async () => {
    const walletStub = new WalletMock();
    walletStub.reset();
    walletStub.rpcStubs.snap_getBip44Entropy.callsFake(getBip44EntropyStub);
    const getSignerSpy = sandbox.stub(utils, 'getSigner');
    const estimateFeeSpy = sandbox.stub(utils, 'estimateFeeBulk');
    return {
      walletStub,
      getSignerSpy,
      estimateFeeSpy,
    };
  };

  const setupRequestParams = async (walletStub: WalletMock, requestObject?: EstimateFeeRequestParams) => {
    const state: SnapState = {
      accContracts: [account2],
      erc20Tokens: [],
      networks: [STARKNET_TESTNET_NETWORK],
      transactions: [],
    };

    if (!requestObject) {
      requestObject = {
        contractAddress: '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
        contractFuncName: 'balanceOf',
        contractCallData: '0x7426b2da7a8978e0d472d64f15f984d658226cb55a4fd8aa7689688a7eab37b',
        senderAddress: account2.address,
        priceUnit: PRICE_UNIT.WEI,
      };
    }
    const apiParams: ApiParams = {
      state,
      requestParams: requestObject,
      wallet: walletStub,
      saveMutex: new Mutex(),
      keyDeriver: await getAddressKeyDeriver(walletStub),
    };

    return {
      apiParams,
    };
  };

  afterEach(function () {
    sandbox.restore();
  });

  it('estimates the fee with WEI correctly', async function () {
    const { walletStub, getSignerSpy, estimateFeeSpy } = await setupMock();
    const { apiParams } = await setupRequestParams(walletStub);

    getSignerSpy.resolves(account2.publicKey);
    estimateFeeSpy.resolves([estimateFeeResp]);

    const result = await estimateFee(apiParams);

    expect(estimateFeeSpy).to.have.been.calledWith(
      sinon.match.any,
      account2.address,
      sinon.match.any,
      sinon.match.any,
      { version: constants.TRANSACTION_VERSION.V1 },
    );
    expect(result.suggestedMaxFee).to.be.eq(estimateFeeResp.suggestedMaxFee.toString(10));
    expect(result.unit).to.be.eq(PRICE_UNIT.WEI.toLowerCase());
  });

  it('estimates the fee with FRI correctly', async function () {
    const { walletStub, getSignerSpy, estimateFeeSpy } = await setupMock();
    const { apiParams } = await setupRequestParams(walletStub, {
      contractAddress: '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
      contractFuncName: 'balanceOf',
      contractCallData: '0x7426b2da7a8978e0d472d64f15f984d658226cb55a4fd8aa7689688a7eab37b',
      senderAddress: account2.address,
      priceUnit: PRICE_UNIT.FRI,
    });

    getSignerSpy.resolves(account2.publicKey);
    estimateFeeSpy.resolves([estimateFeeResp]);

    const result = await estimateFee(apiParams);

    expect(estimateFeeSpy).to.have.been.calledWith(
      sinon.match.any,
      account2.address,
      sinon.match.any,
      sinon.match.any,
      { version: constants.TRANSACTION_VERSION.V3 },
    );
    expect(result.suggestedMaxFee).to.be.eq(estimateFeeResp.suggestedMaxFee.toString(10));
    expect(result.unit).to.be.eq(PRICE_UNIT.FRI.toLowerCase());
  });

  it('estimates the fee including deploy txn', async function () {
    const { walletStub, getSignerSpy, estimateFeeSpy } = await setupMock();
    const { apiParams } = await setupRequestParams(walletStub);

    getSignerSpy.rejects(new Error());
    estimateFeeSpy.resolves([estimateDeployFeeResp4, estimateFeeResp]);

    const result = await estimateFee(apiParams);

    expect(result.suggestedMaxFee).to.be.eq(
      (estimateDeployFeeResp4.suggestedMaxFee + estimateFeeResp.suggestedMaxFee).toString(),
    );
  });

  it('throws an error if estimateFee failed', async function () {
    const { walletStub, getSignerSpy, estimateFeeSpy } = await setupMock();
    const { apiParams } = await setupRequestParams(walletStub);

    getSignerSpy.resolves(account2.publicKey);
    estimateFeeSpy.rejects(new Error('some error'));

    let result;
    try {
      await estimateFee(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('throws an error if the function name is undefined', async function () {
    const { walletStub, getSignerSpy } = await setupMock();
    const { apiParams } = await setupRequestParams(walletStub, {
      contractAddress: '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
      contractFuncName: undefined,
      contractCallData: '0x7426b2da7a8978e0d472d64f15f984d658226cb55a4fd8aa7689688a7eab37b',
      senderAddress: account2.address,
    });

    getSignerSpy.resolves(account2.publicKey);

    let result;
    try {
      result = await estimateFee(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('throws an error if the contract address is invalid', async function () {
    const { walletStub, getSignerSpy } = await setupMock();
    const { apiParams } = await setupRequestParams(walletStub, {
      contractAddress: 'wrongAddress',
      contractFuncName: 'balanceOf',
      contractCallData: '0x7426b2da7a8978e0d472d64f15f984d658226cb55a4fd8aa7689688a7eab37b',
      senderAddress: account2.address,
    });

    getSignerSpy.resolves(account2.publicKey);

    let result;
    try {
      result = await estimateFee(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('throws an error if the sender address is invalid', async function () {
    const { walletStub, getSignerSpy } = await setupMock();
    const { apiParams } = await setupRequestParams(walletStub, {
      contractAddress: '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
      contractFuncName: 'balanceOf',
      contractCallData: '0x7426b2da7a8978e0d472d64f15f984d658226cb55a4fd8aa7689688a7eab37b',
      senderAddress: 'wrongAddress',
    });

    getSignerSpy.resolves(account2.publicKey);

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
