import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import * as utils from '../../src/utils/starknetUtils';
import { SnapState } from '../../src/types/snapState';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../src/utils/constants';
import { Mutex } from 'async-mutex';
import {
  ApiParams,
  GetAddrFromStarkNameRequestParam,
} from '../../src/types/snapApi';
import { getAddrFromStarkName } from '../../src/getAddrFromStarkName';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: getAddrFromStarkName', function () {
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

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should retrieve the address from stark name successfully', async function () {
    sandbox.stub(utils, 'getAddrFromStarkNameUtil').callsFake(async () => {
      return '0x01c744953f1d671673f46a9179a58a7e58d9299499b1e076cdb908e7abffe69f';
    });
    const requestObject: GetAddrFromStarkNameRequestParam = {
      starkName: 'testName.stark',
    };
    apiParams.requestParams = requestObject;
    const result = await getAddrFromStarkName(apiParams);
    expect(result).to.be.eq(
      '0x01c744953f1d671673f46a9179a58a7e58d9299499b1e076cdb908e7abffe69f',
    );
  });

  it('should throw error if getAddrFromStarkNameUtil failed', async function () {
    sandbox.stub(utils, 'getAddrFromStarkNameUtil').throws(new Error());
    const requestObject: GetAddrFromStarkNameRequestParam = {
      starkName: 'testName.stark',
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await getAddrFromStarkName(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw error if the stark name is empty', async function () {
    const requestObject: GetAddrFromStarkNameRequestParam = {
      starkName: '',
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await getAddrFromStarkName(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw error if the user address is invalid', async function () {
    const requestObject: GetAddrFromStarkNameRequestParam = {
      starkName: 'invalidName',
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await getAddrFromStarkName(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });
});
