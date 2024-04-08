export enum Chain {
  Starknet = 'Starknet',
}

export enum DataClient {
  Voyager = 'Voyager',
  StarkScan = 'StarkScan',
}

export type NetworkConfig = {
  [key in string]: string;
};

export type DataClientConfig = {
  read: {
    type: DataClient;
    options: DataClientOptions;
  };
  write?: {
    type: DataClient;
  };
};

export type DataClientOptions = {};

export type StarknetDataClientOptions = DataClientOptions & {
  pageSize: number;
  timeLimitInDay: number;
};

export type TransactionConfig = {
  [Chain.Starknet]: StarknetTransactionConfig;
};

export type StarknetTransactionConfig = {
  dataClient: DataClientConfig & {
    read: {
      options: StarknetDataClientOptions;
    };
  };
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
          options: {
            pageSize: 100,
            timeLimitInDay: 100,
          },
        },
      },
    },
  },
};
