import { toJson } from '../../src/utils/serializer';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { SnapState } from '../../src/types/snapState';
import { signMessage } from '../../src/signMessage';
import typedDataExample from '../../src/typedData/typedDataExample.json';
import { ArraySignatureType } from 'starknet';
import { STARKNET_TESTNET_NETWORK } from '../../src/utils/constants';
import {
  account1,
  getBip44EntropyStub,
  signature4SignMessageWithUnfoundAddress,
  unfoundUserAddress,
  signature4SignMessage,
} from '../constants.test';
import { getAddressKeyDeriver } from '../../src/utils/keyPair';
import * as utils from '../../src/utils/starknetUtils';
import { Mutex } from 'async-mutex';
import { ApiParams, SignMessageRequestParams } from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: signMessage', function () {
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

  const requestObject: SignMessageRequestParams = {
    chainId: STARKNET_TESTNET_NETWORK.chainId,
    signerAddress: account1.address,
    typedDataMessage: typedDataExample,
    enableAutherize: true,
  };

  beforeEach(async function () {
    walletStub.rpcStubs.snap_getBip44Entropy.callsFake(getBip44EntropyStub);
    apiParams.keyDeriver = await getAddressKeyDeriver(walletStub);
    apiParams.requestParams = requestObject;
    walletStub.rpcStubs.snap_dialog.resolves(true);
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should sign a message from an user account correctly', async function () {
    const result: boolean | ArraySignatureType = await signMessage(apiParams);
    const expectedDialogParams = {
      type: 'confirmation',
      content: {
        type: 'panel',
        children: [
          { type: 'heading', value: 'Do you want to sign this message?' },

          {
            type: 'text',
            value: `**Message:**`,
          },
          {
            type: 'copyable',
            value: toJson(typedDataExample),
          },
          {
            type: 'text',
            value: `**Signer Address:**`,
          },
          {
            type: 'copyable',
            value: `${account1.address}`,
          },
        ],
      },
    };
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledWith(expectedDialogParams);
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
    expect(result).to.be.eql(signature4SignMessage);
  });

  it('should sign a message from an unfound user account correctly', async function () {
    const requestObject = apiParams.requestParams as SignMessageRequestParams;
    requestObject.signerAddress = unfoundUserAddress;
    const result = await signMessage(apiParams);
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
    expect(result).to.be.eql(signature4SignMessageWithUnfoundAddress);
    requestObject.signerAddress = account1.address;
  });

  it('should throw error if getKeysFromAddress failed', async function () {
    sandbox.stub(utils, 'getKeysFromAddress').throws(new Error());
    let result;
    try {
      await signMessage(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
  });

  it('should return false if the user not confirmed', async function () {
    walletStub.rpcStubs.snap_dialog.resolves(false);
    const result = await signMessage(apiParams);
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.calledOnce;
    expect(walletStub.rpcStubs.snap_manageState).not.to.have.been.called;
    expect(result).to.be.eql(false);
  });

  it('should throw an error if the signerAddress is undefined', async function () {
    const requestObject: SignMessageRequestParams = {
      signerAddress: undefined,
      typedDataMessage: typedDataExample,
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await signMessage(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should throw an error if the signerAddress is an invalid address', async function () {
    const invalidAddress = 'wrongAddress';
    const requestObject: SignMessageRequestParams = {
      signerAddress: invalidAddress,
      typedDataMessage: typedDataExample,
    };
    apiParams.requestParams = requestObject;
    let result;
    try {
      result = await signMessage(apiParams);
    } catch (err) {
      result = err;
    } finally {
      expect(result).to.be.an('Error');
    }
  });

  it('should skip dialog if enableAutherize is false', async function () {
    const paramsObject = apiParams.requestParams as SignMessageRequestParams;
    paramsObject.enableAutherize = false;
    const result = await signMessage(apiParams);
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.callCount(0);
    expect(result).to.be.eql(signature4SignMessage);
    paramsObject.enableAutherize = true;
  });

  it('should skip dialog if enableAutherize is omit', async function () {
    const paramsObject = apiParams.requestParams as SignMessageRequestParams;
    paramsObject.enableAutherize = undefined;
    const result = await signMessage(apiParams);
    expect(walletStub.rpcStubs.snap_dialog).to.have.been.callCount(0);
    expect(result).to.be.eql(signature4SignMessage);
    paramsObject.enableAutherize = true;
  });
});
