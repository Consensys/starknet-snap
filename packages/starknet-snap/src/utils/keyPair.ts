import { getBIP44AddressKeyDeriver } from '@metamask/key-tree';
import { keyDerivation, ec } from '@starkware-industries/starkware-crypto-utils';
import { number } from 'starknet';

export async function getAddressKeyDeriver(wallet) {
  const bip44Node = await wallet.request({
    method: `snap_getBip44Entropy_9004`,
    params: [],
  });

  //`m / purpose' / coin_type' / account' / change / address_index`
  //`m / 44' / 9004' / 0' / 0 / {index}`
  return getBIP44AddressKeyDeriver(bip44Node, {
    account: 0,
    change: 0,
  });
}

export async function getAddressKey(keyDeriver, addressIndex = 0) {
  const privateKey = (await keyDeriver(addressIndex)).privateKey;
  const chainCode = (await keyDeriver(addressIndex)).chainCode;
  const addressKey = `0x${privateKey}${chainCode}`;
  const retAddressKey = keyDerivation.grindKey(addressKey, ec.n);
  return {
    addressKey: number.toHex(retAddressKey),
    groundAddressKey: number.toHex(keyDerivation.grindKey(addressKey, ec.n)),
    originalAddressKey: addressKey,
    derivationPath: keyDeriver.path,
  };
}
