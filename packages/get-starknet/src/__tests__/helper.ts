import { constants } from 'starknet';

import type { Network } from '../type';

export const SepoliaNetwork: Network = {
  name: 'Sepolia Testnet',
  baseUrl: 'https://alpha-sepolia.starknet.io',
  chainId: constants.StarknetChainId.SN_SEPOLIA,
  nodeUrl: 'https://nodeUrl.com',
  voyagerUrl: '',
  accountClassHash: '', // from argent-x repo
};

export const MainnetaNetwork: Network = {
  name: 'Mainnet',
  baseUrl: 'https://mainnet.starknet.io',
  chainId: constants.StarknetChainId.SN_MAIN,
  nodeUrl: 'https://nodeUrl.com',
  voyagerUrl: '',
  accountClassHash: '', // from argent-x repo
};

/**
 *
 * @param options0
 * @param options0.addressSalt
 * @param options0.publicKey
 * @param options0.address
 * @param options0.addressIndex
 * @param options0.derivationPath
 * @param options0.deployTxnHash
 * @param options0.chainId
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
