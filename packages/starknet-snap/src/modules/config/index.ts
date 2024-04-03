export enum Chain {
  Starknet = "Starknet",
}

export enum DataClient {
  Voyager = "Voyager",
  StarkScan = "StarkScan",
}

export type NetworkConfig = {
  [key in string]: string;
};

export type DataClientConfig = {
  read: {
    type: DataClient;
  };
  write?: {
    type: DataClient;
  };
};

export type TransactionConfig = {
  [Chain.Starknet]: StarknetTransactionConfig;
};

export type StarknetTransactionConfig = {
  dataClient: DataClientConfig;
};


export type SnapConfig = {
  transaction: TransactionConfig;
};

export const Config: SnapConfig = {
  transaction: {
    [Chain.Starknet]: {
      dataClient: {
        read: {
          type: DataClient.StarkScan,
        }
      },
    },
  },
};
