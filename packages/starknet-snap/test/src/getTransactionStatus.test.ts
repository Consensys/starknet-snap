import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import * as utils from '../../src/utils/starknetUtils';
import { getTransactionStatus } from '../../src/getTransactionStatus';
import { SnapState } from '../../src/types/snapState';
import { STARKNET_MAINNET_NETWORK } from '../../src/utils/constants';
import { getTxnStatusResp } from '../constants.test';
import { Mutex } from 'async-mutex';
import {
  ApiParams,
  GetTransactionStatusRequestParams,
} from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: getTransactionStatus', function () {
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_MAINNET_NETWORK],
    transactions: [],
  };
  const apiParams: ApiParams = {
    state,
    requestParams: {},
    wallet: walletStub,
    saveMutex: new Mutex(),
  };

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should get the transaction status correctly', async function () {
    sandbox.stub(utils, 'getTransactionStatus').callsFake(async () => {
      return getTxnStatusResp;
    });
    const requestObject: GetTransactionStatusRequestParams = {
      transactionHash:
        '0x27f204588cadd08a7914f6a9808b34de0cbfc4cb53aa053663e7fd3a34dbc26',
    };
    apiParams.requestParams = requestObject;
    const result = await getTransactionStatus(apiParams);
    expect(result).to.be.eq(getTxnStatusResp);
  });

  it('should throw error if getTransactionStatus failed', async function () {
    sandbox.stub(utils, 'getTransactionStatus').throws(new Error());
    const requestObject: GetTransactionStatusRequestParams = {
      transactionHash:
        '0x27f204588cadd08a7914f6a9808b34de0cbfc4cb53aa053663e7fd3a34dbc26',
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await getTransactionStatus(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });
});
