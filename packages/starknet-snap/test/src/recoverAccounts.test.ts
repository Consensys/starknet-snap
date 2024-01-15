import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { SnapState } from '../../src/types/snapState';
import { STARKNET_MAINNET_NETWORK, STARKNET_TESTNET_NETWORK } from '../../src/utils/constants';
import {
  createAccountProxyTxn,
  mainnetPublicKeys,
  mainnetAccAddresses,
  invalidNetwork as INVALID_NETWORK,
  getBip44EntropyStub,
} from '../constants.test';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import { recoverAccounts } from '../../src/recoverAccounts';
import { constants, num } from 'starknet';
import { Mutex } from 'async-mutex';
import { ApiParams, RecoverAccountsRequestParams } from '../../src/types/snapApi';
import { AccountKeyring } from '../../src/services/account';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: recoverAccounts', function () {
  this.timeout(5000);
  const walletStub = new WalletMock();
  let state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_TESTNET_NETWORK, STARKNET_MAINNET_NETWORK, INVALID_NETWORK],
    transactions: [],
  };
  const apiParams: ApiParams = {
    state,
    requestParams: {},
    wallet: walletStub,
    saveMutex: new Mutex(),
  };

  beforeEach(async function () {
    walletStub.rpcStubs.snap_getBip44Entropy.callsFake(getBip44EntropyStub);
    apiParams.keyDeriver = await getAddressKeyDeriver(walletStub);
    sandbox.useFakeTimers(createAccountProxyTxn.timestamp);
    walletStub.rpcStubs.snap_manageState.resolves(state);
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
    state = {
      accContracts: [],
      erc20Tokens: [],
      networks: [STARKNET_TESTNET_NETWORK, STARKNET_MAINNET_NETWORK, INVALID_NETWORK],
      transactions: [],
    };
  });

  it('should recover accounts correctly', async function () {
    const maxScanned = 5;
    const maxMissed = 3;
    const validPublicKeys = 2;
    const keyringStub = sandbox.stub(AccountKeyring.prototype, 'addAccounts');

    const expectedResult = [];
    for (let i = 0; i < maxScanned; i++) {
      if (i < validPublicKeys) {
        expectedResult.push({
          address: mainnetAccAddresses[i],
          signerPubKey: mainnetPublicKeys[i],
          upgradeRequired: false,
        });
      } else {
        expectedResult.push({
          address: mainnetAccAddresses[i],
          signerPubKey: num.toHex(constants.ZERO),
          upgradeRequired: false,
        });
      }
    }
    keyringStub.resolves(expectedResult);

    const requestObject: RecoverAccountsRequestParams = {
      startScanIndex: 0,
      maxScanned,
      maxMissed,
      chainId: STARKNET_MAINNET_NETWORK.chainId,
    };
    apiParams.requestParams = requestObject;

    const result = await recoverAccounts(apiParams);
    const expectedCalledTimes = validPublicKeys + maxMissed;
    expect(result.length).to.be.eq(expectedCalledTimes);
    result.forEach((acc, index) => {
      expect(acc).to.be.contains(expectedResult[index]);
    });
  });

  it('should throw error if recover accounts failed', async function () {
    const maxScanned = 5;
    const maxMissed = 3;
    const keyringStub = sandbox.stub(AccountKeyring.prototype, 'addAccounts');
    keyringStub.throws(new Error('some error'));

    const requestObject: RecoverAccountsRequestParams = {
      startScanIndex: 0,
      maxScanned,
      maxMissed,
      chainId: STARKNET_MAINNET_NETWORK.chainId,
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await recoverAccounts(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });
});
