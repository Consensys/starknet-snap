import { mockWalletInit, createWallet, SepoliaNetwork } from '../__tests__/helper';
import { WalletRequestChainId } from './request-chain-id';

describe('WalletRequestChainId', () => {
  it('switchs the network', async () => {
    const wallet = createWallet();
    mockWalletInit({ currentNetwork: SepoliaNetwork });

    const walletSwitchStarknetChain = new WalletRequestChainId(wallet);
    const result = await walletSwitchStarknetChain.execute();

    expect(result).toBe(SepoliaNetwork.chainId);
  });
});
