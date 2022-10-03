import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { SnapState } from '../../src/types/snapState';
import typedDataExample from '../../src/typedData/typedDataExample.json';
import { verifySignedMessage } from '../../src/verifySignedMessage';
import { STARKNET_TESTNET_NETWORK } from '../../src/utils/constants';
import { account1, getBip44EntropyStub, signature1, signature2, unfoundUserAddress } from '../constants.test';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import * as utils from '../../src/utils/starknetUtils';
import { Mutex } from 'async-mutex';
import { ApiParams, VerifySignedMessageRequestParams } from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: verifySignedMessage', function () {
  this.timeout(5000);
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [account1],
    erc20Tokens: [],
    networks: [STARKNET_TESTNET_NETWORK],
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
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should verify a signed message from an user account correctly', async function () {
    const requestObject: VerifySignedMessageRequestParams = {
      signerAddress: account1.address,
      typedDataMessage: undefined, // will use typedDataExample.json
      signature: signature1.join(','),
    };
    apiParams.requestParams = requestObject;
    const result = await verifySignedMessage(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
    expect(result).to.be.eql(true);
  });

  it('should verify a signed message from an unfound user account correctly', async function () {
    const requestObject: VerifySignedMessageRequestParams = {
      signerAddress: unfoundUserAddress,
      typedDataMessage: JSON.stringify(typedDataExample),
      signature: signature2.join(','),
    };
    apiParams.requestParams = requestObject;
    const result = await verifySignedMessage(apiParams);
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
    expect(result).to.be.eql(true);
  });

  it('should throw error if getKeysFromAddress failed', async function () {
    sandbox.stub(utils, 'getKeysFromAddress').throws(new Error());
    const requestObject: VerifySignedMessageRequestParams = {
      signerAddress: account1.address,
      typedDataMessage: undefined, // will use typedDataExample.json
      signature: signature1.join(','),
    };
    apiParams.requestParams = requestObject;

    let result;
    try {
      await verifySignedMessage(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
  });

  it('should throw an error if the signerAddress is an invalid address', async function () {
    const requestObject: VerifySignedMessageRequestParams = {
      signerAddress: 'wrongAddress',
      typedDataMessage: undefined, // will use typedDataExample.json
      signature: signature1.join(','),
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await verifySignedMessage(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw an error if the signature is undefined', async function () {
    const requestObject: VerifySignedMessageRequestParams = {
      signerAddress: account1.address,
      typedDataMessage: undefined, // will use typedDataExample.json
      signature: undefined,
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await verifySignedMessage(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });
});
