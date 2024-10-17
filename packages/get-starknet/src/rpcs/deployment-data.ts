import type { RpcTypeToMessageMap } from 'get-starknet-core';

import { createStarkError, WalletRpcError, WalletRpcErrorCode } from '../utils/error';
import { StarknetWalletRpc } from '../utils/rpc';
import { CairoVersion, Calldata, CallData, hash } from 'starknet';

export type WalletDeploymentDataMethod = 'wallet_deploymentData';
type Params = RpcTypeToMessageMap[WalletDeploymentDataMethod]['params'];
type Result = RpcTypeToMessageMap[WalletDeploymentDataMethod]['result'];

export const Cairo0ClassHash = '';
export const Cairo1ClassHash = '';

const Guardian = '0';
const Cairo0 = '0';
const Cairo1 = '1';

export class WalletDeploymentData extends StarknetWalletRpc {

    protected getDeployAccountCalldata(
        publicKey: string,
        cairoVersion: CairoVersion,
    ): Calldata {
        switch (cairoVersion) {
            case Cairo1:
                return CallData.compile({
                    signer: publicKey,
                    guardian: Guardian,
                });
            case Cairo0:
                return CallData.compile({
                    implementation: Cairo0ClassHash,
                    selector: hash.getSelectorFromName('initialize'),
                    calldata: CallData.compile({ signer: publicKey, guardian: Guardian }),
                });
            default:
                throw new Error(`Unsupported Cairo version: ${cairoVersion}`);
        }
    };

    async handleRequest(_param: Params): Promise<Result> {
        const account = await this.wallet.snap.recoverDefaultAccount(this.wallet.chainId);

        // Edge case: contract Cairo 0 and  Cairo 1 are not deployed, but Cairo 0 is has some ETH balance left behind
        if (account.upgradeRequired && account.deployRequired) {
            new WalletRpcError(message, code);
        }

        const carioVersion = account.upgradeRequired ? Cairo1 : Cairo0;

        if (!account.deployRequired) {
            throw createStarkError(WalletRpcErrorCode.AccountAlreadyDeployed);
        }


        return {
            address: account.address,
            class_hash: PROXY_CONTRACT_HASH,
            salt: account.addressSalt,
            calldata: callData,
            version: 0,
        };
    }
}
