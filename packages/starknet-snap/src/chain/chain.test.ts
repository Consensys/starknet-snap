import { TransactionType, constants } from 'starknet';

import { generateTransactions, generateAccounts } from '../__tests__/helper';
import { ContractAddressFilter } from '../state/transaction-state-manager';
import {
  ETHER_SEPOLIA_TESTNET,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from '../utils/constants';
import { StarkScanClient } from './data-client/starkscan';
import { createChainService } from './factory';

describe('ChainService', () => {
  describe('getTransactions', () => {
    const mockAccount = async (chainId) => {
      const [account] = await generateAccounts(chainId, 1);
      return account;
    };

    const mockTransactions = (
      address: string,
      chainId: constants.StarknetChainId,
    ) => {
      return generateTransactions({
        chainId,
        address,
        txnTypes: [TransactionType.DEPLOY_ACCOUNT, TransactionType.INVOKE],
        cnt: 10,
      });
    };

    it('returns transactions correctly', async () => {
      const chainId = constants.StarknetChainId.SN_SEPOLIA;
      const account = await mockAccount(chainId);
      const contractAddress = ETHER_SEPOLIA_TESTNET.address;
      const txs = mockTransactions(account.address, chainId);
      const dataClientSpy = jest
        .spyOn(StarkScanClient.prototype, 'getTransactions')
        .mockResolvedValue(txs);
      const contractAddressFilter = new ContractAddressFilter([
        contractAddress,
      ]);

      const service = createChainService(STARKNET_SEPOLIA_TESTNET_NETWORK);
      const result = await service.getTransactions(
        account.address,
        contractAddress,
        10,
      );

      expect(result).toStrictEqual(
        txs.filter(
          (tx) =>
            tx.txnType === TransactionType.DEPLOY_ACCOUNT ||
            contractAddressFilter.apply(tx),
        ),
      );
      expect(dataClientSpy).toHaveBeenCalledWith(
        account.address,
        expect.any(Number),
      );
    });
  });
});
