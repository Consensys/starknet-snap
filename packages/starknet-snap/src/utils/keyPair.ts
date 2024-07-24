import type { BIP44AddressKeyDeriver } from '@metamask/key-tree';
import { getBIP44AddressKeyDeriver } from '@metamask/key-tree';
import { utils } from 'ethers';
import { number, ec } from 'starknet_v4.22.0';

/**
 *
 * @param wallet
 */
export async function getAddressKeyDeriver(wallet) {
  const bip44Node = await wallet.request({
    method: 'snap_getBip44Entropy',
    params: {
      coinType: 9004,
    },
  });

  // `m / purpose' / coin_type' / account' / change / address_index`
  // `m / 44' / 9004' / 0' / 0 / {index}`
  return getBIP44AddressKeyDeriver(bip44Node);
}

/**
 *
 * @param keySeed
 * @param keyValueLimit
 */
export function grindKey(keySeed: string, keyValueLimit = ec.ec.n): string {
  if (!keyValueLimit) {
    return keySeed;
  }
  const sha256EcMaxDigest = number.toBN(
    '1 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000',
    16,
  );
  const maxAllowedVal = sha256EcMaxDigest.sub(
    sha256EcMaxDigest.mod(keyValueLimit),
  );

  // Make sure the produced key is derived by the Stark EC order,
  // and falls within the range [0, maxAllowedVal).
  let i = 0;
  let key;
  do {
    key = hashKeyWithIndex(keySeed, i);
    i += 1;
  } while (!key.lt(maxAllowedVal));
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  return `0x${key.umod(keyValueLimit).toString('hex')}`;
}

/**
 *
 * @param key
 * @param index
 */
function hashKeyWithIndex(key: string, index: number) {
  const payload = utils.concat([utils.arrayify(key), utils.arrayify(index)]);
  const hash = utils.sha256(payload);
  return number.toBN(hash);
}

/**
 *
 * @param keyDeriver
 * @param addressIndex
 */
export async function getAddressKey(
  keyDeriver: BIP44AddressKeyDeriver,
  addressIndex = 0,
) {
  const { privateKey } = await keyDeriver(addressIndex);
  const addressKey = grindKey(privateKey as unknown as string);
  return {
    addressKey,
    derivationPath: keyDeriver.path,
  };
}
