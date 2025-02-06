import { BlockTag, Provider } from 'starknet';

import { generateAccounts } from '../__tests__/helper';
import { ETHER_MAINNET, STARKNET_SEPOLIA_TESTNET_NETWORK } from './constants';
import { ContractReader } from './contract';
import {
  ContractNotDeployedError,
  ContractReadError,
  CONTRACT_NOT_DEPLOYED_ERROR,
} from './exceptions';

describe('ContractReader', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  const mockProvider = () => {
    const callContractSpy = jest.spyOn(Provider.prototype, 'callContract');
    return callContractSpy;
  };

  const getContractCallArgs = async () => {
    const [account] = await generateAccounts(network.chainId, 1);
    return {
      contractAddress: ETHER_MAINNET.address,
      entrypoint: 'balanceOf',
      calldata: [account.address],
    };
  };

  describe('callContract', () => {
    it('returns the response of the contract method', async () => {
      const callContractSpy = mockProvider();
      const balance = '1000000000000000000';
      callContractSpy.mockResolvedValue([balance]);

      const args = await getContractCallArgs();

      const reader = new ContractReader(network);
      const result = await reader.callContract(args);

      expect(result).toStrictEqual([balance]);
      expect(callContractSpy).toHaveBeenCalledWith(args, BlockTag.LATEST);
    });

    it('throws a `ContractNotDeployedError` if the contract is not found', async () => {
      const callContractSpy = mockProvider();
      callContractSpy.mockRejectedValue(new Error(CONTRACT_NOT_DEPLOYED_ERROR));

      const args = await getContractCallArgs();

      const reader = new ContractReader(network);

      await expect(reader.callContract(args)).rejects.toThrow(
        ContractNotDeployedError,
      );
    });

    it('throws a `ContractReadError` if an error is thrown', async () => {
      const callContractSpy = mockProvider();
      callContractSpy.mockRejectedValue(new Error('Read Error'));

      const args = await getContractCallArgs();

      const reader = new ContractReader(network);

      await expect(reader.callContract(args)).rejects.toThrow(
        ContractReadError,
      );
    });
  });
});
