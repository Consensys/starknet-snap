export type VoyagerTransactionItem = {
  actualFee: string;
  blockNumber: number;
  classAlias: null | string;
  classHash: null | string;
  contractAddress: string;
  contractAlias: null | string;
  hash: string;
  index: number;
  l1VerificationHash: string;
  status: string;
  timestamp: number;
  type: string;
};

export type VoyagerTransactions = {
  items: VoyagerTransactionItem[];
  lastPage: number;
};
