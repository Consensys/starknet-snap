# MetaMask Get Starknet

This repository contains a node module that makes it easy to integrate the Starknet Snap through the generic IStarknetWindowObject.

## Usage

```javascript
import { MetaMaskSnapWallet } from '@consensys/get-starknet';

const walletInstance = new MetaMaskSnapWallet(
  provider, snapVersion
);
```

`provider` refer to the instance from window.ethereum
`snapVersion` refer to the version of the snap that is interacting with
