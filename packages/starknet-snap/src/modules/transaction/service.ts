import { Transaction } from "../../types/snapState";
import { TransactionHelper } from "./helpers";
import { ITransactionMgr, ITransactionRepo } from "./types";

export class TransactionService {
    constructor(
        public txnMgr: ITransactionMgr,
        public repository: ITransactionRepo,
    ) { }

    async list(
        address: string,
        chainId: string,
        tokenAddress?: string,
        minTimestamp?: number,
    ): Promise<Transaction[]> {
        try {
            const txnsFromState = await this.repository.list(address, chainId, tokenAddress, minTimestamp);
            const txnsFromChain = await this.txnMgr.list(address, chainId, tokenAddress, minTimestamp);
            const [txns] = TransactionHelper.Merge(txnsFromChain, txnsFromState);
            await this.repository.saveMany(txns);
            return txns.sort((a: Transaction, b: Transaction) => b.timestamp - a.timestamp);
        } catch (e) {
            throw new Error(e);
        }
    }
}