import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import * as utils from '../../src/utils/starknetUtils';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../src/utils/constants';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import {
  getTxnFromVoyagerResp1,
  getTxnsFromVoyagerResp,
  getBip44EntropyStub,
  account1,
  account2,
} from '../constants.test';
import { SnapState } from '../../src/types/snapState';
import { Calldata, num } from 'starknet';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: callContract', function () {
  const walletStub = new WalletMock();
  const userAddress = '0x27f204588cadd08a7914f6a9808b34de0cbfc4cb53aa053663e7fd3a34dbc26';

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should get the signer of an user account correctly', async function () {
    sandbox.stub(utils, 'callContract').callsFake(async () => {
      return ['0x795d62a9896b221af17bedd8cceb8d963ac6864857d7476e2f8c03ba0c5df9'];
    });

    const result = await utils.getSigner(userAddress, STARKNET_SEPOLIA_TESTNET_NETWORK);
    expect(result).to.be.eq('0x795d62a9896b221af17bedd8cceb8d963ac6864857d7476e2f8c03ba0c5df9');
  });

  it('should get the transactions from Voyager correctly', async function () {
    sandbox.stub(utils, 'getData').callsFake(async () => {
      return getTxnsFromVoyagerResp;
    });

    const result = await utils.getTransactionsFromVoyager(userAddress, 10, 1, STARKNET_SEPOLIA_TESTNET_NETWORK);
    expect(result).to.be.eql(getTxnsFromVoyagerResp);
  });

  it('should get the transaction from Voyager correctly', async function () {
    sandbox.stub(utils, 'getData').callsFake(async () => {
      return getTxnFromVoyagerResp1;
    });

    const result = await utils.getTransactionFromVoyager(userAddress, STARKNET_SEPOLIA_TESTNET_NETWORK);
    expect(result).to.be.eql(getTxnFromVoyagerResp1);
  });
});

describe('Test function: getKeysFromAddress', function () {
  const walletStub = new WalletMock();
  let keyDeriver = null;
  let getKeysFromAddressIndexResult = null;
  let getAccContractAddressAndCallDataResult = null;
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  beforeEach(async function () {
    walletStub.rpcStubs.snap_getBip44Entropy.callsFake(getBip44EntropyStub);
    keyDeriver = await getAddressKeyDeriver(walletStub);
    walletStub.rpcStubs.snap_dialog.resolves(true);
    walletStub.rpcStubs.snap_manageState.resolves(state);
    getKeysFromAddressIndexResult = {
      privateKey: account1.addressSalt,
      publicKey: account1.publicKey,
      addressIndex: account1.addressIndex,
      derivationPath: keyDeriver.path,
    };
    getAccContractAddressAndCallDataResult = { address: account1.address, callData: [] as Calldata };
    sandbox.stub(utils, 'getKeysFromAddressIndex').callsFake(async () => getKeysFromAddressIndexResult);
    sandbox.stub(utils, 'getAccContractAddressAndCallData').callsFake(() => getAccContractAddressAndCallDataResult);
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should return address keys correctly', async function () {
    const result = await utils.getKeysFromAddress(
      keyDeriver,
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      state,
      account1.address,
      5,
    );
    expect(result).to.be.eq(getKeysFromAddressIndexResult);
  });

  it('should throw error when address keys not found', async function () {
    let result = null;
    try {
      result = await utils.getKeysFromAddress(keyDeriver, STARKNET_SEPOLIA_TESTNET_NETWORK, state, account2.address, 5);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
      expect(result?.message).to.be.eq(`Address not found: ${account2.address}`);
    }
  });
});

describe('Test function: validateAndParseAddress', function () {
  it('should call initial validateAndParseAddress when addresses have proper length', async function () {
    const validateAndParseAddressSpy = sinon.spy(utils, '_validateAndParseAddressFn');
    utils.validateAndParseAddress(account1.address);
    utils.validateAndParseAddress(account1.addressSalt);
    expect(validateAndParseAddressSpy).to.have.been.calledTwice;
    expect(validateAndParseAddressSpy).to.have.been.calledWith(account1.address);
    expect(validateAndParseAddressSpy).to.have.been.calledWith(account1.addressSalt);
  });

  it('should throw an error when addresses has invalid length', async function () {
    const largeHex = '0x3f679957fd2a034d7c32aecb500b62e9d9b4708ebd1383edaa9534fb36b951a665019a';
    expect(() => utils.validateAndParseAddress(largeHex)).to.throw(
      'Address 0x3f679957fd2a034d7c32aecb500b62e9d9b4708ebd1383edaa9534fb36b951a665019a has an invalid length',
    );
  });
});

describe('Test function: getVersion', function () {
  let callContractStub: sinon.SinonStub;
  const expected = '0.3.0';

  beforeEach(function () {
    callContractStub = sandbox.stub(utils, 'callContract').callsFake(async () => ([expected]));
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('should trigger callContract correct', async function () {
    const result = await utils.getVersion(account1.address, STARKNET_SEPOLIA_TESTNET_NETWORK);
    expect(result).to.be.eq(expected);
    expect(callContractStub).to.have.been.calledOnceWith(STARKNET_SEPOLIA_TESTNET_NETWORK, account1.address, 'getVersion');
  });
});

describe('Test function: getOwner', function () {
  let callContractStub: sinon.SinonStub;
  const expected = 'pk';

  beforeEach(function () {
    callContractStub = sandbox.stub(utils, 'callContract').callsFake(async () => ([expected]));
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('should trigger callContract correct', async function () {
    const result = await utils.getOwner(account1.address, STARKNET_SEPOLIA_TESTNET_NETWORK);
    expect(result).to.be.eq(expected);
    expect(callContractStub).to.have.been.calledOnceWith(STARKNET_SEPOLIA_TESTNET_NETWORK, account1.address, 'get_owner');
  });
});

describe('Test function: getBalance', function () {
  let callContractStub: sinon.SinonStub;
  const expected = 'pk';

  beforeEach(function () {
    callContractStub = sandbox.stub(utils, 'callContract').callsFake(async () => ([expected]));
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('should trigger callContract correct', async function () {
    const result = await utils.getBalance(account1.address, account1.address, STARKNET_SEPOLIA_TESTNET_NETWORK);
    expect(result).to.be.eq(expected);
    expect(callContractStub).to.have.been.calledOnceWith(STARKNET_SEPOLIA_TESTNET_NETWORK, account1.address, 'balanceOf', [
      num.toBigInt(account1.address).toString(10),
    ]);
  });
});

describe('Test function: isUpgradeRequired', function () {
  const walletStub = new WalletMock();
  const userAddress = '0x27f204588cadd08a7914f6a9808b34de0cbfc4cb53aa053663e7fd3a34dbc26';

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should return true when upgrade is required', async function () {
    sandbox.stub(utils, 'getVersion').callsFake(async () => '0.2.3');
    const result = await utils.isUpgradeRequired(STARKNET_SEPOLIA_TESTNET_NETWORK, userAddress);
    expect(result).to.be.eq(true);
  });

  it('should return false when upgrade is not required', async function () {
    sandbox.stub(utils, 'getVersion').callsFake(async () => '0.3.0');
    const result = await utils.isUpgradeRequired(STARKNET_SEPOLIA_TESTNET_NETWORK, userAddress);
    expect(result).to.be.eq(false);
  });

  it('should return false when contract is not deployed', async function () {
    sandbox.stub(utils, 'getVersion').callsFake(async () => {
      throw new Error('Contract not found');
    });
    const result = await utils.isUpgradeRequired(STARKNET_SEPOLIA_TESTNET_NETWORK, userAddress);
    expect(result).to.be.eq(false);
  });

  it('should throw err when getVersion is throwing unknown error', async function () {
    sandbox.stub(utils, 'getVersion').callsFake(async () => {
      throw new Error('network error');
    });
    let result = null;
    try {
      await utils.isUpgradeRequired(STARKNET_SEPOLIA_TESTNET_NETWORK, userAddress);
    } catch (e) {
      result = e;
    } finally {
      expect(result).to.be.an('Error');
      expect(result?.message).to.be.eq('network error');
    }
  });
});

describe('Test function: getCorrectContractAddress', function () {
  const walletStub = new WalletMock();
  let getAccContractAddressAndCallDataStub: sinon.SinonStub;
  let getAccContractAddressAndCallDataCairo0Stub: sinon.SinonStub;
  let getOwnerStub: sinon.SinonStub;
  let getSignerStub: sinon.SinonStub;
  const PK = 'pk';

  beforeEach(function () {
    getAccContractAddressAndCallDataStub = sandbox
      .stub(utils, 'getAccContractAddressAndCallData')
      .callsFake(() => ({ address: account1.address, callData: [] as Calldata }));
    getAccContractAddressAndCallDataCairo0Stub = sandbox
      .stub(utils, 'getAccContractAddressAndCallDataCairo0')
      .callsFake(() => ({ address: account2.address, callData: [] as Calldata }));
    getOwnerStub = sandbox.stub(utils, 'getOwner').callsFake(async () => PK);
    getSignerStub = sandbox.stub(utils, 'getSigner').callsFake(async () => PK);
  });
  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should permutation both Cairo0 and Cario1 address', async function () {
    await utils.getCorrectContractAddress(STARKNET_SEPOLIA_TESTNET_NETWORK, PK);
    expect(getAccContractAddressAndCallDataStub).to.have.been.calledOnceWith(
      STARKNET_SEPOLIA_TESTNET_NETWORK.accountClassHash,
      PK,
    );
    expect(getAccContractAddressAndCallDataCairo0Stub).to.have.been.calledOnceWith(
      STARKNET_SEPOLIA_TESTNET_NETWORK.accountClassHashV0,
      PK,
    );
  });

  it('should return Cairo1 address with pubic key when Cario1 deployed', async function () {
    const result = await utils.getCorrectContractAddress(STARKNET_SEPOLIA_TESTNET_NETWORK, PK);
    expect(getOwnerStub).to.have.been.calledOnceWith(account1.address, STARKNET_SEPOLIA_TESTNET_NETWORK);
    expect(getSignerStub).to.have.been.callCount(0);
    expect(result.address).to.be.eq(account1.address);
    expect(result.signerPubKey).to.be.eq(PK);
  });

  it('should return Cairo0 address with pubic key when Cario1 not deployed', async function () {
    sandbox.restore();
    getAccContractAddressAndCallDataStub = sandbox
      .stub(utils, 'getAccContractAddressAndCallData')
      .callsFake(() => ({ address: account1.address, callData: [] as Calldata }));
    getAccContractAddressAndCallDataCairo0Stub = sandbox
      .stub(utils, 'getAccContractAddressAndCallDataCairo0')
      .callsFake(() => ({ address: account2.address, callData: [] as Calldata }));
    getSignerStub = sandbox.stub(utils, 'getSigner').callsFake(async () => PK);
    getOwnerStub = sandbox.stub(utils, 'getOwner').callsFake(async () => {
      throw new Error('Contract not found');
    });

    const result = await utils.getCorrectContractAddress(STARKNET_SEPOLIA_TESTNET_NETWORK, PK);
    expect(getOwnerStub).to.have.been.calledOnceWith(account1.address, STARKNET_SEPOLIA_TESTNET_NETWORK);
    expect(getSignerStub).to.have.been.calledOnceWith(account2.address, STARKNET_SEPOLIA_TESTNET_NETWORK);
    expect(result.address).to.be.eq(account2.address);
    expect(result.signerPubKey).to.be.eq(PK);
  });

  it('should return Cairo1 address with no pubic key when Cario1 and Cario0 not deployed', async function () {
    sandbox.restore();
    getAccContractAddressAndCallDataStub = sandbox
      .stub(utils, 'getAccContractAddressAndCallData')
      .callsFake(() => ({ address: account1.address, callData: [] as Calldata }));
    getAccContractAddressAndCallDataCairo0Stub = sandbox
      .stub(utils, 'getAccContractAddressAndCallDataCairo0')
      .callsFake(() => ({ address: account2.address, callData: [] as Calldata }));
    getSignerStub = sandbox.stub(utils, 'getSigner').callsFake(async () => {
      throw new Error('Contract not found');
    });
    getOwnerStub = sandbox.stub(utils, 'getOwner').callsFake(async () => {
      throw new Error('Contract not found');
    });

    const result = await utils.getCorrectContractAddress(STARKNET_SEPOLIA_TESTNET_NETWORK, PK);
    expect(getOwnerStub).to.have.been.calledOnceWith(account1.address, STARKNET_SEPOLIA_TESTNET_NETWORK);
    expect(getSignerStub).to.have.been.calledOnceWith(account2.address, STARKNET_SEPOLIA_TESTNET_NETWORK);
    expect(result.address).to.be.eq(account1.address);
    expect(result.signerPubKey).to.be.eq('');
  });

  it('should throw error when getOwner is throwing unknown error', async function () {
    sandbox.restore();
    getAccContractAddressAndCallDataStub = sandbox
      .stub(utils, 'getAccContractAddressAndCallData')
      .callsFake(() => ({ address: account1.address, callData: [] as Calldata }));
    getAccContractAddressAndCallDataCairo0Stub = sandbox
      .stub(utils, 'getAccContractAddressAndCallDataCairo0')
      .callsFake(() => ({ address: account2.address, callData: [] as Calldata }));
    getSignerStub = sandbox.stub(utils, 'getSigner').callsFake(async () => {
      throw new Error('network error for getSigner');
    });
    getOwnerStub = sandbox.stub(utils, 'getOwner').callsFake(async () => {
      throw new Error('network error for getOwner');
    });
    let result = null;
    try {
      await utils.getCorrectContractAddress(STARKNET_SEPOLIA_TESTNET_NETWORK, PK);
    } catch (e) {
      result = e;
    } finally {
      expect(getOwnerStub).to.have.been.calledOnceWith(account1.address, STARKNET_SEPOLIA_TESTNET_NETWORK);
      expect(getSignerStub).to.have.been.callCount(0);
      expect(result).to.be.an('Error');
      expect(result?.message).to.be.eq('network error for getOwner');
    }
  });

  it('should throw error when getSigner is throwing unknown error', async function () {
    sandbox.restore();
    getAccContractAddressAndCallDataStub = sandbox
      .stub(utils, 'getAccContractAddressAndCallData')
      .callsFake(() => ({ address: account1.address, callData: [] as Calldata }));
    getAccContractAddressAndCallDataCairo0Stub = sandbox
      .stub(utils, 'getAccContractAddressAndCallDataCairo0')
      .callsFake(() => ({ address: account2.address, callData: [] as Calldata }));
    getSignerStub = sandbox.stub(utils, 'getSigner').callsFake(async () => {
      throw new Error('network error for getSigner');
    });
    getOwnerStub = sandbox.stub(utils, 'getOwner').callsFake(async () => {
      throw new Error('Contract not found');
    });

    let result = null;
    try {
      await utils.getCorrectContractAddress(STARKNET_SEPOLIA_TESTNET_NETWORK, PK);
    } catch (e) {
      result = e;
    } finally {
      expect(getOwnerStub).to.have.been.calledOnceWith(account1.address, STARKNET_SEPOLIA_TESTNET_NETWORK);
      expect(getSignerStub).to.have.been.calledOnceWith(account2.address, STARKNET_SEPOLIA_TESTNET_NETWORK);
      expect(result).to.be.an('Error');
      expect(result?.message).to.be.eq('network error for getSigner');
    }
  });
});
