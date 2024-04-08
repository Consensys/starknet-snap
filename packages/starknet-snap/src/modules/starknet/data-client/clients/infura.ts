import { IReadDataClient } from "../types";
import { Transaction } from '../../../../types/snapState';

class Infura implements IReadDataClient {
    constructor() {
        console.log('Infura constructor');
    }

    getTxns(address: string): Promise<Transaction[]> {
        throw new Error('Method not implemented.');
    }

    getDeployAccountTxn(address: string): Promise<Transaction> {
        throw new Error('Method not implemented.');
    }

    getTxn(hash: string): Promise<Transaction> {
        throw new Error('Method not implemented.');

    }

}