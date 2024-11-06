import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import * as utils from '../../src/utils/starknetUtils';
import { getErc20TokenBalance } from '../../src/getErc20TokenBalance';
import { SnapState } from '../../src/types/snapState';
import {
  BlockIdentifierEnum,
  STARKNET_MAINNET_NETWORK,
} from '../../src/utils/constants';
import { Mutex } from 'async-mutex';
import {
  ApiParams,
  GetErc20TokenBalanceRequestParams,
} from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: getErc20TokenBalance', function () {
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

  it('should get the ERC-20 token balance correctly', async function () {
    const hexAmount = '0x64a'; //1610 in decimal
    sandbox.stub(utils, 'callContract').callsFake(async () => {
      return [hexAmount];
    });
    const requestObject: GetErc20TokenBalanceRequestParams = {
      tokenAddress:
        '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
      userAddress:
        '0x27f204588cadd08a7914f6a9808b34de0cbfc4cb53aa053663e7fd3a34dbc26',
    };
    apiParams.requestParams = requestObject;
    const result = await getErc20TokenBalance(apiParams);
    expect(result).to.be.eql({
      balanceLatest: hexAmount,
      balancePending: hexAmount,
    });
  });

  it('should get ERC-20 token balance with BlockIdentifier pending if the account is deployed', async function () {
    const hexAmount = '0x64a'; //1610 in decimal
    sandbox.stub(utils, 'isAccountDeployed').resolves(true);
    const stub = sandbox.stub(utils, 'getBalance').resolves(hexAmount);
    sandbox.stub(utils, 'callContract').callsFake(async () => {
      return [hexAmount];
    });
    const requestObject: GetErc20TokenBalanceRequestParams = {
      tokenAddress:
        '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
      userAddress:
        '0x27f204588cadd08a7914f6a9808b34de0cbfc4cb53aa053663e7fd3a34dbc26',
    };
    apiParams.requestParams = requestObject;
    const result = await getErc20TokenBalance(apiParams);
    expect(result).to.be.eql({
      balanceLatest: hexAmount,
      balancePending: hexAmount,
    });
    expect(stub).to.have.been.calledWith(
      requestObject.userAddress,
      requestObject.tokenAddress,
      state.networks[0],
      BlockIdentifierEnum.Pending,
    );
  });

  it('should get ERC-20 token balance with BlockIdentifier latest if the account is not deployed', async function () {
    const hexAmount = '0x64a'; //1610 in decimal
    sandbox.stub(utils, 'isAccountDeployed').resolves(false);
    const stub = sandbox.stub(utils, 'getBalance').resolves(hexAmount);
    sandbox.stub(utils, 'callContract').callsFake(async () => {
      return [hexAmount];
    });
    const requestObject: GetErc20TokenBalanceRequestParams = {
      tokenAddress:
        '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
      userAddress:
        '0x27f204588cadd08a7914f6a9808b34de0cbfc4cb53aa053663e7fd3a34dbc26',
    };
    apiParams.requestParams = requestObject;
    const result = await getErc20TokenBalance(apiParams);
    expect(result).to.be.eql({
      balanceLatest: hexAmount,
      balancePending: hexAmount,
    });
    expect(stub).to.have.been.calledWith(
      requestObject.userAddress,
      requestObject.tokenAddress,
      state.networks[0],
      BlockIdentifierEnum.Latest,
    );
  });

  it('should throw error if callContract failed', async function () {
    sandbox.stub(utils, 'callContract').throws(new Error());
    const requestObject: GetErc20TokenBalanceRequestParams = {
      tokenAddress:
        '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
      userAddress:
        '0x27f204588cadd08a7914f6a9808b34de0cbfc4cb53aa053663e7fd3a34dbc26',
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await getErc20TokenBalance(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw error if userAddress is empty', async function () {
    sandbox.stub(utils, 'callContract').callsFake(async () => {
      return ['0x64a']; //1610 in decimal
    });
    const requestObject: GetErc20TokenBalanceRequestParams = {
      tokenAddress:
        '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
      userAddress: '',
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await getErc20TokenBalance(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw error if tokenAddress is empty', async function () {
    sandbox.stub(utils, 'callContract').callsFake(async () => {
      return ['0x64a']; //1610 in decimal
    });
    const requestObject: GetErc20TokenBalanceRequestParams = {
      tokenAddress: '',
      userAddress:
        '0x27f204588cadd08a7914f6a9808b34de0cbfc4cb53aa053663e7fd3a34dbc26',
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await getErc20TokenBalance(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw error if userAddress is invalid', async function () {
    sandbox.stub(utils, 'callContract').callsFake(async () => {
      return ['0x64a']; //1610 in decimal
    });
    const requestObject: GetErc20TokenBalanceRequestParams = {
      tokenAddress:
        '0x07394cbe418daa16e42b87ba67372d4ab4a5df0b05c6e554d158458ce245bc10',
      userAddress: 'wrongAddress',
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await getErc20TokenBalance(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw error if tokenAddress is invalid', async function () {
    sandbox.stub(utils, 'callContract').callsFake(async () => {
      return ['0x64a']; //1610 in decimal
    });
    const requestObject: GetErc20TokenBalanceRequestParams = {
      tokenAddress: 'wrongAddress',
      userAddress:
        '0x27f204588cadd08a7914f6a9808b34de0cbfc4cb53aa053663e7fd3a34dbc26',
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await getErc20TokenBalance(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });
});
