import { TokenStateManager } from '../state/token-state-manager';
import { FeeToken } from '../types/snapApi';
import type { Network } from '../types/snapState';
import { BlockIdentifierEnum } from '../utils/constants';
import { getBalance } from '../utils/starknetUtils';

/**
 * Checks if the provided address has sufficient funds in either STRK or ETH to cover
 * the total amount required for a set of contract calls and a suggested transaction fee.
 *
 * @param address - The wallet address to check balances for.
 * @param network - The network object, which includes information such as chainId.
 * @param calls - An array of contract call objects.
 * Each object should contain a contract address and an optional amount.
 * @param feeToken - Specifies the fee token type (either STRK or ETH) to use for the transaction fee.
 * @param suggestedMaxFee - The maximum transaction fee to consider, as a stringified bigint.
 * @returns Resolves to `true` if there are sufficient funds for the specified fee token
 * to cover both the total amounts in `calls` and the `suggestedMaxFee`; otherwise, `false`.
 */
export async function hasSufficientFunds(
  address: string,
  network: Network,
  calls: { contractAddress: string; amount?: string }[],
  feeToken: FeeToken,
  suggestedMaxFee: string,
): Promise<boolean> {
  const stateManager = new TokenStateManager();

  // Fetch STRK token details and balance
  const strkToken = await stateManager.getStrkToken({
    chainId: network.chainId,
  });
  const strkBalance = strkToken
    ? await getBalance(
        address,
        strkToken.address,
        network,
        BlockIdentifierEnum.Pending,
      )
    : '0';

  // Fetch ETH token details and balance
  const ethToken = await stateManager.getEthToken({ chainId: network.chainId });
  const ethBalance = ethToken
    ? await getBalance(
        address,
        ethToken.address,
        network,
        BlockIdentifierEnum.Pending,
      )
    : '0';

  // Initialize total amounts for STRK and ETH
  let totalStrkAmount = BigInt(0);
  let totalEthAmount = BigInt(0);

  // Calculate total STRK and ETH amounts from `calls`
  calls.forEach((call) => {
    const callAmount = BigInt(call.amount ?? '0');

    if (strkToken && call.contractAddress === strkToken.address) {
      totalStrkAmount += callAmount;
    } else if (ethToken && call.contractAddress === ethToken.address) {
      totalEthAmount += callAmount;
    }
  });

  // Add the `suggestedMaxFee` to the respective token amount
  const maxFee = BigInt(suggestedMaxFee);
  if (feeToken === FeeToken.STRK) {
    totalStrkAmount += maxFee;
  } else if (feeToken === FeeToken.ETH) {
    totalEthAmount += maxFee;
  }

  // Check that balances are sufficient
  const hasSufficientStrk = BigInt(strkBalance) >= totalStrkAmount;
  const hasSufficientEth = BigInt(ethBalance) >= totalEthAmount;

  // Return true only if the selected feeToken has sufficient funds
  return (
    (feeToken === FeeToken.STRK && hasSufficientStrk) ||
    (feeToken === FeeToken.ETH && hasSufficientEth)
  );
}
