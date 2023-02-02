# Changelog


## [1.1.0](https://github.com/ConsenSys/starknet-snap/compare/starknet-snap-v1.0.0...starknet-snap-v1.1.0) (2023-02-02)


### Features

* update the response of stark net get transactions ([#51](https://github.com/ConsenSys/starknet-snap/issues/51)) ([56266a8](https://github.com/ConsenSys/starknet-snap/commit/56266a8fc5db80c0fb84fe50dae1dcf2c4ec9922))

## [1.0.0](https://github.com/ConsenSys/starknet-snap/compare/starknet-snap-v0.12.0...starknet-snap-v1.0.0) (2022-12-15)


### ⚠ BREAKING CHANGES

* starknet.js to v4.17.1 for new account deployment ([#42](https://github.com/ConsenSys/starknet-snap/issues/42))

### Features

* starknet.js to v4.17.1 for new account deployment ([#42](https://github.com/ConsenSys/starknet-snap/issues/42)) ([f0df619](https://github.com/ConsenSys/starknet-snap/commit/f0df6194d149d04c21d9116aa5a3faaa64fa5cca))

## [0.12.0](https://github.com/ConsenSys/starknet-snap/compare/starknet-snap-v0.11.0...starknet-snap-v0.12.0) (2022-11-21)


### Features

* temporarily reverted back to use StarkNet feeder gateway APIs as default provider ([#39](https://github.com/ConsenSys/starknet-snap/issues/39)) ([ed05913](https://github.com/ConsenSys/starknet-snap/commit/ed059130c6b4cddd28965302eb3824529d1328ac))

## [0.11.0](https://github.com/ConsenSys/starknet-snap/compare/starknet-snap-v0.10.0...starknet-snap-v0.11.0) (2022-10-25)


### Features

* added changes to accommodate Voyager txn API responses changes ([#34](https://github.com/ConsenSys/starknet-snap/issues/34)) ([7990de0](https://github.com/ConsenSys/starknet-snap/commit/7990de0cbeadb100fd3d4b85bc3dfa6c7c607b30))

## [0.10.0](https://github.com/ConsenSys/starknet-snap/compare/starknet-snap-v0.9.0...starknet-snap-v0.10.0) (2022-10-11)


### Features

* update to use snap_getBip44Entropy ([#21](https://github.com/ConsenSys/starknet-snap/issues/21)) ([a619c66](https://github.com/ConsenSys/starknet-snap/commit/a619c66c3f2f97b53da4608f6133efd08ce26e34))


### Features

* fixed the starknet.js version to be v4.6.x ([#22](https://github.com/ConsenSys/starknet-snap/issues/22)) ([e71a87c](https://github.com/ConsenSys/starknet-snap/commit/e71a87c3aa4f5945214079e073cabef4e7c2dd0a))

## [0.8.0](https://github.com/ConsenSys/starknet-snap/compare/starknet-snap-v0.7.0...starknet-snap-v0.8.0) (2022-09-21)


### Features

* ensure txns in snap state have the same status and timestamp as… ([#10](https://github.com/ConsenSys/starknet-snap/issues/10)) ([7c6de7c](https://github.com/ConsenSys/starknet-snap/commit/7c6de7c17d67ca9813a7193d4ff17375cb0c1ceb))

## [0.7.0](https://github.com/ConsenSys/starknet-snap/compare/starknet-snap-v0.6.0...starknet-snap-v0.7.0) (2022-09-20)


### Features

* added specific address index in starkNet_createAccount and fixed Dapp to always use 0 ([#7](https://github.com/ConsenSys/starknet-snap/issues/7)) ([0607626](https://github.com/ConsenSys/starknet-snap/commit/0607626a2614ef01b964212ab08cdc225fc226a8))

## [0.6.0](https://github.com/ConsenSys/starknet-snap/compare/starknet-snap-v0.5.1...starknet-snap-v0.6.0) (2022-09-16)


### Features

* set Infura RPC node as the default provider for mainnet ([5d969d0](https://github.com/ConsenSys/starknet-snap/commit/5d969d085e1b4b2b670071757da9240c900c3478))
* updated snap shasum ([43f9cbc](https://github.com/ConsenSys/starknet-snap/commit/43f9cbcde509725cfe73a28fd18c10793221377c))
* updated yarn.lock and temporarily set Sequencer as the default provider for mainnet ([db01340](https://github.com/ConsenSys/starknet-snap/commit/db01340843e24a9f2915334ced77f8e40b13385d))
* upgraded to starknet.js v4.5.0 and set Infura RPC node as the default provider ([d666ac7](https://github.com/ConsenSys/starknet-snap/commit/d666ac76ff02a12e935a24f1ef6a7df83fe10bca))


### Bug Fixes

* createAccount response fields and updated test cases and the ope… ([#4](https://github.com/ConsenSys/starknet-snap/issues/4)) ([6c03853](https://github.com/ConsenSys/starknet-snap/commit/6c0385393658b1d047a29212b6691b3c819451ec))

## [0.5.1](https://github.com/ConsenSys/starknet-snap/compare/starknet-snap-v0.5.0...starknet-snap-v0.5.1) (2022-08-22)


### Bug Fixes

* forced patch increment to allow publish while testing staging ([#158](https://github.com/ConsenSys/starknet-snap/issues/158)) ([183b830](https://github.com/ConsenSys/starknet-snap/commit/183b830e7c78e8facad08e491a5517cbee2f5dc3))

## [0.5.0](https://github.com/ConsenSys/starknet-snap/compare/starknet-snap-v0.4.0...starknet-snap-v0.5.0) (2022-08-22)


### Features

* added input validations and temporarily disabled starkNet_addNe… ([#153](https://github.com/ConsenSys/starknet-snap/issues/153)) ([265d9b3](https://github.com/ConsenSys/starknet-snap/commit/265d9b3f1a0a8b27b701255ae443f708acba5b51))
* removed image URL from Token and added more validations on Toke… ([#147](https://github.com/ConsenSys/starknet-snap/issues/147)) ([bd78e3a](https://github.com/ConsenSys/starknet-snap/commit/bd78e3a16877307594e43491f7f587c24f5f0a05))
* renamed function names and added test cases ([#144](https://github.com/ConsenSys/starknet-snap/issues/144)) ([ece815c](https://github.com/ConsenSys/starknet-snap/commit/ece815caf8b1501fe35590b26b50024c6845cf69))
* resolved sonar lint code smells issues and removed getNonce call ([#149](https://github.com/ConsenSys/starknet-snap/issues/149)) ([aa64804](https://github.com/ConsenSys/starknet-snap/commit/aa64804d118c089473c97be14054b2f484f3845d))

## [0.4.0](https://github.com/ConsenSys/starknet-snap/compare/starknet-snap-v0.3.1...starknet-snap-v0.4.0) (2022-08-08)


### Features

* Initial release of `starknet-snap` with `release-please`
  * Previous versions tracked separately
