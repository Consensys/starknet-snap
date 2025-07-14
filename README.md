<p align="center">
    <img src=".github/starknet-snap-install.gif" alt="Starknet Snap Install">
    <br>
</p>

# Starknet Snap &middot; [![npm version](https://img.shields.io/npm/v/@consensys/starknet-snap.svg?style=flat)](https://www.npmjs.com/package/@consensys/starknet-snap)

The Starknet Snap allows users to **deploy Starknet accounts, make transactions on Starknet, and interact with Starknet dapps**. A blog post describing the effort is available here:

[Blog Post](https://consensys.io/blog/metamask-integrates-starkware-into-first-of-its-kind-zk-rollup-snap/)

## Table of Contents

- [Getting Started](#getting-started)
  - [Install the Snap](#install-the-snap)
  - [Connect to the dApp](#connect-to-the-dapp)
  - [Important Note](#important-note)
- [Development](#development)
  - [Prerequisites](#prerequisites)
  - [Installing](#installing)
  - [Running](#running)
    - [Quickstart](#quickstart)
    - [Snap](#snap)
    - [UI](#ui)
  - [Testing](#testing-dev-snap-on-extarnal-dapps)
- [Dapp Integration Guide](#dapp-integration-guide)
  - [How to Install](#how-to-install)
  - [Interact with Starknet Snap's API](#interact-with-starknet-snaps-api)
- [Tutorial](#tutorial)
- [Licenses](#licenses)

## Getting Started

### Install the Snap

As a user, you can start by installing the snap here:

[Starknet Snap](https://snaps.metamask.io/snap/npm/consensys/starknet-snap)

### Connect to the dApp

You can also connect to the dApp:

[Starknet Dapp](https://snaps.consensys.io/starknet)

This is a sample dApp that uses the Starknet Snap. The dApp code can be found [here](./packages/wallet-ui/). Developers can experiment with integrating this snap using this example.

### Important Note

> As the Starknet ecosystem is multi-wallet, the best approach for dApp developers in terms of interoperability is to build using the official [get-starknet](https://github.com/starknet-io/get-starknet) library. This way, developers can seamlessly make their dapp compatible with this snap and gain access to the MetaMask user base.

## Development

### Prerequisites

- [MetaMask Flask](https://metamask.io/flask/)
  - ⚠️ You cannot have other versions of MetaMask installed
- Node.js `18`. We **strongly** recommend you install via [NVM](https://github.com/creationix/nvm) to avoid incompatibility issues between different node projects.
    - Once installed, you should also install [Yarn](http://yarnpkg.com/) with `npm i -g yarn` to make working with this repository easier.

### Installing

```bash
nvm use
yarn setup
```

### Running

#### Quickstart 

⚠️ When the snap updates, you will need to reconnect from the dapp to see changes.

```bash
# This will start the starknet-snap, the associated dapp and the get-starknet compatibility layer
yarn start
```
This will launch the following: 

- Wallet UI dapp: http://localhost:3000/
- Snap server: http://localhost:8081/
- Get-starknet federation module: http://localhost:8082/

Everything will run together in the same terminal in watch mode.
If you want more control, see the next section

#### Snap

```bash
# Running Snap via watch mode
yarn workspace @consensys/starknet-snap watch
```


Alternatively, you can build and serve the snap manually. This can sometimes be more stable than watch mode but requires a manual rebuild and serve anytime there is a change on the snap.

```bash
# Building and serving snap manually
yarn workspace @consensys/starknet-snap build
yarn workspace @consensys/starknet-snap serve
```

#### UI

You can run the UI alone by running

```bash
# Running Wallet UI
yarn workspace wallet-ui start
```

This will launch the following: 

- Wallet UI dapp: http://localhost:3000/

### Testing Dev Snap on Extarnal dApps

When interacting with dApps in the Starknet ecosystem, the Snap is - most of the times - consumed through the [`get-starknet`](https://github.com/starknet-io/get-starknet) middleware using **Webpack Module Federation**, which dynamically loads the Snap bridge from:

```
https://snaps.consensys.io/starknet/get-starknet/v1/remoteEntry.js
```

This path is **hardcoded in the `get-starknet` npm package**, making it difficult to test a custom Snap version during development.

This setup is useful when you want to test a **new version of the Snap** in **external dApps** (such as [StarkGate](https://starkgate.starknet.io/)) using **MetaMask Flask**, **without requiring allowlisting of the new Snap version**.

To do this, you can use [`mitmproxy`](https://mitmproxy.org/) to **intercept and rewrite** production requests to the Snap CDN and point them to your development deployment instead.

#### ✅ Use Case

- You're testing a Snap update (e.g. for Starknet v0.14)
- You want to test it inside external dApps that load `get-starknet` from the production URL
- You’re using **MetaMask Flask** to bypass allowlist enforcement
- You want to avoid publishing or allowlisting a new Snap version just for testing

#### ⚙️ How to Set It Up

1. **Install `mitmproxy`**:
   ```bash
   brew install mitmproxy
   ```

2. **Create a `rewrite.py` script**:
   ```python
   from mitmproxy import http

   def request(flow: http.HTTPFlow) -> None:
       if "snaps.consensys.io/starknet/get-starknet" in flow.request.pretty_url:
           flow.request.host = "dev.snaps.consensys.io"
   ```

3. **Run mitmproxy with your script**:
   ```bash
   mitmproxy -s rewrite.py
   ```

4. **Configure your system or browser to use `localhost:8080` as an HTTP and HTTPS proxy**

5. **Visit [`http://mitm.it`](http://mitm.it)** in your browser, download the **macOS certificate**, and add it to your **System Keychain** as “Always Trust”

6. Once set up, when the dApp or MetaMask Flask loads:
   ```
   https://snaps.consensys.io/starknet/get-starknet/v1/remoteEntry.js
   ```
   it will **silently be served** from:
   ```
   https://dev.snaps.consensys.io/starknet/get-starknet/v1/remoteEntry.js
   ```

#### 🔒 Notes

- This setup only works with **MetaMask Flask**, which does not enforce Snap allowlisting.
- External dApps will think they’re loading the production Snap, but under the hood they’re executing your dev version.
- This is a great way to validate Snap changes in real-world scenarios without needing Snap Registry changes or full deployment.



## Dapp Integration Guide

This guide is for a dApp that would be compatible only with MetaMask. To create a dApp compatible with all wallets in the Starknet ecosystem, prefer the get-starknet library. A sample dApp can be found [here](https://github.com/PhilippeR26/Cairo1JS/tree/main/src). If you still want to directly interact with the snap follow the tutorial below:

### How to Install

From the dApp, issue the following RPC request to install the Snap. Make sure it is using the latest version.

```javascript
provider.request({
  method: 'wallet_requestSnaps',
  params: {
    ["npm:@consensys/starknet-snap"]: { version: "2.2.0" }, // Snap's version
  },
});
```

### Interact with Starknet Snap's API

From the dApp, issue the following RPC request to interact with the Snap.

```javascript
provider.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: "npm:@consensys/starknet-snap",
    request: {
      method: 'starkNet_getStoredUserAccounts', // Snap method
      params: {
        chainId: "1", // Snap method's parameter
      },
    },
  },
});
```

### Starknet Snap's API

The corresponding request payload and response for the latest Starknet Snap's API are documented in the [openrpc spec](https://github.com/Consensys/starknet-snap/blob/starknet-snap-v2.2.0/packages/starknet-snap/openrpc/starknet_snap_api_openrpc.json).

## Tutorial & Troubleshooting

If after update your funds are stuck on an old Cairo0 address, follow this [tutorial to resolve stuck funds using the old StarkNet Snap](./docs/tutorial-resolving-stuck-funds.md).

## Licenses

This project is dual-licensed under Apache 2.0 and MIT terms:

- Apache License, Version 2.0, (LICENSE-APACHE or http://www.apache.org/licenses/LICENSE-2.0)
- MIT license (LICENSE-MIT or http://opensource.org/licenses/MIT)

Copyright (c) 2024 ConsenSys Software Inc.
