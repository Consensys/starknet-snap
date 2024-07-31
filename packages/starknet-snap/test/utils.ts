import { generateMnemonic } from 'bip39';
import {
  ec,
  constants,
  CallData,
  hash,
  type Calldata,
  num as numUtils,
} from 'starknet';
import {
  BIP44CoinTypeNode,
  getBIP44AddressKeyDeriver,
} from '@metamask/key-tree';
import { AccContract } from '../src/types/snapState';
import {
  ACCOUNT_CLASS_HASH,
  ACCOUNT_CLASS_HASH_LEGACY,
  PROXY_CONTRACT_HASH,
} from '../src/utils/constants';
import { grindKey } from '../src/utils/keyPair';

/* eslint-disable */
export type StarknetAccount = AccContract & {
  privateKey: string;
};

/* eslint-disable */

/**
 * Method to generate Bip44 Entropy.
 *
 * @param mnemonic - The random mnemonic of the wallet.
 * @param coinType - The coin type of the bip44, default is 9004 - Starknet Coin.
 * @returns An Bip44 Node.
 */
export async function generateBip44Entropy(
  mnemonic: string,
  coinType: number = 9004,
) {
  return await BIP44CoinTypeNode.fromDerivationPath([
    `bip39:${mnemonic}`,
    "bip32:44'",
    `bip32:${coinType}'`,
  ]);
}

/**
 * Method to generate starknet account.
 *
 * @param network - Starknet Chain Id.
 * @param cnt - Number of accounts to generate.
 * @param cairoVersion - Cairo version of the generated accounts.
 * @returns An array of StarknetAccount object.
 */
export async function generateAccounts(
  network: constants.StarknetChainId,
  cnt: number = 1,
  cairoVersion = '1',
  mnemonic?: string,
) {
  const accounts: StarknetAccount[] = [];
  let mnemonicString = mnemonic;
  if (!mnemonicString) {
    mnemonicString = generateMnemonic();
  }

  for (let i = 0; i < cnt; i++) {
    // simulate the bip44 entropy generation
    const node = await generateBip44Entropy(mnemonicString);
    const keyDeriver = await getBIP44AddressKeyDeriver(node);
    const { privateKey } = await keyDeriver(i);

    if (!privateKey) {
      throw new Error('Private key is not defined');
    }

    // simulate the same flow in code base
    const addressKey = grindKey(privateKey);
    const pubKey = ec.starkCurve.getStarkKey(addressKey);

    let address = '';
    let callData: Calldata;
    let accountClassHash: string;

    if (cairoVersion === '1') {
      callData = CallData.compile({
        signer: pubKey,
        guardian: '0',
      });
      accountClassHash = ACCOUNT_CLASS_HASH;
    } else {
      callData = CallData.compile({
        implementation: ACCOUNT_CLASS_HASH_LEGACY,
        selector: hash.getSelectorFromName('initialize'),
        calldata: CallData.compile({ signer: pubKey, guardian: '0' }),
      });
      accountClassHash = PROXY_CONTRACT_HASH;
    }

    address = hash.calculateContractAddressFromHash(
      pubKey,
      accountClassHash,
      callData,
      0,
    );

    if (address.length < 66) {
      address = address.replace('0x', `0x${'0'.repeat(66 - address.length)}`);
    }

    accounts.push({
      addressSalt: pubKey,
      privateKey: numUtils.toHex(addressKey),
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
