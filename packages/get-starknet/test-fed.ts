import {  MetaMaskSnap } from './src/snap';
import {  MetaMaskSnapWallet } from './src/wallet';

const init = async() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const provider =  await MetaMaskSnap.GetProvider(window as any) as any;
    const wallet = new MetaMaskSnapWallet(provider, '*');
    
    const address = await wallet.enable();
    console.log("address", address)

    const wallet_switchStarknetChain = await wallet.request( {
        type: 'wallet_switchStarknetChain',
        params: {
            chainId: '0x534e5f4d41494e',
        },
    });
    console.log("wallet_switchStarknetChain", wallet_switchStarknetChain)

    const wallet_addStarknetChain = await wallet.request( {
        type: 'wallet_addStarknetChain',
        params: {
            chainId: '0x534e5f4d41494e',
            chainName: 'StarkNet',
            rpcUrls: ['https://stg-rpc.starknet.io'],
            blockExplorerUrls: ['https://stg-explorer.starknet.io'],
        },
    });
    console.log("wallet_addStarknetChain", wallet_addStarknetChain)

    const message = {
        types: {
            StarkNetDomain: [
                { name: "name", type: "string" },
                { name: "version", type: "felt" },
                { name: "chainId", type: "felt" },
            ],
            Airdrop: [
                { name: "address", type: "felt" },
                { name: "amount", type: "felt" }
            ],
            Validate: [
                { name: "id", type: "felt" },
                { name: "from", type: "felt" },
                { name: "amount", type: "felt" },
                { name: "nameGamer", type: "string" },
                { name: "endDate", type: "felt" },
                { name: "itemsAuthorized", type: "felt*" }, // array of felt
                { name: "chkFunction", type: "selector" }, // name of function
                { name: "rootList", type: "merkletree", contains: "Airdrop" } // root of a merkle tree
            ]
        },
        primaryType: "Validate",
        domain: {
            name: "myDapp", 
            version: "1",
            chainId: "0x534e5f474f45524c49", 
        },
        message: {
            id: "0x0000004f000f",
            from: "0x2c94f628d125cd0e86eaefea735ba24c262b9a441728f63e5776661829a4066",
            amount: "400",
            nameGamer: "Hector26",
            endDate: "0x27d32a3033df4277caa9e9396100b7ca8c66a4ef8ea5f6765b91a7c17f0109c",
            itemsAuthorized: ["0x01", "0x03", "0x0a", "0x0e"],
            chkFunction: "check_authorization",
            rootList: [
                {
                    address: "0x69b49c2cc8b16e80e86bfc5b0614a59aa8c9b601569c7b80dde04d3f3151b79",
                    amount: "1554785",
                }
            ]
        },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    const signData = await wallet.account.signMessage(message)
    console.log("signData", signData)
}
init()
