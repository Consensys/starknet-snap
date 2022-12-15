import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import * as utils from '../../src/utils/starknetUtils';
import { STARKNET_TESTNET_NETWORK } from '../../src/utils/constants';
import { getTxnFromVoyagerResp1, getTxnsFromVoyagerResp } from '../constants.test';

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
