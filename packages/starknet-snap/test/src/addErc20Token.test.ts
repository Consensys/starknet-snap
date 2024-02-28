import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { addErc20Token } from '../../src/addErc20Token';
import { SnapState } from '../../src/types/snapState';
import * as snapUtils from '../../src/utils/snapUtils';
import {
  DEFAULT_DECIMAL_PLACES,
  STARKNET_TESTNET_NETWORK,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from '../../src/utils/constants';
import { Mutex } from 'async-mutex';
import { AddErc20TokenRequestParams, ApiParams } from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: addErc20Token', function () {
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_TESTNET_NETWORK, STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };
  const apiParams: ApiParams = {
    state,
    requestParams: {},
    wallet: walletStub,
    saveMutex: new Mutex(),
  };

  beforeEach(function () {
    walletStub.rpcStubs.snap_manageState.resolves(state);
    walletStub.rpcStubs.snap_dialog.resolves(true);
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should reject to add the ERC-20 token when deline in dialog', async function () {
    walletStub.rpcStubs.snap_dialog.resolves(false);
    const requestObject: AddErc20TokenRequestParams = {
      tokenAddress: '0x244c20d51109adcf604fde1bbf878e5dcd549b3877ac87911ec6a158bd7aa62',
      tokenName: 'Starknet ERC-20 sample',
      tokenSymbol: 'SNET',
      tokenDecimals: 18,
    };
    apiParams.requestParams = requestObject;
    await addErc20Token(apiParams);
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
    expect(state.erc20Tokens.length).to.be.eq(0);
  });

  it('should add the ERC-20 token in SN_GOERLI correctly', async function () {
    const requestObject: AddErc20TokenRequestParams = {
      tokenAddress: '0x244c20d51109adcf604fde1bbf878e5dcd549b3877ac87911ec6a158bd7aa62',
      tokenName: 'Starknet ERC-20 sample',
      tokenSymbol: 'SNET',
      tokenDecimals: 18,
    };
    apiParams.requestParams = requestObject;
    await addErc20Token(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).to.have.been.calledTwice;
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
    expect(state.erc20Tokens.length).to.be.eq(1);
    expect(state.erc20Tokens[0].symbol).to.be.eq(requestObject.tokenSymbol);
  });

  it('should add the ERC-20 token (with undefined tokenDecimals) in SN_GOERLI with default token decimal places correctly', async function () {
    const requestObject: AddErc20TokenRequestParams = {
      tokenAddress: '0x244c20d51109adcf604fde1bbf878e5dcd549b3877ac87911ec6a158bd7bb99',
      tokenName: 'Starknet ERC-20 sample 2',
      tokenSymbol: 'SNET',
    };
    apiParams.requestParams = requestObject;
    await addErc20Token(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).to.have.been.calledTwice;
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
    expect(state.erc20Tokens.length).to.be.eq(2);
    expect(state.erc20Tokens[1].decimals).to.be.eq(DEFAULT_DECIMAL_PLACES);
  });

  it('should add the ERC-20 token (with empty string tokenDecimals) in SN_GOERLI with default token decimal places correctly', async function () {
    const requestObject: AddErc20TokenRequestParams = {
      tokenAddress: '0x244c20d51109adcf604fde1bbf878e5dcd549b3877ac87911ec6a158bd7cc99',
      tokenName: 'Starknet ERC-20 sample 2',
      tokenSymbol: 'SNET',
      tokenDecimals: '',
    };
    apiParams.requestParams = requestObject;
    await addErc20Token(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).to.have.been.calledTwice;
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
    expect(state.erc20Tokens.length).to.be.eq(3);
    expect(state.erc20Tokens[1].decimals).to.be.eq(DEFAULT_DECIMAL_PLACES);
  });

  it('should update the ERC-20 token in SN_GOERLI correctly', async function () {
    const requestObject: AddErc20TokenRequestParams = {
      tokenAddress: '0x244c20d51109adcf604fde1bbf878e5dcd549b3877ac87911ec6a158bd7aa62',
      tokenName: 'Starknet ERC-20 sample',
      tokenSymbol: 'SNET-2',
      tokenDecimals: 18,
    };
    apiParams.requestParams = requestObject;
    await addErc20Token(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).to.have.been.calledTwice;
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
    expect(state.erc20Tokens.length).to.be.eq(3);
    expect(state.erc20Tokens[0].symbol).to.be.eq(requestObject.tokenSymbol);
  });

  it('should not update snap state with the duplicated ERC-20 token in SN_GOERLI', async function () {
    const requestObject: AddErc20TokenRequestParams = {
      tokenAddress: '0x244c20d51109adcf604fde1bbf878e5dcd549b3877ac87911ec6a158bd7aa62',
      tokenName: 'Starknet ERC-20 sample',
      tokenSymbol: 'SNET-2',
      tokenDecimals: 18,
    };
    apiParams.requestParams = requestObject;
    await addErc20Token(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).to.have.been.calledOnce;
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
    expect(state.erc20Tokens.length).to.be.eq(3);
    expect(state.erc20Tokens[0].symbol).to.be.eq(requestObject.tokenSymbol);
  });

  it('should throw error if upsertErc20Token failed', async function () {
    sandbox.stub(snapUtils, 'upsertErc20Token').throws(new Error());
    const requestObject: AddErc20TokenRequestParams = {
      tokenAddress: '0x244c20d51109adcf604fde1bbf878e5dcd549b3877ac87911ec6a158bd7aa62',
      tokenName: 'Starknet ERC-20 sample',
      tokenSymbol: 'SNET',
      tokenDecimals: 18,
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await addErc20Token(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw error if tokenAddress is invalid', async function () {
    const requestObject: AddErc20TokenRequestParams = {
      tokenAddress: '0x244c20d51109adcf604fde1bbf878e5dcd549b3877ac87911ec6a158bd7aaXX',
      tokenName: 'Starknet ERC-20 sample',
      tokenSymbol: 'SNET',
      tokenDecimals: 18,
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await addErc20Token(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw error if tokenName is empty', async function () {
    const requestObject: AddErc20TokenRequestParams = {
      tokenAddress: '0x244c20d51109adcf604fde1bbf878e5dcd549b3877ac87911ec6a158bd7aa62',
      tokenName: '',
      tokenSymbol: 'SNET',
      tokenDecimals: 18,
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await addErc20Token(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw error if tokenSymbol is empty', async function () {
    const requestObject: AddErc20TokenRequestParams = {
      tokenAddress: '0x244c20d51109adcf604fde1bbf878e5dcd549b3877ac87911ec6a158bd7aa62',
      tokenName: 'Starknet ERC-20 sample',
      tokenSymbol: '',
      tokenDecimals: 18,
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await addErc20Token(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw error if tokenName is in non-ASCII character', async function () {
    const requestObject: AddErc20TokenRequestParams = {
      tokenAddress: '0x244c20d51109adcf604fde1bbf878e5dcd549b3877ac87911ec6a158bd7aa62',
      tokenName: 'Starknet ERC-20 sample for аррӏе',
      tokenSymbol: 'SNET',
      tokenDecimals: 18,
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await addErc20Token(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw error if tokenName is in longer than 64 characters', async function () {
    const requestObject: AddErc20TokenRequestParams = {
      tokenAddress: '0x244c20d51109adcf604fde1bbf878e5dcd549b3877ac87911ec6a158bd7aa62',
      tokenName: 'Starknet ERC-20 sample for xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      tokenSymbol: 'SNET',
      tokenDecimals: 18,
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await addErc20Token(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw error if tokenName is an all spaces string', async function () {
    const requestObject: AddErc20TokenRequestParams = {
      tokenAddress: '0x244c20d51109adcf604fde1bbf878e5dcd549b3877ac87911ec6a158bd7aa62',
      tokenName: '              ',
      tokenSymbol: 'SNET',
      tokenDecimals: 18,
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await addErc20Token(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw error if tokenSymbol is in non-ASCII character', async function () {
    const requestObject: AddErc20TokenRequestParams = {
      tokenAddress: '0x244c20d51109adcf604fde1bbf878e5dcd549b3877ac87911ec6a158bd7aa62',
      tokenName: 'Starknet ERC-20 sample',
      tokenSymbol: 'аррӏе',
      tokenDecimals: 18,
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await addErc20Token(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw error if tokenSymbol is in longer than 16 characters', async function () {
    const requestObject: AddErc20TokenRequestParams = {
      tokenAddress: '0x244c20d51109adcf604fde1bbf878e5dcd549b3877ac87911ec6a158bd7aa62',
      tokenName: 'Starknet ERC-20 sample',
      tokenSymbol: 'SNETXXXXXXXXXXXXXXXXX',
      tokenDecimals: 18,
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await addErc20Token(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw error if tokenSymbol is an all-spaces string', async function () {
    const requestObject: AddErc20TokenRequestParams = {
      tokenAddress: '0x244c20d51109adcf604fde1bbf878e5dcd549b3877ac87911ec6a158bd7aa62',
      tokenName: 'Starknet ERC-20 sample',
      tokenSymbol: '    ',
      tokenDecimals: 18,
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await addErc20Token(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw error if tokenAddress is one of the preload token addresses', async function () {
    const requestObject: AddErc20TokenRequestParams = {
      tokenAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      tokenName: 'Starknet ERC-20 sample',
      tokenSymbol: 'SNET',
      tokenDecimals: 18,
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await addErc20Token(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw error if tokenName is one of the preload token names', async function () {
    const requestObject: AddErc20TokenRequestParams = {
      tokenAddress: '0x244c20d51109adcf604fde1bbf878e5dcd549b3877ac87911ec6a158bd7aa62',
      tokenName: 'Ether',
      tokenSymbol: 'SNET',
      tokenDecimals: 18,
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await addErc20Token(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw error if tokenSymbol is one of the preload token symbols', async function () {
    const requestObject: AddErc20TokenRequestParams = {
      tokenAddress: '0x244c20d51109adcf604fde1bbf878e5dcd549b3877ac87911ec6a158bd7aa62',
      tokenName: 'Starknet ERC-20 sample',
      tokenSymbol: 'ETH',
      tokenDecimals: 18,
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await addErc20Token(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });
});
