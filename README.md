<p align="center">
    <img src=".github/starknet-snap-install.gif">
    <br>
</p>

# Starknet Snap &middot; [![npm version](https://img.shields.io/npm/v/@consensys/starknet-snap.svg?style=flat)](https://www.npmjs.com/package/@consensys/starknet-snap)

The Starknet snap allows users / developers to **deploy Starknet accounts, make transactions on Starknet, and interact with Starknet smart contracts.** It can be connected with any dapp to access Starknet and developers can experiment integrating their dapp with this snap today. 

[Starknet Snap](https://snaps.metamask.io/snap/npm/consensys/starknet-snap)

[Starknet Dapp](https://snaps.consensys.io/starknet)

[Blog Post](https://consensys.io/blog/metamask-integrates-starkware-into-first-of-its-kind-zk-rollup-snap/)

# Development
### Prerequisites

- [MetaMask Flask](https://metamask.io/flask/)
  - ⚠️ You cannot have other versions of MetaMask installed
- Nodejs `16`. We **strongly** recommend you install via [NVM](https://github.com/creationix/nvm) to avoid incompatibility issues between different node projects.
    - Once installed, you should also install [Yarn](http://yarnpkg.com/) with `npm i -g yarn` to make working with this repository easiest.

## Installing

```bash
nvm use
yarn setup
```

## Running

### Snap

⚠️ When snap updates you will need to still reconnect from the dapp to see changes

```bash
# Running Snap via watch mode
yarn workspace @consensys/starknet-snap watch
```

Alternatively you can build and serve the snap manually. This can sometimes be more stable than watch mode but requires
a manual rebuild and serve anytime there is a change on the snap.

```bash
# Building and serving snap manually
yarn workspace @consensys/starknet-snap build
yarn workspace @consensys/starknet-snap serve
```

### UI
```bash
# Running Wallet UI
yarn workspace wallet-ui start
```
```bash
# Running Storybook
yarn workspace wallet-ui storybook
```

- Snap server and debug page: http://localhost:8081/
- Wallet UI dapp: http://localhost:3000/
- Storybook: http://localhost:6006/

# Dapp intergation Guide

### How to install
From the dApp, issue the following RPC request to install the Snap, make sure it is using the latest version
```javascript
provider.request({
  method: 'wallet_requestSnaps',
  params: {
    ["npm:@consensys/starknet-snap"]: { version: "2.2.0"}, //Snap's version
  },
})
```

### Interact with Starknet Snap's Api
From the dApp, issue the following RPC request to interact with the Snap

e.g
```javascript
provider.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: "npm:@consensys/starknet-snap",
    request: {
      method: 'starkNet_getStoredUserAccounts', //Snap method
      params: {
        chainId : "1", //Snap method's parameter
      },
    },
  },
}))
```
### Starknet Snap's Api
The corresponding request payload and response for latest Starknet Snap's Api are documented in the [openrpc spec](https://github.com/Consensys/starknet-snap/blob/starknet-snap-v2.2.0/packages/starknet-snap/openrpc/starknet_snap_api_openrpc.json)

# Licenses

This project is dual-licensed under Apache 2.0 and MIT terms:

- Apache License, Version 2.0, (LICENSE-APACHE or http://www.apache.org/licenses/LICENSE-2.0)
- MIT license (LICENSE-MIT or http://opensource.org/licenses/MIT)

Copyright (c) 2023 ConsenSys Software Inc.
