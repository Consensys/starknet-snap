import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import * as utils from '../../src/utils/starknetUtils';
import { STARKNET_TESTNET_NETWORK } from '../../src/utils/constants';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import {
  getTxnFromVoyagerResp1,
  getTxnsFromVoyagerResp,
  getBip44EntropyStub,
  account1,
  account2,
} from '../constants.test';
import { SnapState } from '../../src/types/snapState';
import { Calldata } from 'starknet';

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
      return { result: ['0x795d62a9896b221af17bedd8cceb8d963ac6864857d7476e2f8c03ba0c5df9'] };
    });

    const result = await utils.getSigner(userAddress, STARKNET_TESTNET_NETWORK);
    expect(result).to.be.eq('0x795d62a9896b221af17bedd8cceb8d963ac6864857d7476e2f8c03ba0c5df9');
  });

  it('should get the transactions from Voyager correctly', async function () {
    sandbox.stub(utils, 'getData').callsFake(async () => {
      return getTxnsFromVoyagerResp;
    });

    const result = await utils.getTransactionsFromVoyager(userAddress, 10, 1, STARKNET_TESTNET_NETWORK);
    expect(result).to.be.eql(getTxnsFromVoyagerResp);
  });

  it('should get the transaction from Voyager correctly', async function () {
    sandbox.stub(utils, 'getData').callsFake(async () => {
      return getTxnFromVoyagerResp1;
    });

    const result = await utils.getTransactionFromVoyager(userAddress, STARKNET_TESTNET_NETWORK);
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
    networks: [STARKNET_TESTNET_NETWORK],
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
    const result = await utils.getKeysFromAddress(keyDeriver, STARKNET_TESTNET_NETWORK, state, account1.address, 5);
    expect(result).to.be.eq(getKeysFromAddressIndexResult);
  });

  it('should throw error when address keys not found', async function () {
    let result = null;
    try {
      result = await utils.getKeysFromAddress(keyDeriver, STARKNET_TESTNET_NETWORK, state, account2.address, 5);
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
