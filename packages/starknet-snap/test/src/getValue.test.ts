import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { getValue } from '../../src/getValue';
import * as utils from '../../src/utils/starknetUtils';
import { SnapState } from '../../src/types/snapState';
import { STARKNET_MAINNET_NETWORK } from '../../src/utils/constants';
import { Mutex } from 'async-mutex';
import { ApiParams, GetValueRequestParams } from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: getValue', function () {
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

  it('should call the contract correctly', async function () {
    sandbox.stub(utils, 'callContract').callsFake(async () => {
      return ['1'];
    });
    const requestObject: GetValueRequestParams = {
      contractAddress:
        '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
      contractFuncName: 'balanceOf',
      contractCallData:
        '0x7426b2da7a8978e0d472d64f15f984d658226cb55a4fd8aa7689688a7eab37b',
    };
    apiParams.requestParams = requestObject;
    const result = await getValue(apiParams);
    expect(result[0]).to.be.eq('1');
  });

  it('should throw error if callContract failed', async function () {
    sandbox.stub(utils, 'callContract').throws(new Error());
    const requestObject: GetValueRequestParams = {
      contractAddress:
        '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
      contractFuncName: 'balanceOf',
      contractCallData:
        '0x7426b2da7a8978e0d472d64f15f984d658226cb55a4fd8aa7689688a7eab37b',
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await getValue(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw an error if the contract address is invalid', async function () {
    const requestObject: GetValueRequestParams = {
      contractAddress: 'wrongAddress',
      contractFuncName: 'balanceOf',
      contractCallData:
        '0x7426b2da7a8978e0d472d64f15f984d658226cb55a4fd8aa7689688a7eab37b',
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await getValue(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw an error if the function name is undefined', async function () {
    const requestObject: GetValueRequestParams = {
      contractAddress:
        '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
      contractFuncName: undefined as unknown as string,
      contractCallData:
        '0x7426b2da7a8978e0d472d64f15f984d658226cb55a4fd8aa7689688a7eab37b',
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await getValue(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });
});
