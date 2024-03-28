# MetaMask Get Starknet

This repository contains a node module that makes it easy to integrate the Starknet Snap through the interface defined by get-starknet-core.


## how to build
Execute the following cmd to build the project in [module federation]([https://webpack.js.org/concepts/module-federation/] ) standard
```bash
yarn build:fed
```


## How to use

```javascript
const walletInstance = new MetaMaskSnapWallet(
  provider, snapVersion
);
```

`provider` refer to the instance from window.ethereum
`snapVersion` refer to the version of the Starknet Snap that is connecting to, "*" for latest version

