import {
  type AddStarknetChainParameters,
  IStarknetWindowObject,
  type RpcMessage,
  type SwitchStarknetChainParameter,
  type WalletEvents,
  type WatchAssetParameters,
} from 'get-starknet-core';
import { MetaMaskAccount } from './accounts';
import { MetaMaskSigner } from './signer';
import { MetaMaskSnap } from './snap';
import { MetaMaskProvider as MetaMaskProviderSnap } from './type';
import { AccountInterface, RpcProvider as Provider, ProviderInterface } from 'starknet';


interface MetaMaskProvider {
  isMetaMask: boolean
  request(options: { method: string }): Promise<void>
}

function isMetaMaskProvider(obj: unknown): obj is MetaMaskProvider {
  return (
    obj !== null &&
    typeof obj === "object" &&
    obj.hasOwnProperty("isMetaMask") &&
    obj.hasOwnProperty("request")
  )
}

async function getProvider(windowObject: Record<string, unknown>) {
  const provider = await waitForMetaMaskProvider(windowObject, { retries: 3 })
  return provider
}

function detectMetaMaskProvider(
  windowObject: Record<string, unknown>,
  { timeout = 3000 } = {},
): Promise<MetaMaskProvider | null> {
  let handled = false
  return new Promise<MetaMaskProvider | null>((resolve) => {
    const handleEIP6963Provider = (event: CustomEvent) => {
      const { info, provider } = event.detail
      const rdnsCheck =
        info.rdns === "io.metamask" || info.rdns === "io.metamask.flask"
      if (rdnsCheck && isMetaMaskProvider(provider)) {
        resolve(provider)
        handled = true
      }
    }

    if (typeof windowObject.addEventListener === "function") {
      windowObject.addEventListener(
        "eip6963:announceProvider",
        handleEIP6963Provider,
      )
    }

    setTimeout(() => {
      if (!handled) {
        resolve(null)
      }
    }, timeout)

    // Notify event listeners and other parts of the dapp that a provider is requested.
    if (typeof windowObject.dispatchEvent === "function") {
      windowObject.dispatchEvent(new Event("eip6963:requestProvider"))
    }
  })
}

async function waitForMetaMaskProvider(
  windowObject: Record<string, unknown>,
  options: { timeout?: number; retries?: number } = {},
): Promise<MetaMaskProvider | null> {
  const { timeout = 3000, retries = 0 } = options

  let provider: MetaMaskProvider | null = null
  try {
    provider = await detectMetaMaskProvider(windowObject, { timeout })
  } catch {
    // Silent error - do nothing
  }

  if (provider) {
    return provider
  }

  if (retries === 0) {
    return null
  }

  provider = await waitForMetaMaskProvider({ timeout, retries: retries - 1 })
  return provider
}

export class MetaMaskSnapWallet implements IStarknetWindowObject {
  id: string;
  name: string;
  snapVersion: string;
  version: string;
  icon: string;
  account?: AccountInterface | undefined;
  provider?: ProviderInterface | undefined;
  selectedAddress?: string | undefined;
  chainId?: string | undefined;
  isConnected?: boolean;

  snap: MetaMaskSnap;
  metamaskProvider: MetaMaskProviderSnap;

  private static readonly cairoVersion = '0';
  private static readonly SNAPI_ID =  process.env.SNAP_ID ?? "npm:@consensys/starknet-snap";

  constructor(snapVersion = '*') {
    this.id = 'metamask';
    this.name = 'Metamask';
    this.snapVersion = snapVersion;
    this.version = 'v1.0.0';
    this.icon = `data:image/svg+xml;utf8;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMTIiIGhlaWdodD0iMTg5IiB2aWV3Qm94PSIwIDAgMjEyIDE4OSI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cG9seWdvbiBmaWxsPSIjQ0RCREIyIiBwb2ludHM9IjYwLjc1IDE3My4yNSA4OC4zMTMgMTgwLjU2MyA4OC4zMTMgMTcxIDkwLjU2MyAxNjguNzUgMTA2LjMxMyAxNjguNzUgMTA2LjMxMyAxODAgMTA2LjMxMyAxODcuODc1IDg5LjQzOCAxODcuODc1IDY4LjYyNSAxNzguODc1Ii8+PHBvbHlnb24gZmlsbD0iI0NEQkRCMiIgcG9pbnRzPSIxMDUuNzUgMTczLjI1IDEzMi43NSAxODAuNTYzIDEzMi43NSAxNzEgMTM1IDE2OC43NSAxNTAuNzUgMTY4Ljc1IDE1MC43NSAxODAgMTUwLjc1IDE4Ny44NzUgMTMzLjg3NSAxODcuODc1IDExMy4wNjMgMTc4Ljg3NSIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgMjU2LjUgMCkiLz48cG9seWdvbiBmaWxsPSIjMzkzOTM5IiBwb2ludHM9IjkwLjU2MyAxNTIuNDM4IDg4LjMxMyAxNzEgOTEuMTI1IDE2OC43NSAxMjAuMzc1IDE2OC43NSAxMjMuNzUgMTcxIDEyMS41IDE1Mi40MzggMTE3IDE0OS42MjUgOTQuNSAxNTAuMTg4Ii8+PHBvbHlnb24gZmlsbD0iI0Y4OUMzNSIgcG9pbnRzPSI3NS4zNzUgMjcgODguODc1IDU4LjUgOTUuMDYzIDE1MC4xODggMTE3IDE1MC4xODggMTIzLjc1IDU4LjUgMTM2LjEyNSAyNyIvPjxwb2x5Z29uIGZpbGw9IiNGODlEMzUiIHBvaW50cz0iMTYuMzEzIDk2LjE4OCAuNTYzIDE0MS43NSAzOS45MzggMTM5LjUgNjUuMjUgMTM5LjUgNjUuMjUgMTE5LjgxMyA2NC4xMjUgNzkuMzEzIDU4LjUgODMuODEzIi8+PHBvbHlnb24gZmlsbD0iI0Q4N0MzMCIgcG9pbnRzPSI0Ni4xMjUgMTAxLjI1IDkyLjI1IDEwMi4zNzUgODcuMTg4IDEyNiA2NS4yNSAxMjAuMzc1Ii8+PHBvbHlnb24gZmlsbD0iI0VBOEQzQSIgcG9pbnRzPSI0Ni4xMjUgMTAxLjgxMyA2NS4yNSAxMTkuODEzIDY1LjI1IDEzNy44MTMiLz48cG9seWdvbiBmaWxsPSIjRjg5RDM1IiBwb2ludHM9IjY1LjI1IDEyMC4zNzUgODcuNzUgMTI2IDk1LjA2MyAxNTAuMTg4IDkwIDE1MyA2NS4yNSAxMzguMzc1Ii8+PHBvbHlnb24gZmlsbD0iI0VCOEYzNSIgcG9pbnRzPSI2NS4yNSAxMzguMzc1IDYwLjc1IDE3My4yNSA5MC41NjMgMTUyLjQzOCIvPjxwb2x5Z29uIGZpbGw9IiNFQThFM0EiIHBvaW50cz0iOTIuMjUgMTAyLjM3NSA5NS4wNjMgMTUwLjE4OCA4Ni42MjUgMTI1LjcxOSIvPjxwb2x5Z29uIGZpbGw9IiNEODdDMzAiIHBvaW50cz0iMzkuMzc1IDEzOC45MzggNjUuMjUgMTM4LjM3NSA2MC43NSAxNzMuMjUiLz48cG9seWdvbiBmaWxsPSIjRUI4RjM1IiBwb2ludHM9IjEyLjkzOCAxODguNDM4IDYwLjc1IDE3My4yNSAzOS4zNzUgMTM4LjkzOCAuNTYzIDE0MS43NSIvPjxwb2x5Z29uIGZpbGw9IiNFODgyMUUiIHBvaW50cz0iODguODc1IDU4LjUgNjQuNjg4IDc4Ljc1IDQ2LjEyNSAxMDEuMjUgOTIuMjUgMTAyLjkzOCIvPjxwb2x5Z29uIGZpbGw9IiNERkNFQzMiIHBvaW50cz0iNjAuNzUgMTczLjI1IDkwLjU2MyAxNTIuNDM4IDg4LjMxMyAxNzAuNDM4IDg4LjMxMyAxODAuNTYzIDY4LjA2MyAxNzYuNjI1Ii8+PHBvbHlnb24gZmlsbD0iI0RGQ0VDMyIgcG9pbnRzPSIxMjEuNSAxNzMuMjUgMTUwLjc1IDE1Mi40MzggMTQ4LjUgMTcwLjQzOCAxNDguNSAxODAuNTYzIDEyOC4yNSAxNzYuNjI1IiB0cmFuc2Zvcm09Im1hdHJpeCgtMSAwIDAgMSAyNzIuMjUgMCkiLz48cG9seWdvbiBmaWxsPSIjMzkzOTM5IiBwb2ludHM9IjcwLjMxMyAxMTIuNSA2NC4xMjUgMTI1LjQzOCA4Ni4wNjMgMTE5LjgxMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgMTUwLjE4OCAwKSIvPjxwb2x5Z29uIGZpbGw9IiNFODhGMzUiIHBvaW50cz0iMTIuMzc1IC41NjMgODguODc1IDU4LjUgNzUuOTM4IDI3Ii8+PHBhdGggZmlsbD0iIzhFNUEzMCIgZD0iTTEyLjM3NTAwMDIsMC41NjI1MDAwMDggTDIuMjUwMDAwMDMsMzEuNTAwMDAwNSBMNy44NzUwMDAxMiw2NS4yNTAwMDEgTDMuOTM3NTAwMDYsNjcuNTAwMDAxIEw5LjU2MjUwMDE0LDcyLjU2MjUgTDUuMDYyNTAwMDgsNzYuNTAwMDAxMSBMMTEuMjUsODIuMTI1MDAxMiBMNy4zMTI1MDAxMSw4NS41MDAwMDEzIEwxNi4zMTI1MDAyLDk2Ljc1MDAwMTQgTDU4LjUwMDAwMDksODMuODEyNTAxMiBDNzkuMTI1MDAxMiw2Ny4zMTI1MDA0IDg5LjI1MDAwMTMsNTguODc1MDAwMyA4OC44NzUwMDEzLDU4LjUwMDAwMDkgQzg4LjUwMDAwMTMsNTguMTI1MDAwOSA2My4wMDAwMDA5LDM4LjgxMjUwMDYgMTIuMzc1MDAwMiwwLjU2MjUwMDAwOCBaIi8+PGcgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgMjExLjUgMCkiPjxwb2x5Z29uIGZpbGw9IiNGODlEMzUiIHBvaW50cz0iMTYuMzEzIDk2LjE4OCAuNTYzIDE0MS43NSAzOS45MzggMTM5LjUgNjUuMjUgMTM5LjUgNjUuMjUgMTE5LjgxMyA2NC4xMjUgNzkuMzEzIDU4LjUgODMuODEzIi8+PHBvbHlnb24gZmlsbD0iI0Q4N0MzMCIgcG9pbnRzPSI0Ni4xMjUgMTAxLjI1IDkyLjI1IDEwMi4zNzUgODcuMTg4IDEyNiA2NS4yNSAxMjAuMzc1Ii8+PHBvbHlnb24gZmlsbD0iI0VBOEQzQSIgcG9pbnRzPSI0Ni4xMjUgMTAxLjgxMyA2NS4yNSAxMTkuODEzIDY1LjI1IDEzNy44MTMiLz48cG9seWdvbiBmaWxsPSIjRjg5RDM1IiBwb2ludHM9IjY1LjI1IDEyMC4zNzUgODcuNzUgMTI2IDk1LjA2MyAxNTAuMTg4IDkwIDE1MyA2NS4yNSAxMzguMzc1Ii8+PHBvbHlnb24gZmlsbD0iI0VCOEYzNSIgcG9pbnRzPSI2NS4yNSAxMzguMzc1IDYwLjc1IDE3My4yNSA5MCAxNTMiLz48cG9seWdvbiBmaWxsPSIjRUE4RTNBIiBwb2ludHM9IjkyLjI1IDEwMi4zNzUgOTUuMDYzIDE1MC4xODggODYuNjI1IDEyNS43MTkiLz48cG9seWdvbiBmaWxsPSIjRDg3QzMwIiBwb2ludHM9IjM5LjM3NSAxMzguOTM4IDY1LjI1IDEzOC4zNzUgNjAuNzUgMTczLjI1Ii8+PHBvbHlnb24gZmlsbD0iI0VCOEYzNSIgcG9pbnRzPSIxMi45MzggMTg4LjQzOCA2MC43NSAxNzMuMjUgMzkuMzc1IDEzOC45MzggLjU2MyAxNDEuNzUiLz48cG9seWdvbiBmaWxsPSIjRTg4MjFFIiBwb2ludHM9Ijg4Ljg3NSA1OC41IDY0LjY4OCA3OC43NSA0Ni4xMjUgMTAxLjI1IDkyLjI1IDEwMi45MzgiLz48cG9seWdvbiBmaWxsPSIjMzkzOTM5IiBwb2ludHM9IjcwLjMxMyAxMTIuNSA2NC4xMjUgMTI1LjQzOCA4Ni4wNjMgMTE5LjgxMyIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgMTUwLjE4OCAwKSIvPjxwb2x5Z29uIGZpbGw9IiNFODhGMzUiIHBvaW50cz0iMTIuMzc1IC41NjMgODguODc1IDU4LjUgNzUuOTM4IDI3Ii8+PHBhdGggZmlsbD0iIzhFNUEzMCIgZD0iTTEyLjM3NTAwMDIsMC41NjI1MDAwMDggTDIuMjUwMDAwMDMsMzEuNTAwMDAwNSBMNy44NzUwMDAxMiw2NS4yNTAwMDEgTDMuOTM3NTAwMDYsNjcuNTAwMDAxIEw5LjU2MjUwMDE0LDcyLjU2MjUgTDUuMDYyNTAwMDgsNzYuNTAwMDAxMSBMMTEuMjUsODIuMTI1MDAxMiBMNy4zMTI1MDAxMSw4NS41MDAwMDEzIEwxNi4zMTI1MDAyLDk2Ljc1MDAwMTQgTDU4LjUwMDAwMDksODMuODEyNTAxMiBDNzkuMTI1MDAxMiw2Ny4zMTI1MDA0IDg5LjI1MDAwMTMsNTguODc1MDAwMyA4OC44NzUwMDEzLDU4LjUwMDAwMDkgQzg4LjUwMDAwMTMsNTguMTI1MDAwOSA2My4wMDAwMDA5LDM4LjgxMjUwMDYgMTIuMzc1MDAwMiwwLjU2MjUwMDAwOCBaIi8+PC9nPjwvZz48L3N2Zz4=`;
    this.provider = undefined;
    this.chainId = undefined;
    this.account = undefined;
    this.selectedAddress = undefined;
    this.isConnected = false;
    
  }

  async init(windowObject: Record<string, unknown>) {
    this.metamaskProvider = await getProvider(windowObject);
    this.snap = new MetaMaskSnap(MetaMaskSnapWallet.SNAPI_ID, this.snapVersion, this.metamaskProvider);
  }

  async request<T extends RpcMessage>(call: Omit<T, 'result'>): Promise<T['result']> {
    if (call.type === 'wallet_switchStarknetChain') {
      const params = call.params as SwitchStarknetChainParameter;
      const result = await this.snap.switchNetwork(params.chainId);
      if (result === true) {
        await this.enable();
      }
      return result as unknown as T['result'];
    }

    if (call.type === 'wallet_addStarknetChain') {
      const params = call.params as AddStarknetChainParameters;
      const currentNetwork = await this.#getNetwork();
      if (currentNetwork?.chainId === params.chainId) {
        return true as unknown as T['result'];
      }
      const result = await this.snap.addStarknetChain(
        params.chainName,
        params.chainId,
        params.rpcUrls ? params.rpcUrls[0] : '',
        params.blockExplorerUrls ? params.blockExplorerUrls[0] : '',
      );
      return result as unknown as T['result'];
    }

    if (call.type === 'wallet_watchAsset') {
      const params = call.params as WatchAssetParameters;
      const result =
        (await this.snap.watchAsset(
          params.options.address,
          params.options.name,
          params.options.symbol,
          params.options.decimals,
        )) ?? false;
      return result as unknown as T['result'];
    }

    throw new Error(`Method ${call.type} not implemented`);
  }

  async #getNetwork() {
    return await this.snap.getCurrentNetwork();
  }

  async #getWalletAddress(chainId: string) {
    //address always same regardless network, only single address provided
    if (this.selectedAddress) {
      return this.selectedAddress;
    }

    const accountResponse = await this.snap.recoverDefaultAccount(chainId);

    if (!accountResponse || !accountResponse.address) {
      throw new Error('Unable to recover accounts');
    }

    return accountResponse.address;
  }

  async #getRPCProvider(network: { chainId: string; nodeUrl: string }) {
    return new Provider({
      nodeUrl: network.nodeUrl,
    });
  }

  async #getAccountInstance(address: string, provider: ProviderInterface) {
    const signer = new MetaMaskSigner(this.snap, address);

    return new MetaMaskAccount(this.snap, provider, address, signer, MetaMaskSnapWallet.cairoVersion);
  }

  async enable() {
    await this.snap.installIfNot();
    this.isConnected = true;
    const network = await this.#getNetwork();
    if (!network) {
      throw new Error('Current network not found');
    }
    this.chainId = network.chainId;
    this.selectedAddress = await this.#getWalletAddress(this.chainId);
    if (!this.selectedAddress) {
      throw new Error('Address not found');
    }
    this.provider = await this.#getRPCProvider(network);
    this.account = await this.#getAccountInstance(this.selectedAddress, this.provider);

    return [this.selectedAddress];
  }




  async isPreauthorized() {
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  on<E extends WalletEvents>() {
    throw new Error('Method not supported');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  off<E extends WalletEvents>() {
    throw new Error('Method not supported');
  }
}
