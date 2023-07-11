import { getBIP44AddressKeyDeriver } from '@metamask/key-tree';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { getAddressKey, getAddressKeyDeriver, grindKey } from '../../src/utils/keyPair';
import { bip44Entropy } from '../constants.test';
import { WalletMock } from '../wallet.mock.test';
// import { getAccContractAddressAndCallData, getKeysFromAddressIndex } from '../../src/utils/starknetUtils';
// import { STARKNET_TESTNET_NETWORK } from '../../src/utils/constants';

chai.use(sinonChai);

describe('Test function: getAddressKey', function () {
  const walletStub = new WalletMock();
  let keyDeriver;

  beforeEach(async function () {
    walletStub.rpcStubs.snap_getBip44Entropy.resolves(bip44Entropy);
    keyDeriver = await getAddressKeyDeriver(walletStub);
  });

  afterEach(function () {
    walletStub.reset();
  });

  // it('should get the first 10 addresses and derived keys from the BIP-44 entropy', async function () {
  //   const deriveStarkNetAddress = await getBIP44AddressKeyDeriver(bip44Entropy);
  //   for (let i = 0; i < 10; i++) {
  //     const result = await getKeysFromAddressIndex(deriveStarkNetAddress, '', null, i);
  //     const { address } = getAccContractAddressAndCallData(
  //       STARKNET_TESTNET_NETWORK.accountClassHash,
  //       result.publicKey,
  //     );
  //     console.log(`result ${i}:\npublicKey: ${result.publicKey}\nprivateKey: ${result.privateKey}\naddress: ${address}`);
  //   }
  // });

  it('should get the ground address key from the BIP-44 entropy correctly', async function () {
    const deriveStarkNetAddress = await getBIP44AddressKeyDeriver(bip44Entropy);
    const privateKey = (await deriveStarkNetAddress(0)).privateKey;
    const expectedResult = grindKey(privateKey);
    const result = await getAddressKey(keyDeriver);
    expect(walletStub.rpcStubs.snap_getBip44Entropy).to.have.been.calledOnce;
    expect(result.addressKey).to.be.eql(expectedResult);
  });

  it('should get the ground address key as the given private key if null keyValueLimit is given in grindKey', async function () {
    const deriveStarkNetAddress = await getBIP44AddressKeyDeriver(bip44Entropy);
    const privateKey = (await deriveStarkNetAddress(0)).privateKey;
    const groundKey = grindKey(privateKey, null);
    expect(walletStub.rpcStubs.snap_getBip44Entropy).to.have.been.calledOnce;
    expect(groundKey).to.be.eql(privateKey);
  });

  it('should get the ground address key of a specific address index from the BIP-44 entropy correctly', async function () {
    const addressIndex = 10;
    const deriveStarkNetAddress = await getBIP44AddressKeyDeriver(bip44Entropy);
    const privateKey = (await deriveStarkNetAddress(addressIndex)).privateKey;
    const expectedResult = grindKey(privateKey);
    const result = await getAddressKey(keyDeriver, addressIndex);
    expect(walletStub.rpcStubs.snap_getBip44Entropy).to.have.been.calledOnce;
    expect(result.addressKey).to.be.eql(expectedResult);
  });
});
