import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import * as utils from '../../src/utils/starknetUtils';
import {
  STARKNET_SEPOLIA_TESTNET_NETWORK,
  CAIRO_VERSION,
  CAIRO_VERSION_LEGACY,
} from '../../src/utils/constants';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import {
  getTxnFromVoyagerResp1,
  getTxnsFromVoyagerResp,
  getBip44EntropyStub,
  account1,
  account2,
  account3,
  getBalanceResp,
} from '../constants.test';
import { SnapState } from '../../src/types/snapState';
import {
  Calldata,
  num,
  Account,
  Provider,
  GetTransactionReceiptResponse,
} from 'starknet';
import { hexToString } from '../../src/utils/formatter-utils';
import { BIP44AddressKeyDeriver } from '@metamask/key-tree';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: getAccountInstance', function () {
  const provider = {} as Provider;

  beforeEach(function () {
    sandbox.stub(utils, 'getProvider').returns(provider);
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('should return account instance with default cairo version', async function () {
    const result = await utils.getAccountInstance(
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      account1.address,
      account1.publicKey,
    );
    expect(result).to.be.instanceOf(Account);
    expect(result.cairoVersion).to.equal(CAIRO_VERSION);
  });

  it('should return account instance with provided cairo version', async function () {
    const result = await utils.getAccountInstance(
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      account1.address,
      account1.publicKey,
      CAIRO_VERSION_LEGACY,
    );
    expect(result).to.be.instanceOf(Account);
    expect(result.cairoVersion).to.equal(CAIRO_VERSION_LEGACY);
  });
});

describe('Test function: findAddressIndex', function () {
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  beforeEach(function () {
    sandbox.stub(utils, 'getKeysFromAddressIndex').resolves({
      privateKey: 'pk',
      publicKey: 'pubkey',
      addressIndex: 1,
      derivationPath: `m / bip32:1' / bip32:1' / bip32:1' / bip32:1'`,
    });
    sandbox.stub(utils, 'getPermutationAddresses').returns({
      address: account1.address,
      addressLegacy: account2.address,
    });
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('should find address index', async function () {
    const result = await utils.findAddressIndex(
      STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
      account1.address,
      'div',
      state,
      1,
    );
    expect(result).to.be.contains({
      index: 0,
      cairoVersion: 1,
    });
  });

  it('should find address index address match account legacy', async function () {
    const result = await utils.findAddressIndex(
      STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
      account2.address,
      'div',
      state,
      1,
    );
    expect(result).to.be.contains({
      index: 0,
      cairoVersion: 0,
    });
  });

  it('should throw error if address not found', async function () {
    let result;
    try {
      result = await utils.findAddressIndex(
        STARKNET_SEPOLIA_TESTNET_NETWORK.chainId,
        account3.address,
        'div',
        state,
        1,
      );
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
      expect(result?.message).to.be.eq(
        `Address not found: ${account3.address}`,
      );
    }
  });
});

describe('Test function: callContract', function () {
  const walletStub = new WalletMock();
  const userAddress =
    '0x27f204588cadd08a7914f6a9808b34de0cbfc4cb53aa053663e7fd3a34dbc26';

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should get the signer of an user account correctly', async function () {
    sandbox.stub(utils, 'callContract').callsFake(async () => {
      return [
        '0x795d62a9896b221af17bedd8cceb8d963ac6864857d7476e2f8c03ba0c5df9',
      ];
    });

    const result = await utils.getSigner(
      userAddress,
      STARKNET_SEPOLIA_TESTNET_NETWORK,
    );
    expect(result).to.be.eq(
      '0x795d62a9896b221af17bedd8cceb8d963ac6864857d7476e2f8c03ba0c5df9',
    );
  });
});

describe('Test function: getKeysFromAddress', function () {
  const walletStub = new WalletMock();
  let keyDeriver: BIP44AddressKeyDeriver;
  let getKeysFromAddressIndexResult;
  let getAccContractAddressAndCallDataResult;
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
    getAccContractAddressAndCallDataResult = {
      address: account1.address,
      callData: [] as Calldata,
    };
    sandbox
      .stub(utils, 'getKeysFromAddressIndex')
      .callsFake(async () => getKeysFromAddressIndexResult);
    sandbox
      .stub(utils, 'getAccContractAddressAndCallData')
      .callsFake(() => getAccContractAddressAndCallDataResult);
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
    let result;
    try {
      result = await utils.getKeysFromAddress(
        keyDeriver,
        STARKNET_SEPOLIA_TESTNET_NETWORK,
        state,
        account2.address,
        5,
      );
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
      expect(result?.message).to.be.eq(
        `Address not found: ${account2.address}`,
      );
    }
  });
});

describe('Test function: validateAndParseAddress', function () {
  it('should call initial validateAndParseAddress when addresses have proper length', async function () {
    const validateAndParseAddressSpy = sinon.spy(
      utils,
      '_validateAndParseAddressFn',
    );
    utils.validateAndParseAddress(account1.address);
    utils.validateAndParseAddress(account1.addressSalt);
    expect(validateAndParseAddressSpy).to.have.been.calledTwice;
    expect(validateAndParseAddressSpy).to.have.been.calledWith(
      account1.address,
    );
    expect(validateAndParseAddressSpy).to.have.been.calledWith(
      account1.addressSalt,
    );
  });

  it('should throw an error when addresses has invalid length', async function () {
    const largeHex =
      '0x3f679957fd2a034d7c32aecb500b62e9d9b4708ebd1383edaa9534fb36b951a665019a';
    expect(() => utils.validateAndParseAddress(largeHex)).to.throw(
      'Address 0x3f679957fd2a034d7c32aecb500b62e9d9b4708ebd1383edaa9534fb36b951a665019a has an invalid length',
    );
  });
});

describe('Test function: getPermutationAddresses', function () {
  let getAccContractAddressAndCallDataStub: sinon.SinonStub;
  let getAccContractAddressAndCallDataLegacy: sinon.SinonStub;
  const PK = 'PK';

  beforeEach(function () {
    getAccContractAddressAndCallDataStub = sandbox
      .stub(utils, 'getAccContractAddressAndCallData')
      .returns({ address: account1.address, callData: [] as Calldata });
    getAccContractAddressAndCallDataLegacy = sandbox
      .stub(utils, 'getAccContractAddressAndCallDataLegacy')
      .returns({ address: account2.address, callData: [] as Calldata });
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('should return all addresses', async function () {
    const result = await utils.getPermutationAddresses(PK);
    expect(result).to.be.contains({
      address: account1.address,
      addressLegacy: account2.address,
    });
    expect(getAccContractAddressAndCallDataStub).to.have.been.calledOnceWith(
      PK,
    );
    expect(getAccContractAddressAndCallDataLegacy).to.have.been.calledOnceWith(
      PK,
    );
  });
});

describe('Test function: getVersion', function () {
  let callContractStub: sinon.SinonStub;
  const expected = '0.3.0';

  beforeEach(function () {
    callContractStub = sandbox
      .stub(utils, 'callContract')
      .callsFake(async () => [expected]);
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('should trigger callContract correct', async function () {
    const result = await utils.getVersion(
      account1.address,
      STARKNET_SEPOLIA_TESTNET_NETWORK,
    );
    expect(result).to.be.eq(expected);
    expect(callContractStub).to.have.been.calledOnceWith(
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      account1.address,
      'getVersion',
    );
  });
});

describe('Test function: getOwner', function () {
  let callContractStub: sinon.SinonStub;
  const expected = 'pk';

  beforeEach(function () {
    callContractStub = sandbox
      .stub(utils, 'callContract')
      .callsFake(async () => [expected]);
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('should trigger callContract correct', async function () {
    const result = await utils.getOwner(
      account1.address,
      STARKNET_SEPOLIA_TESTNET_NETWORK,
    );
    expect(result).to.be.eq(expected);
    expect(callContractStub).to.have.been.calledOnceWith(
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      account1.address,
      'get_owner',
    );
  });
});

describe('Test function: getBalance', function () {
  let callContractStub: sinon.SinonStub;
  const expected = 'pk';

  beforeEach(function () {
    callContractStub = sandbox
      .stub(utils, 'callContract')
      .callsFake(async () => [expected]);
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('should trigger callContract correct', async function () {
    const result = await utils.getBalance(
      account1.address,
      account1.address,
      STARKNET_SEPOLIA_TESTNET_NETWORK,
    );
    expect(result).to.be.eq(expected);
    expect(callContractStub).to.have.been.calledOnceWith(
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      account1.address,
      'balanceOf',
      [num.toBigInt(account1.address).toString(10)],
    );
  });
});

describe('Test function: isUpgradeRequired', function () {
  const walletStub = new WalletMock();
  const userAddress =
    '0x27f204588cadd08a7914f6a9808b34de0cbfc4cb53aa053663e7fd3a34dbc26';

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should return true when upgrade is required', async function () {
    sandbox.stub(utils, 'getVersion').callsFake(async () => '0x302e322e33');
    const result = await utils.isUpgradeRequired(
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      userAddress,
    );
    expect(result).to.be.eq(true);
  });

  it('should return false when upgrade is not required', async function () {
    sandbox.stub(utils, 'getVersion').callsFake(async () => '0x302e332e30');
    const result = await utils.isUpgradeRequired(
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      userAddress,
    );
    expect(result).to.be.eq(false);
  });

  it('should return false when contract is not deployed', async function () {
    sandbox.stub(utils, 'getVersion').callsFake(async () => {
      throw new Error('Contract not found');
    });
    const result = await utils.isUpgradeRequired(
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      userAddress,
    );
    expect(result).to.be.eq(false);
  });

  it('should throw err when getVersion is throwing unknown error', async function () {
    sandbox.stub(utils, 'getVersion').callsFake(async () => {
      throw new Error('network error');
    });
    let result = null;
    try {
      await utils.isUpgradeRequired(
        STARKNET_SEPOLIA_TESTNET_NETWORK,
        userAddress,
      );
    } catch (e) {
      result = e;
    } finally {
      expect(result).to.be.an('Error');
    }
  });
});

describe('Test function: isGTEMinVersion', function () {
  const cairoVersionHex = '0x302e332e30';
  const cairoVersionLegacyHex = '302e322e30a';

  it(`should return true when version greater than or equal to min version`, function () {
    expect(utils.isGTEMinVersion(hexToString(cairoVersionHex))).to.be.eq(true);
  });

  it(`should return false when version smaller than min version`, function () {
    expect(utils.isGTEMinVersion(hexToString(cairoVersionLegacyHex))).to.be.eq(
      false,
    );
  });
});

describe('Test function: getContractOwner', function () {
  let getOwnerStub: sinon.SinonStub;
  let getSignerStub: sinon.SinonStub;

  beforeEach(function () {
    getOwnerStub = sandbox.stub(utils, 'getOwner');
    getSignerStub = sandbox.stub(utils, 'getSigner');
  });

  afterEach(function () {
    sandbox.restore();
  });

  it(`should call getOwner when cairo version is ${CAIRO_VERSION}`, async function () {
    await utils.getContractOwner(
      account1.address,
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      CAIRO_VERSION,
    );

    expect(getOwnerStub).to.have.been.callCount(1);
    expect(getSignerStub).to.have.been.callCount(0);
  });

  it(`should call getSigner when cairo version is ${CAIRO_VERSION_LEGACY}`, async function () {
    await utils.getContractOwner(
      account1.address,
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      CAIRO_VERSION_LEGACY,
    );

    expect(getOwnerStub).to.have.been.callCount(0);
    expect(getSignerStub).to.have.been.callCount(1);
  });
});

describe('Test function: getCorrectContractAddress', function () {
  const walletStub = new WalletMock();
  let getAccContractAddressAndCallDataStub: sinon.SinonStub;
  let getAccContractAddressAndCallDataLegacyStub: sinon.SinonStub;
  let getOwnerStub: sinon.SinonStub;
  let getSignerStub: sinon.SinonStub;
  let getVersionStub: sinon.SinonStub;

  const PK = 'pk';
  const cairoVersionHex = '0x302e332e30';
  const cairoVersionLegacyHex = '302e322e30a';

  beforeEach(function () {
    getAccContractAddressAndCallDataStub = sandbox
      .stub(utils, 'getAccContractAddressAndCallData')
      .returns({ address: account1.address, callData: [] as Calldata });
    getAccContractAddressAndCallDataLegacyStub = sandbox
      .stub(utils, 'getAccContractAddressAndCallDataLegacy')
      .returns({ address: account2.address, callData: [] as Calldata });
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it(`should permutation both Cairo${CAIRO_VERSION_LEGACY} and Cairo${CAIRO_VERSION} address`, async function () {
    sandbox.stub(utils, 'getOwner').callsFake(async () => PK);
    sandbox.stub(utils, 'getSigner').callsFake(async () => PK);
    sandbox.stub(utils, 'getVersion').callsFake(async () => cairoVersionHex);

    await utils.getCorrectContractAddress(STARKNET_SEPOLIA_TESTNET_NETWORK, PK);
    expect(getAccContractAddressAndCallDataStub).to.have.been.calledOnceWith(
      PK,
    );
    expect(
      getAccContractAddressAndCallDataLegacyStub,
    ).to.have.been.calledOnceWith(PK);
  });

  it('should throw error when getOwner is throwing unknown error', async function () {
    sandbox.stub(utils, 'getVersion').resolves(cairoVersionHex);
    getOwnerStub = sandbox
      .stub(utils, 'getOwner')
      .rejects(new Error('network error for getOwner'));
    getSignerStub = sandbox.stub(utils, 'getSigner').callsFake(async () => PK);

    let result = null;
    try {
      await utils.getCorrectContractAddress(
        STARKNET_SEPOLIA_TESTNET_NETWORK,
        PK,
      );
    } catch (e) {
      result = e;
    } finally {
      expect(getOwnerStub).to.have.been.calledOnceWith(
        account1.address,
        STARKNET_SEPOLIA_TESTNET_NETWORK,
      );
      expect(getSignerStub).to.have.been.callCount(0);
      expect(result).to.be.an('Error');
    }
  });

  it('should throw error when getSigner is throwing unknown error', async function () {
    sandbox
      .stub(utils, 'getVersion')
      .withArgs(account1.address, STARKNET_SEPOLIA_TESTNET_NETWORK)
      .rejects(new Error('Contract not found'))
      .withArgs(account2.address, STARKNET_SEPOLIA_TESTNET_NETWORK)
      .resolves(cairoVersionLegacyHex);

    getSignerStub = sandbox
      .stub(utils, 'getSigner')
      .rejects(new Error('network error for getSigner'));

    let result = null;
    try {
      await utils.getCorrectContractAddress(
        STARKNET_SEPOLIA_TESTNET_NETWORK,
        PK,
      );
    } catch (e) {
      result = e;
    } finally {
      expect(getSignerStub).to.have.been.calledOnceWith(
        account2.address,
        STARKNET_SEPOLIA_TESTNET_NETWORK,
      );
      expect(result).to.be.an('Error');
    }
  });

  describe(`when contact is Cairo${CAIRO_VERSION} has deployed`, function () {
    it(`should return Cairo${CAIRO_VERSION} address with public key`, async function () {
      getVersionStub = sandbox
        .stub(utils, 'getVersion')
        .resolves(cairoVersionHex);
      getSignerStub = sandbox.stub(utils, 'getSigner').resolves(PK);
      getOwnerStub = sandbox.stub(utils, 'getOwner').resolves(PK);

      const result = await utils.getCorrectContractAddress(
        STARKNET_SEPOLIA_TESTNET_NETWORK,
        PK,
      );
      expect(getVersionStub).to.have.been.calledOnceWith(
        account1.address,
        STARKNET_SEPOLIA_TESTNET_NETWORK,
      );
      expect(getOwnerStub).to.have.been.calledOnceWith(
        account1.address,
        STARKNET_SEPOLIA_TESTNET_NETWORK,
      );
      expect(getSignerStub).to.have.been.callCount(0);
      expect(result.address).to.be.eq(account1.address);
      expect(result.signerPubKey).to.be.eq(PK);
      expect(result.upgradeRequired).to.be.eq(false);
    });
  });

  describe(`when Cairo${CAIRO_VERSION} has not deployed`, function () {
    describe(`and Cairo${CAIRO_VERSION_LEGACY} has deployed`, function () {
      describe(`and Cairo${CAIRO_VERSION_LEGACY} has upgraded`, function () {
        it(`should return Cairo${CAIRO_VERSION_LEGACY} address with upgrade = false`, async function () {
          sandbox
            .stub(utils, 'getVersion')
            .withArgs(account1.address, STARKNET_SEPOLIA_TESTNET_NETWORK)
            .rejects(new Error('Contract not found'))
            .withArgs(account2.address, STARKNET_SEPOLIA_TESTNET_NETWORK)
            .resolves(cairoVersionHex);

          getSignerStub = sandbox.stub(utils, 'getSigner').resolves(PK);
          getOwnerStub = sandbox.stub(utils, 'getOwner').resolves(PK);

          const result = await utils.getCorrectContractAddress(
            STARKNET_SEPOLIA_TESTNET_NETWORK,
            PK,
          );

          expect(getOwnerStub).to.have.been.calledOnceWith(
            account2.address,
            STARKNET_SEPOLIA_TESTNET_NETWORK,
          );
          expect(getSignerStub).to.have.been.callCount(0);
          expect(result.address).to.be.eq(account2.address);
          expect(result.signerPubKey).to.be.eq(PK);
          expect(result.upgradeRequired).to.be.eq(false);
        });
      });

      describe(`when when is Cairo${CAIRO_VERSION_LEGACY} has not upgraded`, function () {
        it(`should return Cairo${CAIRO_VERSION_LEGACY} address with upgrade = true`, async function () {
          sandbox
            .stub(utils, 'getVersion')
            .withArgs(account1.address, STARKNET_SEPOLIA_TESTNET_NETWORK)
            .rejects(new Error('Contract not found'))
            .withArgs(account2.address, STARKNET_SEPOLIA_TESTNET_NETWORK)
            .resolves(cairoVersionLegacyHex);

          getSignerStub = sandbox.stub(utils, 'getSigner').resolves(PK);
          getOwnerStub = sandbox.stub(utils, 'getOwner').resolves(PK);

          const result = await utils.getCorrectContractAddress(
            STARKNET_SEPOLIA_TESTNET_NETWORK,
            PK,
          );

          expect(getSignerStub).to.have.been.calledOnceWith(
            account2.address,
            STARKNET_SEPOLIA_TESTNET_NETWORK,
          );
          expect(getOwnerStub).to.have.been.callCount(0);
          expect(result.address).to.be.eq(account2.address);
          expect(result.signerPubKey).to.be.eq(PK);
          expect(result.upgradeRequired).to.be.eq(true);
        });
      });
    });

    describe(`when when Cairo${CAIRO_VERSION_LEGACY} is not deployed`, function () {
      it(`should return Cairo${CAIRO_VERSION} address with upgrade = false and deploy = false if no balance`, async function () {
        sandbox
          .stub(utils, 'getVersion')
          .rejects(new Error('Contract not found'));
        sandbox
          .stub(utils, 'getBalance')
          .callsFake(async () => getBalanceResp[0]);

        getSignerStub = sandbox.stub(utils, 'getSigner').resolves(PK);
        getOwnerStub = sandbox.stub(utils, 'getOwner').resolves(PK);

        const result = await utils.getCorrectContractAddress(
          STARKNET_SEPOLIA_TESTNET_NETWORK,
          PK,
        );

        expect(getSignerStub).to.have.been.callCount(0);
        expect(getOwnerStub).to.have.been.callCount(0);
        expect(result.address).to.be.eq(account1.address);
        expect(result.signerPubKey).to.be.eq('');
        expect(result.upgradeRequired).to.be.eq(false);
      });
      it(`should return Cairo${CAIRO_VERSION_LEGACY} address with upgrade = true and deploy = true if balance`, async function () {
        sandbox
          .stub(utils, 'getVersion')
          .rejects(new Error('Contract not found'));
        sandbox.stub(utils, 'isEthBalanceEmpty').resolves(false);

        getSignerStub = sandbox.stub(utils, 'getSigner').resolves(PK);
        getOwnerStub = sandbox.stub(utils, 'getOwner').resolves(PK);

        const result = await utils.getCorrectContractAddress(
          STARKNET_SEPOLIA_TESTNET_NETWORK,
          PK,
        );

        expect(getSignerStub).to.have.been.callCount(0);
        expect(getOwnerStub).to.have.been.callCount(0);
        expect(result.address).to.be.eq(account2.address);
        expect(result.signerPubKey).to.be.eq('');
        expect(result.upgradeRequired).to.be.eq(true);
        expect(result.deployRequired).to.be.eq(true);
      });
    });
  });
});

describe('Test function: waitForTransaction', function () {
  const walletStub = new WalletMock();
  const userAddress =
    '0x27f204588cadd08a7914f6a9808b34de0cbfc4cb53aa053663e7fd3a34dbc26';

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('pass parameter to waitForTransaction correctly', async function () {
    const stub = sandbox.stub(utils, 'waitForTransaction');
    stub.resolves({} as unknown as GetTransactionReceiptResponse);
    await utils.waitForTransaction(
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      userAddress,
      'pk',
      'txHash',
    );
    expect(stub).to.have.been.calledWith(
      STARKNET_SEPOLIA_TESTNET_NETWORK,
      userAddress,
      'pk',
      'txHash',
    );
  });
});
