import { CallData, hash } from 'starknet';

import {
  ACCOUNT_CLASS_HASH_LEGACY,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from '../../utils/constants';
import { createAccountContract } from './__test__/helper';
import { Cairo0Contract } from './cairo0';

jest.mock('../../utils/logger');

describe('Cairo0Contract', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  describe('getCallData', () => {
    it('returns the call data', async () => {
      const {
        contract,
        account: { publicKey },
      } = await createAccountContract(network, 0, Cairo0Contract);

      // contract.address is a getter method that making a call to calculateAddress.
      expect(contract.getCallData()).toStrictEqual(
        CallData.compile({
          implementation: ACCOUNT_CLASS_HASH_LEGACY,
          selector: hash.getSelectorFromName('initialize'),
          calldata: CallData.compile({ signer: publicKey, guardian: '0' }),
        }),
      );
    });
  });
});
