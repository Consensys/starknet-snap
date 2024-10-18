import { constants } from 'starknet';

import { MetaMaskSnap } from '../snap';
import type { MetaMaskProvider, Network } from '../type';
import { MetaMaskSnapWallet } from '../wallet';

export const SepoliaNetwork: Network = {
  name: 'Sepolia Testnet',
  baseUrl: 'https://alpha-sepolia.starknet.io',
  chainId: constants.StarknetChainId.SN_SEPOLIA,
  nodeUrl: 'https://nodeUrl.com',
  voyagerUrl: '',
  accountClassHash: '', // from argent-x repo
};

export const MainnetNetwork: Network = {
  name: 'Mainnet',
  baseUrl: 'https://mainnet.starknet.io',
  chainId: constants.StarknetChainId.SN_MAIN,
  nodeUrl: 'https://nodeUrl.com',
  voyagerUrl: '',
  accountClassHash: '', // from argent-x repo
};

export const EthAsset = {
  address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  name: 'Ether',
  symbol: 'ETH',
  decimals: 18,
};

/**
 * Generate an account object.
 *
 * @param params
 * @param params.addressSalt - The salt of the address.
 * @param params.publicKey - The public key of the account.
 * @param params.address - The address of the account.
 * @param params.addressIndex - The index of the address.
 * @param params.derivationPath - The derivation path of the address.
 * @param params.deployTxnHash - The transaction hash of the deploy transaction.
 * @param params.chainId - The chain id of the account.
 * @returns The account object.
 */
export function generateAccount({
  addressSalt = 'addressSalt',
  publicKey = 'publicKey',
  address = '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd',
  addressIndex = 0,
  derivationPath = "m/44'/60'/0'/0/0",
  deployTxnHash = '',
  chainId = SepoliaNetwork.chainId,
}: {
  addressSalt?: string;
  publicKey?: string;
  address?: string;
  addressIndex?: number;
  derivationPath?: string;
  deployTxnHash?: string;
  chainId?: string;
}) {
  return {
    addressSalt,
    publicKey,
    address,
    addressIndex,
    derivationPath,
    deployTxnHash,
    chainId,
  };
}

export class MockProvider implements MetaMaskProvider {
  request = jest.fn();
}

/**
 * Create a wallet instance.
 */
export function createWallet() {
  return new MetaMaskSnapWallet(new MockProvider());
}

/**
 * Mock the wallet init method.
 *
 * @param params
 * @param params.install - The return value of the installIfNot method.
 * @param params.currentNetwork - The return value of the getCurrentNetwork method.
 * @param params.address - The address of the account.
 * @returns The spy objects.
 */
export function mockWalletInit({
  install = true,
  currentNetwork = SepoliaNetwork,
  address = '0x04882a372da3dfe1c53170ad75893832469bf87b62b13e84662565c4a88f25cd',
}: {
  install?: boolean;
  currentNetwork?: Network;
  address?: string;
}) {
  const installSpy = jest.spyOn(MetaMaskSnap.prototype, 'installIfNot');
  const getCurrentNetworkSpy = jest.spyOn(MetaMaskSnap.prototype, 'getCurrentNetwork');
  const recoverDefaultAccountSpy = jest.spyOn(MetaMaskSnap.prototype, 'recoverDefaultAccount');
  const initSpy = jest.spyOn(MetaMaskSnapWallet.prototype, 'init');

  installSpy.mockResolvedValue(install);
  getCurrentNetworkSpy.mockResolvedValue(currentNetwork);
  recoverDefaultAccountSpy.mockResolvedValue(generateAccount({ address }));

  return {
    initSpy,
    installSpy,
    getCurrentNetworkSpy,
    recoverDefaultAccountSpy,
  };
}
