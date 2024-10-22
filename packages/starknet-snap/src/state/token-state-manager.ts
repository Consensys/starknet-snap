import { constants } from 'starknet';
import { assert, min, nonempty, number, string } from 'superstruct';

import type { Erc20Token, SnapState } from '../types/snapState';
import {
  ETHER_MAINNET,
  ETHER_SEPOLIA_TESTNET,
  STRK_MAINNET,
  STRK_SEPOLIA_TESTNET,
} from '../utils/constants';
import type { IFilter } from './filter';
import {
  AddressFilter as BaseAddressFilter,
  ChainIdFilter as BaseChainIdFilter,
} from './filter';
import { StateManager, StateManagerError } from './state-manager';

export type ITokenFilter = IFilter<Erc20Token>;

export class AddressFilter
  extends BaseAddressFilter<Erc20Token>
  implements ITokenFilter {}

export class ChainIdFilter
  extends BaseChainIdFilter<Erc20Token>
  implements ITokenFilter {}

export class TokenStateManager extends StateManager<Erc20Token> {
  protected getCollection(state: SnapState): Erc20Token[] {
    return state.erc20Tokens;
  }

  updateEntity(dataInState: Erc20Token, data: Erc20Token): void {
    assert(data.name, nonempty(string()));
    assert(data.symbol, nonempty(string()));
    assert(data.decimals, min(number(), 0));

    dataInState.name = data.name;
    dataInState.symbol = data.symbol;
    dataInState.decimals = data.decimals;
  }

  #getCompositeKey(data: Erc20Token): string {
    const key1 = BigInt(data.chainId);
    const key2 = BigInt(data.address);
    return `${key1}&${key2}`;
  }

  /**
   * Add default Erc20Token tokens by the given chain id.
   * If the Erc20Token object not exist, it will be added.
   * If the Erc20Token object exist, it will be updated.
   *
   * @param tokens - An array of the Erc20Token object.
   * @returns A Promise that resolves when the operation is complete.
   */
  async addDefaultTokens(tokens: Erc20Token[]): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        // Build a map of the token address to Erc20Token object from the current state.
        const tokenMap = new Map<string, Erc20Token>();
        for (const token of state.erc20Tokens) {
          tokenMap.set(this.#getCompositeKey(token), token);
        }

        // Check if the Erc20Token object already exists in the state. True - update the Erc20Token object, False - insert the Erc20Token object.
        for (const token of tokens) {
          // Same comparison as aove.
          const data = tokenMap.get(this.#getCompositeKey(token));
          if (data === undefined) {
            state.erc20Tokens.push(token);
          } else {
            this.updateEntity(data, token);
          }
        }
      });
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }

  /**
   * Finds a Erc20Token based on the given chainId.
   *
   * @param param - The param object.
   * @param param.address - The contract address of the Erc20Token to search for.
   * @param param.chainId - The chainId of the Erc20Token to search for.
   * @param [state] - The optional SnapState object.
   * @returns A Promise that resolves with the Erc20Token object if found, or null if not found.
   */
  async getToken(
    {
      address,
      chainId,
    }: {
      address: string;
      chainId: string;
    },
    state?: SnapState,
  ): Promise<Erc20Token | null> {
    const filters: ITokenFilter[] = [
      new AddressFilter([address]),
      new ChainIdFilter([chainId]),
    ];
    return await this.find(filters, state);
  }

  /**
   * Updates a Erc20Token object in the state with the given data.
   *
   * @param data - The updated Erc20Token object.
   * @returns A Promise that resolves when the update is complete.
   * @throws {StateManagerError} If there is an error updating the Erc20Token, such as:
   * If the Erc20Token to be updated does not exist in the state.
   */
  async updateToken(data: Erc20Token): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        const dataInState = await this.getToken(
          {
            address: data.address,
            chainId: data.chainId,
          },
          state,
        );

        if (!dataInState) {
          throw new Error(`Token does not exist`);
        }
        this.updateEntity(dataInState, data);
      });
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }

  /**
   * Adds a new Erc20Token object to the state with the given data.
   *
   * @param data - The Erc20Token object to add.
   * @returns A Promise that resolves when the add is complete.
   * @throws {StateManagerError} If there is an error adding the Erc20Token object, such as:
   * If the Erc20Token object to be added already exists in the state.
   */
  async addToken(data: Erc20Token): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        const dataInState = await this.getToken(
          {
            address: data.address,
            chainId: data.chainId,
          },
          state,
        );

        if (dataInState) {
          throw new Error(`Token already exist`);
        }
        state.erc20Tokens.push(data);
      });
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }

  /**
   * Finds the ETH Erc20Token object based on the given chainId.
   *
   * @param param - The param object.
   * @param param.chainId - The chain id to search for.
   * @param [state] - The optional SnapState object.
   * @returns A Promise that resolves with the Erc20Token object if found, or null if not found.
   */
  async getEthToken(
    {
      chainId,
    }: {
      chainId: string;
    },
    state?: SnapState,
  ): Promise<Erc20Token | null> {
    const address = this.#getEthAddress(chainId);
    if (!address) {
      return null;
    }
    return await this.getToken(
      {
        address,
        chainId,
      },
      state,
    );
  }

  /**
   * Finds the STRK Erc20Token object based on the given chainId.
   *
   * @param param - The param object.
   * @param param.chainId - The chain id to search for.
   * @param [state] - The optional SnapState object.
   * @returns A Promise that resolves with the Erc20Token object if found, or null if not found.
   */
  async getStrkToken(
    {
      chainId,
    }: {
      chainId: string;
    },
    state?: SnapState,
  ): Promise<Erc20Token | null> {
    const address = this.#getStrkAddress(chainId);
    if (!address) {
      return null;
    }
    return await this.getToken(
      {
        address,
        chainId,
      },
      state,
    );
  }

  #getEthAddress(chainId: string): string {
    switch (chainId) {
      case constants.StarknetChainId.SN_MAIN:
        return ETHER_MAINNET.address;
      case constants.StarknetChainId.SN_SEPOLIA:
        return ETHER_SEPOLIA_TESTNET.address;
      default:
        return '';
    }
  }

  #getStrkAddress(chainId: string): string {
    switch (chainId) {
      case constants.StarknetChainId.SN_MAIN:
        return STRK_MAINNET.address;
      case constants.StarknetChainId.SN_SEPOLIA:
        return STRK_SEPOLIA_TESTNET.address;
      default:
        return '';
    }
  }

  /**
   * Upsert a Erc20Token object.
   *
   * @param token - The Erc20Token object to upsert.
   */
  async upsertToken(token: Erc20Token): Promise<void> {
    try {
      await this.update(async (state: SnapState) => {
        const dataInState = await this.getToken(
          {
            address: token.address,
            chainId: token.chainId,
          },
          state,
        );
        // eslint-disable-next-line no-negated-condition
        if (!dataInState) {
          state.erc20Tokens.push(token);
        } else {
          this.updateEntity(dataInState, token);
        }
      });
    } catch (error) {
      throw new StateManagerError(error.message);
    }
  }
}
