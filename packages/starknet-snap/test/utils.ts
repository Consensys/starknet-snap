import { generateMnemonic } from 'bip39';
import {
  ec,
  num as numUtils,
  constants,
  CallData,
  hash,
  stark,
} from 'starknet';
import {
  BIP44CoinTypeNode,
  getBIP44AddressKeyDeriver,
} from '@metamask/key-tree';
import { getAddressKey, getAddressKeyDeriver } from '../src/utils/keyPair';
import {
  getAccContractAddressAndCallData,
  getAccContractAddressAndCallDataLegacy,
} from '../src/utils/starknetUtils';
import { AccContract } from '../src/types/snapState';
import {
  ACCOUNT_CLASS_HASH,
  ACCOUNT_CLASS_HASH_LEGACY,
  PROXY_CONTRACT_HASH,
} from '../src/utils/constants';

/* eslint-disable */
export type StarknetAccount = AccContract & {
  privateKey: string;
};

/**
 * Method to generate random bip32 deriver.
 *
 * @param network - Bitcoin network.
 * @param path - Derived path.
 * @param curve - Curve.
 * @returns An Json data and the bip32 deriver.
 */
export async function generateAccounts(
  network: constants.StarknetChainId,
  cnt: number = 1,
  cairoVersion = '1',
) {
  const accounts: StarknetAccount[] = [];

  for (let i = 0; i < cnt; i++) {
    const mnemonic = generateMnemonic();
    const node = await BIP44CoinTypeNode.fromDerivationPath([
      `bip39:${mnemonic}`,
      "bip32:44'",
      "bip32:9004'",
    ]);
    const keyDeriver = await getBIP44AddressKeyDeriver(node);
    const { privateKey } = await keyDeriver(i);

    if (!privateKey) {
      throw new Error('Private key is not defined');
    }
    const privKey = stark.randomAddress();
    const pubKey = ec.starkCurve.getStarkKey(privKey);

    let address = '';

    if (cairoVersion === '1') {
      const callData = CallData.compile({
        signer: pubKey,
        guardian: '0',
      });

      address = hash.calculateContractAddressFromHash(
        pubKey,
        ACCOUNT_CLASS_HASH,
        callData,
        0,
      );

      if (address.length < 66) {
        address = address.replace('0x', `0x${'0'.repeat(66 - address.length)}`);
      }
    } else {
      const callData = CallData.compile({
        implementation: ACCOUNT_CLASS_HASH_LEGACY,
        selector: hash.getSelectorFromName('initialize'),
        calldata: CallData.compile({ signer: pubKey, guardian: '0' }),
      });

      address = hash.calculateContractAddressFromHash(
        pubKey,
        PROXY_CONTRACT_HASH,
        callData,
        0,
      );

      if (address.length < 66) {
        address = address.replace('0x', `0x${'0'.repeat(66 - address.length)}`);
      }
    }
    accounts.push({
      addressSalt: pubKey,
      privateKey: privKey,
      publicKey: pubKey,
      address: address,
      addressIndex: i,
      derivationPath: keyDeriver.path,
      deployTxnHash: '',
      chainId: network,
    });
  }
  return accounts;
}
