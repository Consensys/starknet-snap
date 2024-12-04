import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { WalletMock } from '../wallet.mock.test';
import { SnapState } from '../../src/types/snapState';
import {
  STARKNET_MAINNET_NETWORK,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from '../../src/utils/constants';
import { getCurrentNetwork } from '../../src/getCurrentNetwork';
import { Mutex } from 'async-mutex';
import { ApiParams } from '../../src/types/snapApi';

chai.use(sinonChai);
const sandbox = sinon.createSandbox();

describe('Test function: getStoredNetworks', function () {
  const walletStub = new WalletMock();
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_MAINNET_NETWORK, STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
    currentNetwork: STARKNET_MAINNET_NETWORK,
  };
  const apiParams: ApiParams = {
    state,
    requestParams: {},
    wallet: walletStub,
    saveMutex: new Mutex(),
  };

  let stateStub: sinon.SinonStub;
  beforeEach(function () {
    stateStub = walletStub.rpcStubs.snap_manageState;
    stateStub.resolves(state);
  });

  afterEach(function () {
    walletStub.reset();
    sandbox.restore();
  });

  it('should get the current network correctly', async function () {
    const result = await getCurrentNetwork(apiParams);
    expect(stateStub).not.to.have.been.called;
    expect(result).to.be.eql(STARKNET_MAINNET_NETWORK);
  });

  it('should get STARKNET_MAINNET_NETWORK if current network is undefined', async function () {
    state.currentNetwork = undefined;
    const result = await getCurrentNetwork(apiParams);
    expect(stateStub).not.to.have.been.called;
    expect(result).to.be.eql(STARKNET_MAINNET_NETWORK);
  });
});
