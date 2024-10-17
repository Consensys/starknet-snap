export type MetaMaskProvider = {
  request(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<unknown>;
};

export type AccContract = {
  addressSalt: string;
  publicKey: string; // in hex
  address: string; // in hex
  addressIndex: number;
  derivationPath: string;
  deployTxnHash: string; // in hex
  chainId: string; // in hex
  upgradeRequired?: boolean;
  deployRequired?: boolean;
};

export type Network = {
  name: string;
  chainId: string; // in hex
  baseUrl: string;
  nodeUrl: string;
  voyagerUrl: string;
  accountClassHash: string; // in hex
  useOldAccounts?: boolean;
};

export type DeploymentData = {
  address: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  class_hash: string;
  salt: string;
  calldata: string[];
  version: 0 | 1;
};

export type RequestSnapResponse = {
  [key in string]: {
    enabled: boolean;
    version: string;
    id: string;
    blocked: boolean;
  };
};
