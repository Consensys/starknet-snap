import { TokenStateManager } from '../state/token-state-manager';
import { FeeToken } from '../types/snapApi';
import type { Network } from '../types/snapState';
import {
  BlockIdentifierEnum,
  ETHER_SEPOLIA_TESTNET,
  STRK_SEPOLIA_TESTNET,
} from '../utils/constants';
import * as starknetUtils from '../utils/starknetUtils';
import { hasSufficientFunds } from './utils';

describe('hasSufficientFunds', () => {
  const mockAddress = '0xTestAddress';
  const mockNetwork = { chainId: '1' } as Network;
  const mockSuggestedMaxFee = '1000';

  // Utility function to prepare and return spies
  /**
   *
   */
  function prepareSpy() {
    const getBalanceSpy = jest.spyOn(starknetUtils, 'getBalance');

    jest
      .spyOn(TokenStateManager.prototype, 'getStrkToken')
      .mockResolvedValue(STRK_SEPOLIA_TESTNET);

    jest
      .spyOn(TokenStateManager.prototype, 'getEthToken')
      .mockResolvedValue(ETHER_SEPOLIA_TESTNET);

    return { getBalanceSpy };
  }

  it('returns true when STRK balance is sufficient for calls and fee', async () => {
    const { getBalanceSpy } = prepareSpy();

    getBalanceSpy.mockResolvedValueOnce('2000'); // Mock STRK balance
    getBalanceSpy.mockResolvedValueOnce('500'); // Mock ETH balance

    const result = await hasSufficientFunds(
      mockAddress,
      mockNetwork,
      [{ contractAddress: STRK_SEPOLIA_TESTNET.address, amount: '500' }],
      FeeToken.STRK,
      mockSuggestedMaxFee,
    );

    expect(result).toBe(true);
    expect(getBalanceSpy).toHaveBeenCalledWith(
      mockAddress,
      STRK_SEPOLIA_TESTNET.address,
      mockNetwork,
      BlockIdentifierEnum.Pending,
    );
  });

  it('returns false when STRK balance is insufficient', async () => {
    const { getBalanceSpy } = prepareSpy();
    getBalanceSpy.mockResolvedValueOnce('1000'); // Mock STRK balance
    getBalanceSpy.mockResolvedValueOnce('500'); // Mock ETH balance

    const result = await hasSufficientFunds(
      mockAddress,
      mockNetwork,
      [{ contractAddress: STRK_SEPOLIA_TESTNET.address, amount: '1500' }],
      FeeToken.STRK,
      mockSuggestedMaxFee,
    );

    expect(result).toBe(false);
  });

  it('returns true when ETH balance is sufficient for calls and fee', async () => {
    const { getBalanceSpy } = prepareSpy();
    getBalanceSpy.mockResolvedValueOnce('500'); // Mock STRK balance
    getBalanceSpy.mockResolvedValueOnce('2000'); // Mock ETH balance

    const result = await hasSufficientFunds(
      mockAddress,
      mockNetwork,
      [{ contractAddress: ETHER_SEPOLIA_TESTNET.address, amount: '500' }],
      FeeToken.ETH,
      mockSuggestedMaxFee,
    );

    expect(result).toBe(true);
    expect(getBalanceSpy).toHaveBeenCalledWith(
      mockAddress,
      ETHER_SEPOLIA_TESTNET.address,
      mockNetwork,
      BlockIdentifierEnum.Pending,
    );
  });

  it('returns false when ETH balance is insufficient', async () => {
    const { getBalanceSpy } = prepareSpy();
    getBalanceSpy.mockResolvedValueOnce('500'); // Mock STRK balance
    getBalanceSpy.mockResolvedValueOnce('1000'); // Mock ETH balance

    const result = await hasSufficientFunds(
      mockAddress,
      mockNetwork,
      [{ contractAddress: ETHER_SEPOLIA_TESTNET.address, amount: '1500' }],
      FeeToken.ETH,
      mockSuggestedMaxFee,
    );

    expect(result).toBe(false);
  });
});
