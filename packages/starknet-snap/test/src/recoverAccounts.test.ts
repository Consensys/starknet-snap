import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import * as utils from '../../src/utils/starknetUtils';
import * as snapUtils from '../../src/utils/snapUtils';
import { SnapState } from '../../src/types/snapState';
import {
  STARKNET_MAINNET_NETWORK,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from '../../src/utils/constants';
import {
  createAccountProxyTxn,
  testnetAccAddresses,
  testnetPublicKeys,
  mainnetPublicKeys,
  mainnetAccAddresses,
  invalidNetwork as INVALID_NETWORK,
  getBip44EntropyStub,
} from '../constants.test';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import { recoverAccounts } from '../../src/recoverAccounts';
import { constants, num } from 'starknet';
import { Mutex } from 'async-mutex';
import {
  ApiParamsWithKeyDeriver,
  RecoverAccountsRequestParams,
} from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: recoverAccounts', function () {
  this.timeout(5000);
  const walletStub = new WalletMock();
  let state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [
      STARKNET_MAINNET_NETWORK,
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      INVALID_NETWORK,
    ],
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

    sandbox.useFakeTimers(createAccountProxyTxn.timestamp);
    walletStub.rpcStubs.snap_manageState.resolves(state);
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
    state = {
      accContracts: [],
      erc20Tokens: [],
      networks: [
        STARKNET_SEPOLIA_TESTNET_NETWORK,
        STARKNET_MAINNET_NETWORK,
        INVALID_NETWORK,
      ],
      transactions: [],
    };
  });

  it('should recover accounts in mainnet correctly', async function () {
    const maxScanned = 5;
    const maxMissed = 3;
    const validPublicKeys = 2;
    const getCorrectContractAddressStub = sandbox.stub(
      utils,
      'getCorrectContractAddress',
    );

    for (let i = 0; i < maxScanned; i++) {
      if (i < validPublicKeys) {
        getCorrectContractAddressStub.onCall(i).resolves({
          address: mainnetAccAddresses[i],
          signerPubKey: mainnetPublicKeys[i],
          upgradeRequired: false,
          deployRequired: false,
        });
      } else {
        getCorrectContractAddressStub.onCall(i).resolves({
          address: mainnetAccAddresses[i],
          signerPubKey: num.toHex(constants.ZERO),
          upgradeRequired: false,
          deployRequired: false,
        });
      }
    }

    const requestObject: RecoverAccountsRequestParams = {
      startScanIndex: 0,
      maxScanned,
      maxMissed,
      chainId: STARKNET_MAINNET_NETWORK.chainId,
    };
    apiParams.requestParams = requestObject;

    const result = await recoverAccounts(apiParams);
    const expectedCalledTimes = validPublicKeys + maxMissed;

    expect(walletStub.rpcStubs.snap_manageState.callCount).to.be.eq(
      expectedCalledTimes * 2,
    );
    expect(result.length).to.be.eq(expectedCalledTimes);
    expect(state.accContracts.map((acc) => acc.address)).to.be.eql(
      mainnetAccAddresses.slice(0, expectedCalledTimes),
    );
    expect(state.accContracts.map((acc) => acc.addressSalt)).to.be.eql(
      mainnetPublicKeys.slice(0, expectedCalledTimes),
    );
    expect(
      state.accContracts
        .filter(
          (acc) => acc.publicKey && acc.publicKey !== num.toHex(constants.ZERO),
        )
        .map((acc) => acc.publicKey),
    ).to.be.eql(mainnetPublicKeys.slice(0, validPublicKeys));
    expect(state.accContracts.length).to.be.eq(expectedCalledTimes);
  });

  it('should recover accounts in SN_SEPOLIA correctly', async function () {
    state.accContracts = [];
    const maxScanned = 5;
    const maxMissed = 3;
    const validPublicKeys = 2;
    const getCorrectContractAddressStub = sandbox.stub(
      utils,
      'getCorrectContractAddress',
    );

    for (let i = 0; i < maxScanned; i++) {
      if (i < validPublicKeys) {
        getCorrectContractAddressStub.onCall(i).resolves({
          address: testnetAccAddresses[i],
          signerPubKey: testnetPublicKeys[i],
          upgradeRequired: false,
          deployRequired: false,
        });
      } else {
        getCorrectContractAddressStub.onCall(i).resolves({
          address: testnetAccAddresses[i],
          signerPubKey: num.toHex(constants.ZERO),
          upgradeRequired: false,
          deployRequired: false,
        });
      }
    }

    const requestObject: RecoverAccountsRequestParams = {
      startScanIndex: 0,
      maxScanned,
      maxMissed,
    };

    apiParams.requestParams = requestObject;
    const result = await recoverAccounts(apiParams);
    const expectedCalledTimes = validPublicKeys + maxMissed;

    expect(walletStub.rpcStubs.snap_manageState.callCount).to.be.eq(
      expectedCalledTimes * 2,
    );
    expect(result.length).to.be.eq(expectedCalledTimes);
    expect(state.accContracts.map((acc) => acc.address)).to.be.eql(
      testnetAccAddresses.slice(0, expectedCalledTimes),
    );
    expect(state.accContracts.map((acc) => acc.addressSalt)).to.be.eql(
      testnetPublicKeys.slice(0, expectedCalledTimes),
    );
    expect(
      state.accContracts
        .filter(
          (acc) => acc.publicKey && acc.publicKey !== num.toHex(constants.ZERO),
        )
        .map((acc) => acc.publicKey),
    ).to.be.eql(testnetPublicKeys.slice(0, validPublicKeys));
    expect(state.accContracts.length).to.be.eq(expectedCalledTimes);
  });

  it('should throw error if getCorrectContractAddress throw error', async function () {
    const maxScanned = 5;
    const maxMissed = 3;
    const getCorrectContractAddressStub = sandbox.stub(
      utils,
      'getCorrectContractAddress',
    );
    getCorrectContractAddressStub.callsFake(async () => {
      throw new Error('network error');
    });
    const isUpgradeRequiredStub = sandbox.stub(utils, 'isUpgradeRequired');
    const requestObject: RecoverAccountsRequestParams = {
      startScanIndex: 0,
      maxScanned,
      maxMissed,
      chainId: STARKNET_MAINNET_NETWORK.chainId,
    };
    apiParams.requestParams = requestObject;

    let result = null;

    try {
      await recoverAccounts(apiParams);
    } catch (e) {
      result = e;
    } finally {
      expect(getCorrectContractAddressStub.callCount).to.be.eq(1);
      expect(isUpgradeRequiredStub.callCount).to.be.eq(0);
      expect(walletStub.rpcStubs.snap_manageState.callCount).to.be.eq(0);
      expect(result).to.be.an('Error');
    }
  });

  it('should throw error if upsertAccount failed', async function () {
    sandbox.stub(snapUtils, 'upsertAccount').throws(new Error());
    const maxScanned = 5;
    const maxMissed = 3;
    const validPublicKeys = 2;
    const getCorrectContractAddressStub = sandbox.stub(
      utils,
      'getCorrectContractAddress',
    );

    for (let i = 0; i < maxScanned; i++) {
      if (i < validPublicKeys) {
        getCorrectContractAddressStub.onCall(i).resolves({
          address: mainnetAccAddresses[i],
          signerPubKey: mainnetPublicKeys[i],
          upgradeRequired: false,
          deployRequired: false,
        });
      } else {
        getCorrectContractAddressStub.onCall(i).resolves({
          address: mainnetAccAddresses[i],
          signerPubKey: num.toHex(constants.ZERO),
          upgradeRequired: false,
          deployRequired: false,
        });
      }
    }

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
