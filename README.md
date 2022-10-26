<p align="center">
    <img src=".github/starknet-snap-install.gif">
    <br>
</p>

# Starknet Snap &middot; [![npm version](https://img.shields.io/npm/v/@consensys/starknet-snap.svg?style=flat)](https://www.npmjs.com/package/@consensys/starknet-snap)

The StarkNet snap allows developers to **deploy StarkNet accounts, make transactions on StarkNet, and interact with StarkNet smart contracts.** It can be connected with any dapp to access StarkNet and developers can experiment integrating their dapp with this snap today. 

[StarkNet dapp](https://snaps.consensys.net/starknet)

[Blog post](https://consensys.net/blog/metamask/metamask-integrates-starkware-into-first-of-its-kind-zk-rollup-snap/)


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

# Licenses

This project is dual-licensed under Apache 2.0 and MIT terms:

- Apache License, Version 2.0, (LICENSE-APACHE or http://www.apache.org/licenses/LICENSE-2.0)
- MIT license (LICENSE-MIT or http://opensource.org/licenses/MIT)

Copyright (c) 2022 ConsenSys Software Inc.
