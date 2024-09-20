import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import * as utils from '../../src/utils/starknetUtils';
import { estimateAccDeployFee } from '../../src/estimateAccountDeployFee';
import { SnapState } from '../../src/types/snapState';
import {
  STARKNET_MAINNET_NETWORK,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from '../../src/utils/constants';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import {
  estimateDeployFeeResp3,
  estimateDeployFeeResp4,
  getBip44EntropyStub,
} from '../constants.test';
import { Mutex } from 'async-mutex';
import {
  ApiParamsWithKeyDeriver,
  EstimateAccountDeployFeeRequestParams,
} from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: estimateAccountDeployFee', function () {
  const walletStub = new WalletMock();

  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_MAINNET_NETWORK, STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };
  const requestObject: EstimateAccountDeployFeeRequestParams = {
    chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
  };
  let apiParams: ApiParamsWithKeyDeriver;

  beforeEach(async function () {
    walletStub.rpcStubs.snap_getBip44Entropy.callsFake(getBip44EntropyStub);
    apiParams = {
      state,
      requestParams: requestObject,
      wallet: walletStub,
      saveMutex: new Mutex(),
      keyDeriver: await getAddressKeyDeriver(walletStub),
    };
    walletStub.rpcStubs.snap_manageState.resolves(state);
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should estimate the account deploy fee correctly if no addressIndex is given', async function () {
    sandbox.stub(utils, 'estimateAccountDeployFee').callsFake(async () => {
      return estimateDeployFeeResp3;
    });
    const result = await estimateAccDeployFee(apiParams);
    expect(result.suggestedMaxFee).to.be.eq(
      estimateDeployFeeResp3.suggestedMaxFee.toString(10),
    );
  });

  it('should estimate the account deploy fee correctly if addressIndex is given', async function () {
    sandbox.stub(utils, 'estimateAccountDeployFee').callsFake(async () => {
      return estimateDeployFeeResp4;
    });
    apiParams.requestParams = {
      chainId: STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
      addressIndex: 2,
    };
    const result = await estimateAccDeployFee(apiParams);
    expect(result.suggestedMaxFee).to.be.eq(
      estimateDeployFeeResp4.suggestedMaxFee.toString(10),
    );
  });

  it('should throw error if estimateAccountDeployFee failed', async function () {
    sandbox.stub(utils, 'estimateAccountDeployFee').throws(new Error());

    let result;
    try {
      await estimateAccDeployFee(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });
});
