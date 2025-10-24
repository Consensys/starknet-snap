import {
  ETHER_MAINNET,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from '../../utils/constants';
import { ContractReader } from '../../utils/contract';
import {
  createAccountContract,
  upgradedContractVersion,
  upgradedContractVersionInHex,
} from './__test__/helper';

jest.mock('../../utils/logger');

describe('AccountContractReader', () => {
  const network = STARKNET_SEPOLIA_TESTNET_NETWORK;

  const mockContractReader = () => {
    const callContractSpy = jest.spyOn(
      ContractReader.prototype,
      'callContract',
    );
    return { callContractSpy };
  };

  describe('getVersion', () => {
    it('returns the contract version', async () => {
      const { accountContractReader, contract } = await createAccountContract(
        network,
      );

      const { callContractSpy } = mockContractReader();
      callContractSpy.mockResolvedValue([upgradedContractVersionInHex]);

      const result = await accountContractReader.getVersion(contract);

      expect(result).toStrictEqual(upgradedContractVersion);
      expect(callContractSpy).toHaveBeenCalledWith({
        contractAddress: contract.address,
        entrypoint: contract.contractMethodMap.getVersion,
      });
    });
  });

  describe('getEthBalance', () => {
    it('returns the ETH Balance', async () => {
      const { accountContractReader, contract } = await createAccountContract(
        network,
      );

      const balance = '1000000000000000000';
      const { callContractSpy } = mockContractReader();

      callContractSpy.mockResolvedValue([balance]);

      const result = await accountContractReader.getEthBalance(contract);

      expect(result).toStrictEqual(BigInt(balance));
      expect(callContractSpy).toHaveBeenCalledWith({
        contractAddress: ETHER_MAINNET.address,
        entrypoint: 'balanceOf',
        calldata: [contract.address],
      });
    });
  });
});
