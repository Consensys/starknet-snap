import { MetaMaskSnap } from "./snap";

export type IStarknetWalletRpc {
    handleRequest<request, response>(param: request): Promise<response>;
};

export abstract class BaseStarknetWalletRpc implements IStarknetWalletRpc {
    protected snap: MetaMaskSnap;
    constructor(snap: MetaMaskSnap) {
        this.snap = snap;
    }
    abstract handleRequest<request, response>(param: request): Promise<response>;
}

export class WalletSwitchStarknetChain extends BaseStarknetWalletRpc {
    async handleRequest<request, response>(param: request): Promise<response> {
        return true as unknown as response;
    }
}