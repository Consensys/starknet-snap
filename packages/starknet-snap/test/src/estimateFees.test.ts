import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { SnapState } from '../../src/types/snapState';
import { estimateFees } from '../../src/estimateFees';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../src/utils/constants';
import {
  account2,
  estimateDeployFeeResp2,
  estimateDeployFeeResp3,
  getBip44EntropyStub,
} from '../constants.test';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import * as utils from '../../src/utils/starknetUtils';
import { Mutex } from 'async-mutex';
import { ApiParamsWithKeyDeriver } from '../../src/types/snapApi';
import { TransactionType } from 'starknet';
chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: estimateFees', function () {
  this.timeout(5000);
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [account2],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };
  let apiParams: ApiParamsWithKeyDeriver;

  beforeEach(async function () {
    walletStub.rpcStubs.snap_getBip44Entropy.callsFake(getBip44EntropyStub);
    apiParams = {
      state,
      requestParams: {},
      wallet: walletStub,
      saveMutex: new Mutex(),
      keyDeriver: await getAddressKeyDeriver(walletStub),
    };
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should estimate fees correctly', async function () {
    const feeResult = [estimateDeployFeeResp2, estimateDeployFeeResp3];
    sandbox.stub(utils, 'estimateFeeBulk').resolves(feeResult);
    apiParams.requestParams = {
      senderAddress: account2.address,
      chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
      invocations: [
        {
          type: TransactionType.INVOKE,
          payload: {
            entrypoint: 'transfer',
            contractAddress:
              '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
            calldata: [
              '1697416752243704114657612983658108968471303240361660550219082009242042413588',
              '1',
              '0',
            ],
          },
        },
      ],
      invocationsDetails: {
        nonce: '1',
      },
    };
    const expectedResult = feeResult.map((fee) => ({
      overall_fee: fee.overall_fee.toString(10) || '0',
      gas_consumed: fee.gas_consumed.toString(10) || '0',
      gas_price: fee.gas_price.toString(10) || '0',
      suggestedMaxFee: fee.suggestedMaxFee.toString(10) || '0',
    }));

    const result = await estimateFees(apiParams);

    expect(result).to.eql(expectedResult);
  });

  it('should throw error if estimateFee failed', async function () {
    sandbox.stub(utils, 'estimateFeeBulk').throws(new Error());
    apiParams.requestParams = {
      senderAddress: account2.address,
      chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
      invocations: [
        {
          type: TransactionType.INVOKE,
          payload: {
            entrypoint: 'transfer',
            contractAddress:
              '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
            calldata: [
              '1697416752243704114657612983658108968471303240361660550219082009242042413588',
              '1',
              '0',
            ],
          },
        },
      ],
    };

    let result;
    try {
      await estimateFees(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });
});
