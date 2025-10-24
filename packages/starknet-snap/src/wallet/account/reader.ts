import { hexToString } from '../../utils';
import { ETHER_MAINNET } from '../../utils/constants';
import { ContractReader } from '../../utils/contract';
import type { CairoAccountContract } from './contract';

export class AccountContractReader extends ContractReader {
  /**
   * Get the version of the account contract.
   *
   * @param cairoContract - The `CairoAccountContract` object to get the version of.
   * @returns A promise that resolves to the version of the contract.
   */
  async getVersion(cairoContract: CairoAccountContract): Promise<string> {
    const resp = await this.callContract({
      contractAddress: cairoContract.address,
      entrypoint: cairoContract.contractMethodMap.getVersion,
    });

    return hexToString(resp[0]);
  }

  /**
   * Get the ETH balance of the account contract.
   *
   * @param cairoContract - The `CairoAccountContract` object to get the balance of.
   * @returns A promise that resolves to the balance of the contract.
   */
  async getEthBalance(cairoContract: CairoAccountContract): Promise<bigint> {
    const resp = await this.callContract({
      contractAddress: ETHER_MAINNET.address,
      entrypoint: 'balanceOf',
      calldata: [cairoContract.address],
    });
    return BigInt(resp[0]);
  }
}
