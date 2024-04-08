export enum Chain {
  Starknet = 'Starknet',
}

export enum DataClient {
  Voyager = 'Voyager',
  StarkScan = 'StarkScan',
  Infura = 'Infura',
}

export enum DataClientType {
  Restful = 'Restful',
  Rpc = 'Rpc',
}

export type NetworkConfig = {
  [key in string]: string;
};

export type DataClientOptions = {
  apiKey: string;
};

export type DataClientConfig = {
  read: {
    [key in DataClientType]: {
      type: DataClient;
      options: DataClientOptions;
    };
  };
  write?: {
    [key in DataClientType]: {
      type: DataClient;
    };
  };
};

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
      [DataClientType.Restful]: {
        type: DataClient;
        options: StarknetDataClientOptions;
      };
      [DataClientType.Rpc]: {
        type: DataClient;
        options: DataClientOptions;
      };
    };
  };
};

export type SnapConfig = {
  network: Chain;
  transaction: TransactionConfig;
};

export const Config: SnapConfig = {
  network: Chain.Starknet,
  transaction: {
    [Chain.Starknet]: {
      dataClient: {
        read: {
          [DataClientType.Restful]: {
            type: DataClient.StarkScan,
            options: {
              pageSize: 100,
              timeLimitInDay: 100,
              apiKey: process.env.STARKSCAN_API_KEY,
            },
          },
          [DataClientType.Rpc]: {
            type: DataClient.Infura,
            options: {
              apiKey: process.env.INFURA_API_KEY,
            },
          },
        },
      },
    },
  },
};
