import { CallData } from 'starknet';

import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../../utils/constants';
import { createAccountContract } from './__test__/helper';
import { Cairo1Contract } from './cairo1';

jest.mock('../../utils/logger');

describe('Cairo1Contract', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  describe('getCallData', () => {
    it('returns the call data', async () => {
      const {
        contract,
        account: { publicKey },
      } = await createAccountContract(network, 0, Cairo1Contract);

      // contract.address is a getter method that making a call to calculateAddress.
      expect(contract.getCallData()).toStrictEqual(
        CallData.compile({
          signer: publicKey,
          guardian: '0',
        }),
      );
    });
  });
});
