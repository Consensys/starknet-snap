import { mockWalletInit, createWallet, SepoliaNetwork } from '../__tests__/helper';
import { WalletRequestChainId } from './request-chain-id';

describe('WalletRequestChainId', () => {
  it('returns the current chain Id', async () => {
    const wallet = createWallet();
    mockWalletInit({ currentNetwork: SepoliaNetwork });

    const walletRequestChainId = new WalletRequestChainId(wallet);
    const result = await walletRequestChainId.execute();

    expect(result).toBe(SepoliaNetwork.chainId);
  });
});
