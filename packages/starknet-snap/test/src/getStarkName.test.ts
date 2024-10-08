import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { getStarkName } from '../../src/getStarkName';
import * as utils from '../../src/utils/starknetUtils';
import { SnapState } from '../../src/types/snapState';
import { STARKNET_MAINNET_NETWORK } from '../../src/utils/constants';
import { Mutex } from 'async-mutex';
import { ApiParams, GetStarkNameRequestParam } from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: getStarkName', function () {
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

  it('should retrieve the stark name successfully', async function () {
    sandbox.stub(utils, 'getStarkNameUtil').callsFake(async () => {
      return 'testName.stark';
    });
    const requestObject: GetStarkNameRequestParam = {
      userAddress:
        '0x01c744953f1d671673f46a9179a58a7e58d9299499b1e076cdb908e7abffe69f',
    };
    apiParams.requestParams = requestObject;
    const result = await getStarkName(apiParams);
    expect(result).to.be.eq('testName.stark');
  });

  it('should throw error if getStarkNameUtil failed', async function () {
    sandbox.stub(utils, 'getStarkNameUtil').throws(new Error());
    const requestObject: GetStarkNameRequestParam = {
      userAddress:
        '0x01c744953f1d671673f46a9179a58a7e58d9299499b1e076cdb908e7abffe69f',
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await getStarkName(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw error if the user address is empty', async function () {
    const requestObject: GetStarkNameRequestParam = {
      userAddress: '',
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await getStarkName(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw error if the user address is invalid', async function () {
    const requestObject: GetStarkNameRequestParam = {
      userAddress: '0x123456',
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await getStarkName(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });
});
