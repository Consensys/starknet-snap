# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.13.0](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v0.12.0...wallet-ui-v0.13.0) (2022-09-20)


### Features

* added specific address index in starkNet_createAccount and fixed Dapp to always use 0 ([#7](https://github.com/ConsenSys/starknet-snap/issues/7)) ([0607626](https://github.com/ConsenSys/starknet-snap/commit/0607626a2614ef01b964212ab08cdc225fc226a8))

## [0.12.0](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v0.11.0...wallet-ui-v0.12.0) (2022-09-16)


### Features

* upgraded to starknet.js v4.5.0 and set Infura RPC node as the default provider ([d666ac7](https://github.com/ConsenSys/starknet-snap/commit/d666ac76ff02a12e935a24f1ef6a7df83fe10bca))


### Bug Fixes

* createAccount response fields and updated test cases and the ope… ([#4](https://github.com/ConsenSys/starknet-snap/issues/4)) ([6c03853](https://github.com/ConsenSys/starknet-snap/commit/6c0385393658b1d047a29212b6691b3c819451ec))
* moved react-scripts to devDependencies and updated yarn.lock ([ee320ce](https://github.com/ConsenSys/starknet-snap/commit/ee320ce3e0284b6ba2f1c567b832ba9e49710ff9))
* Theme colors ([aef0dfc](https://github.com/ConsenSys/starknet-snap/commit/aef0dfc91a4fdae4154abf4b9ea39e5107ae9bd4))
* Updated theme colors ([679dbcf](https://github.com/ConsenSys/starknet-snap/commit/679dbcf02f904b34ee38e9cb4404320729d1dcc9))

## [0.11.0](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v0.10.0...wallet-ui-v0.11.0) (2022-08-22)


### Features

* added input validations and temporarily disabled starkNet_addNe… ([#153](https://github.com/ConsenSys/starknet-snap/issues/153)) ([265d9b3](https://github.com/ConsenSys/starknet-snap/commit/265d9b3f1a0a8b27b701255ae443f708acba5b51))
* removed image URL from Token and added more validations on Toke… ([#147](https://github.com/ConsenSys/starknet-snap/issues/147)) ([bd78e3a](https://github.com/ConsenSys/starknet-snap/commit/bd78e3a16877307594e43491f7f587c24f5f0a05))

## [0.11.0-0](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-prerelease-0.9.0-0...wallet-ui-prerelease-0.11.0-0) (2022-08-22)


### Features

* added input validations and temporarily disabled starkNet_addNe… ([#153](https://github.com/ConsenSys/starknet-snap/issues/153)) ([265d9b3](https://github.com/ConsenSys/starknet-snap/commit/265d9b3f1a0a8b27b701255ae443f708acba5b51))
* added request params validation in addErc20Token and test case … ([#137](https://github.com/ConsenSys/starknet-snap/issues/137)) ([36787ae](https://github.com/ConsenSys/starknet-snap/commit/36787ae37556e985c6ed6e1a8b859ef4b588b4a0))
* Added validations for getAccountPrivateKey ([#141](https://github.com/ConsenSys/starknet-snap/issues/141)) ([719191d](https://github.com/ConsenSys/starknet-snap/commit/719191d980985c84bd645d7435480a57c51454dd))
* code revisions by adding type definitions for apiParams and req… ([#134](https://github.com/ConsenSys/starknet-snap/issues/134)) ([2afa44e](https://github.com/ConsenSys/starknet-snap/commit/2afa44e7fcff7998ba9c9bddd49010fc651a757e))
* e2e CI tests improve ([#138](https://github.com/ConsenSys/starknet-snap/issues/138)) ([e3f7f55](https://github.com/ConsenSys/starknet-snap/commit/e3f7f55fd77c3ca27ed82f8a23e31b5e42db9094))
* removed image URL from Token and added more validations on Toke… ([#147](https://github.com/ConsenSys/starknet-snap/issues/147)) ([bd78e3a](https://github.com/ConsenSys/starknet-snap/commit/bd78e3a16877307594e43491f7f587c24f5f0a05))
* removed showConfirmation param in snap endpoints and user input private key ([#128](https://github.com/ConsenSys/starknet-snap/issues/128)) ([8898f5e](https://github.com/ConsenSys/starknet-snap/commit/8898f5e10902de876f07905f2d16e25a548f7540))
* renamed function names and added test cases ([#144](https://github.com/ConsenSys/starknet-snap/issues/144)) ([ece815c](https://github.com/ConsenSys/starknet-snap/commit/ece815caf8b1501fe35590b26b50024c6845cf69))
* resolved sonar lint code smells issues and removed getNonce call ([#149](https://github.com/ConsenSys/starknet-snap/issues/149)) ([aa64804](https://github.com/ConsenSys/starknet-snap/commit/aa64804d118c089473c97be14054b2f484f3845d))
* Sf 281 validations ([#136](https://github.com/ConsenSys/starknet-snap/issues/136)) ([302dd8c](https://github.com/ConsenSys/starknet-snap/commit/302dd8c7cf6cf3be9b4bb9bf25e16d213b663475))
* use starknetjs extensively and upgrade to 3.17.0 ([#126](https://github.com/ConsenSys/starknet-snap/issues/126)) ([d817946](https://github.com/ConsenSys/starknet-snap/commit/d817946580662368670ac66068085fde65c54bf7))
* used starknet.js for deploy, added proxy contract string and nodeUrl, and breaking change on estimateFee response and baseUrl in Network ([#142](https://github.com/ConsenSys/starknet-snap/issues/142)) ([e698d9b](https://github.com/ConsenSys/starknet-snap/commit/e698d9bec349623aa00599cfe861ea987befce95))


### Bug Fixes

* Fixed checksum ([#139](https://github.com/ConsenSys/starknet-snap/issues/139)) ([24e0c6e](https://github.com/ConsenSys/starknet-snap/commit/24e0c6ec4ab27a068d87fa1c41ebc0c99cfd1e55))

## [0.10.0](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v0.9.0...wallet-ui-v0.10.0) (2022-08-08)


### Features

* Initial release of `wallet-ui` with `release-please`
  * Previous versions tracked separately
