# Changelog

## [2.11.0](https://github.com/Consensys/starknet-snap/compare/starknet-snap-v2.10.1...starknet-snap-v2.11.0) (2024-10-28)


### Features

* Add custom error code to meet get-starknet v4 exception format ([#374](https://github.com/Consensys/starknet-snap/issues/374)) ([e61eb8b](https://github.com/Consensys/starknet-snap/commit/e61eb8bb4b7b1e2af50ed02bbdd4dac517867710))
* Add new RPC `starkNet_getDeploymentData` to support get-starknet v4 ([#381](https://github.com/Consensys/starknet-snap/issues/381)) ([a034bcf](https://github.com/Consensys/starknet-snap/commit/a034bcfb3b60242559e57f7ffbba9a7359444f1f))
* Add UI divider and hyperlink the address to the explorer on the UI dialog ([#405](https://github.com/Consensys/starknet-snap/issues/405), [#404](https://github.com/Consensys/starknet-snap/issues/404)) ([a77fede](https://github.com/Consensys/starknet-snap/commit/a77fedebcc3674549b117eb865d500c6d5209c7f))
* Refactor RPC `starkNet_addErc20Token` to have superstruct validation ([#388](https://github.com/Consensys/starknet-snap/issues/388)) ([157b5ad](https://github.com/Consensys/starknet-snap/commit/157b5ad2930fe4dfa0c154596c942c295d9c4d99))
* Refactor RPC `starkNet_declareContract` to have superstruct validation ([#398](https://github.com/Consensys/starknet-snap/issues/398)) ([5617ccf](https://github.com/Consensys/starknet-snap/commit/5617ccf85af58943313ef81bf3a03deed0c4eb0f))
* Refactor RPC `starkNet_switchNetwork` to have superstruct validation ([#369](https://github.com/Consensys/starknet-snap/issues/369), [#373](https://github.com/Consensys/starknet-snap/issues/373), [#368](https://github.com/Consensys/starknet-snap/issues/368)) ([d0384bf](https://github.com/Consensys/starknet-snap/commit/d0384bf9c9476c2168586cf7dc48fe6adb965bcb))


### Bug Fixes

* Fix incorrect params passed to RPCs `starkNet_signDeclareTransaction`, `starkNet_verifySignedMessage`, `starkNet_declareContract` and `starkNet_getDeploymentData` ([#401](https://github.com/Consensys/starknet-snap/issues/401)) ([a834beb](https://github.com/Consensys/starknet-snap/commit/a834beb4bc0bb42f2f21b50f1cbb5a961e938b1e))
* Fix RPC `starkNet_executeTxn` storing in-correct state data if the params `calls`  is not an array ([#376](https://github.com/Consensys/starknet-snap/issues/376)) ([508b958](https://github.com/Consensys/starknet-snap/commit/508b9584b534bd93235296fd36328fbaaa52334b))

## [2.10.1](https://github.com/Consensys/starknet-snap/compare/starknet-snap-v2.10.0...starknet-snap-v2.10.1) (2024-10-02)


### Bug Fixes

* fix snap homepage screen error if the logger is not initialised ([#363](https://github.com/Consensys/starknet-snap/issues/363)) ([6117509](https://github.com/Consensys/starknet-snap/commit/61175090256aa3d614b0e850947e0f90b5e05908))

## [2.10.0](https://github.com/Consensys/starknet-snap/compare/starknet-snap-v2.9.0...starknet-snap-v2.10.0) (2024-09-20)


### Features

* support STRK token for the gas fee in sending transaction and estimate fee ([#271](https://github.com/Consensys/starknet-snap/issues/271)) ([8f50a33](https://github.com/Consensys/starknet-snap/commit/8f50a33ca7cdce88c6853ce1945cd7f7a7b24fae))
* change default network to mainnet ([#357](https://github.com/Consensys/starknet-snap/issues/357)) ([b2eccb7](https://github.com/Consensys/starknet-snap/commit/b2eccb74e958d2087917484469cb2139e2f537b7))
* bump starknet.js to v6.11.0 ([#296](https://github.com/Consensys/starknet-snap/issues/296)) ([e298244](https://github.com/Consensys/starknet-snap/commit/e298244a5e68e2809ab6367330e104c53ca5c861))
* allow multiple consecutive transactions ([#289](https://github.com/Consensys/starknet-snap/issues/289)) ([5a501f9](https://github.com/Consensys/starknet-snap/commit/5a501f9aae7c3cdf041f479eac38f4a1e82855e9))

## [2.9.0](https://github.com/Consensys/starknet-snap/compare/starknet-snap-v2.8.0...starknet-snap-v2.9.0) (2024-07-16)


### Features

* clean up and update dependency ([#259](https://github.com/Consensys/starknet-snap/issues/259)) ([fcb83e1](https://github.com/Consensys/starknet-snap/commit/fcb83e128fd4e483cdf9f4670e4e70e1d3876f7a))


### Bug Fixes

* non zero balance on non deployed cairo 0 account ([#276](https://github.com/Consensys/starknet-snap/issues/276)) ([d9beafe](https://github.com/Consensys/starknet-snap/commit/d9beafe45b304685581162ef9247a31919eb7556))
* remove get balance from createAccount ([#272](https://github.com/Consensys/starknet-snap/issues/272)) ([02b92f9](https://github.com/Consensys/starknet-snap/commit/02b92f988476dd621e2c48c4b3f1733e55a5878c))
* validateAccountRequireUpgradeOrDeploy condition check ([#288](https://github.com/Consensys/starknet-snap/issues/288)) ([0f49ab0](https://github.com/Consensys/starknet-snap/commit/0f49ab09b57735158a74eed715cc6665c372ee6d))

## [2.8.0](https://github.com/Consensys/starknet-snap/compare/starknet-snap-v2.7.0...starknet-snap-v2.8.0) (2024-06-21)


### Features

* add waiting mode for create account ([#251](https://github.com/Consensys/starknet-snap/issues/251)) ([0c91142](https://github.com/Consensys/starknet-snap/commit/0c911420595193672885d97d12769570a96316ce))
* cairo 1 support ([#202](https://github.com/Consensys/starknet-snap/issues/202)) ([c5e36e9](https://github.com/Consensys/starknet-snap/commit/c5e36e9a6f3c63155d990bf519cd6af6eb3cd006))
* sf-640 revamp cicd workflow ([#255](https://github.com/Consensys/starknet-snap/issues/255)) ([6faaf02](https://github.com/Consensys/starknet-snap/commit/6faaf024bd0b8112e5cea930a2bf8aad564a9454))
* show upgrade dialog on get-starknet calls ([#247](https://github.com/Consensys/starknet-snap/issues/247)) ([4d8a2d7](https://github.com/Consensys/starknet-snap/commit/4d8a2d7948459033c91991c357f3fe2f620fe46b))


### Bug Fixes

* ensure account deployment for executTxn in get-starknet  ([#250](https://github.com/Consensys/starknet-snap/issues/250)) ([c98f2c7](https://github.com/Consensys/starknet-snap/commit/c98f2c74f5983736dedb960a5bf2ce57d9a3f99c))

## [2.7.0](https://github.com/Consensys/starknet-snap/compare/starknet-snap-v2.6.2...starknet-snap-v2.7.0) (2024-05-01)


### Features

* add get starknet package ([#186](https://github.com/Consensys/starknet-snap/issues/186)) ([c44c00d](https://github.com/Consensys/starknet-snap/commit/c44c00d3340191d4b276579556c613308c32cc1d))
* bump starknetjs to 6.7.0 ([#219](https://github.com/Consensys/starknet-snap/issues/219)) ([a07c3f1](https://github.com/Consensys/starknet-snap/commit/a07c3f1b852389d2369320fbcf9258ff73860b69))
* sf 612 add alchemy provider ([#236](https://github.com/Consensys/starknet-snap/issues/236)) ([499f59d](https://github.com/Consensys/starknet-snap/commit/499f59dc05da5850f9b71d446267dcb62e079748))
* sf 613 add cicd support for alchemy ([#237](https://github.com/Consensys/starknet-snap/issues/237)) ([033fdc6](https://github.com/Consensys/starknet-snap/commit/033fdc625c8a2c7eee91a17c4e175a6b78626c7a))

## [2.6.2](https://github.com/Consensys/starknet-snap/compare/starknet-snap-v2.6.1...starknet-snap-v2.6.2) (2024-04-18)


### Bug Fixes

* address field error ([#234](https://github.com/Consensys/starknet-snap/issues/234)) ([1aa523c](https://github.com/Consensys/starknet-snap/commit/1aa523c8123ccd016953314c9c63520602959651))

## [2.6.1](https://github.com/Consensys/starknet-snap/compare/starknet-snap-v2.6.0...starknet-snap-v2.6.1) (2024-04-05)


### Bug Fixes

* snap homepage ui error due to goerli network deprecated ([#230](https://github.com/Consensys/starknet-snap/issues/230)) ([16ba5e9](https://github.com/Consensys/starknet-snap/commit/16ba5e9a94e7639670a138279db1ee8c22bc70a6))

## [2.6.0](https://github.com/Consensys/starknet-snap/compare/starknet-snap-v2.5.2...starknet-snap-v2.6.0) (2024-04-05)


### Features

* deprecate goerli network ([#217](https://github.com/Consensys/starknet-snap/issues/217)) ([168484d](https://github.com/Consensys/starknet-snap/commit/168484d5c1f1303f03a0db7f286a8e98ed50eb6a))


### Bug Fixes

* sf 606 fix voyager cors with official provider ([#229](https://github.com/Consensys/starknet-snap/issues/229)) ([44ff4f1](https://github.com/Consensys/starknet-snap/commit/44ff4f131163c59972bf06a6f49d3bf3621da301))
* snap homepage error when state omit ([#218](https://github.com/Consensys/starknet-snap/issues/218)) ([41de2ea](https://github.com/Consensys/starknet-snap/commit/41de2ea8e2c5d703f1e2780b888b865290630591))
* typo of Autherize ([#224](https://github.com/Consensys/starknet-snap/issues/224)) ([cc635ea](https://github.com/Consensys/starknet-snap/commit/cc635ea05347f044311ee2ab14332bf3300c8924))

## [2.5.2](https://github.com/Consensys/starknet-snap/compare/starknet-snap-v2.5.1...starknet-snap-v2.5.2) (2024-03-07)


### Bug Fixes

* get correct balance on snap homepage ([#214](https://github.com/Consensys/starknet-snap/issues/214)) ([781406e](https://github.com/Consensys/starknet-snap/commit/781406e691a47be8305643841fb6974376a89115))

## [2.5.1](https://github.com/Consensys/starknet-snap/compare/starknet-snap-v2.5.0...starknet-snap-v2.5.1) (2024-03-07)


### Bug Fixes

* update starknet token name and symbol ([#210](https://github.com/Consensys/starknet-snap/issues/210)) ([4869b87](https://github.com/Consensys/starknet-snap/commit/4869b8706ac77709f2effbf9793922bd25e4b80e))

## [2.5.0](https://github.com/Consensys/starknet-snap/compare/starknet-snap-v2.4.0...starknet-snap-v2.5.0) (2024-03-05)


### Features

* add strk token ([#204](https://github.com/Consensys/starknet-snap/issues/204)) ([86f3a82](https://github.com/Consensys/starknet-snap/commit/86f3a82dce3389be3690a34e62e87ea655af7380))
* display Stark name in Sidebar ([#184](https://github.com/Consensys/starknet-snap/issues/184)) ([60f37da](https://github.com/Consensys/starknet-snap/commit/60f37da767504382a4a93a5ce944e6119bd6e304))
* implement snap homepage screen ([#207](https://github.com/Consensys/starknet-snap/issues/207)) ([675647d](https://github.com/Consensys/starknet-snap/commit/675647d9d77ba512f87a6a1d8291941bb5c31038))


## [2.4.0](https://github.com/Consensys/starknet-snap/compare/starknet-snap-v2.3.0...starknet-snap-v2.4.0) (2023-12-19)


### Features

* implement network switch in UI ([#175](https://github.com/Consensys/starknet-snap/issues/175)) ([4b4ace7](https://github.com/Consensys/starknet-snap/commit/4b4ace7f41998c36c7924dcfb07dde061a714d45))
* sepolia network ([#187](https://github.com/Consensys/starknet-snap/issues/187)) ([45b0463](https://github.com/Consensys/starknet-snap/commit/45b04633149bf1b9568feeb8c2f475d52a0e45a8))

## [2.3.0](https://github.com/Consensys/starknet-snap/compare/starknet-snap-v2.2.0...starknet-snap-v2.3.0) (2023-11-20)


### Features

* add declare method ([#159](https://github.com/Consensys/starknet-snap/issues/159)) ([538704e](https://github.com/Consensys/starknet-snap/commit/538704ee77dad7bd4ab0c0dc932aa9a4d23dec55))
* add method support get-starknet ([#173](https://github.com/Consensys/starknet-snap/issues/173)) ([a857eed](https://github.com/Consensys/starknet-snap/commit/a857eed85ff0a8acfcc54965e7419ea77333189e))
* add multi transaction to snap ([#161](https://github.com/Consensys/starknet-snap/issues/161)) ([eaee37b](https://github.com/Consensys/starknet-snap/commit/eaee37b3dc9cf8402ad46a5f879c6c5a8601322e))
* add open rpc json ([#167](https://github.com/Consensys/starknet-snap/issues/167)) ([3bab995](https://github.com/Consensys/starknet-snap/commit/3bab995dc6e36d8e1af51ca58afd280edf677134))
* add switch network and get current network ([#174](https://github.com/Consensys/starknet-snap/issues/174)) ([560751f](https://github.com/Consensys/starknet-snap/commit/560751f8019e5aa1ef049b7df37086965acbe149))
* add usdc usdt ([#176](https://github.com/Consensys/starknet-snap/issues/176)) ([a48dccb](https://github.com/Consensys/starknet-snap/commit/a48dccbcc0e1ca3217e7961d21cfcee2d45ddc0e))
* estimate fees ([#162](https://github.com/Consensys/starknet-snap/issues/162)) ([0aee946](https://github.com/Consensys/starknet-snap/commit/0aee946753297adf676b4d67a50fb3082178e998))
* replace account class hash with constant value ([#178](https://github.com/Consensys/starknet-snap/issues/178)) ([f588c9c](https://github.com/Consensys/starknet-snap/commit/f588c9c902818f7b690838ef0b4b81e499ca4fc5))
* sign transaction ongoing ([#158](https://github.com/Consensys/starknet-snap/issues/158)) ([0b7a8b1](https://github.com/Consensys/starknet-snap/commit/0b7a8b106bd8dd3ddb7e4389f825d6dc35319374))
* simplify dialog text render method ([#170](https://github.com/Consensys/starknet-snap/issues/170)) ([9f1c593](https://github.com/Consensys/starknet-snap/commit/9f1c59349f2370db1670a98a611c4f332e998a70))
* update snap demo html ([#160](https://github.com/Consensys/starknet-snap/issues/160)) ([b53cc7f](https://github.com/Consensys/starknet-snap/commit/b53cc7f7215ddf88eedaa9d187b2edb2b3e5a904))


### Bug Fixes

* add mock to unit test on estimateFee and createAccount ([#166](https://github.com/Consensys/starknet-snap/issues/166)) ([d500465](https://github.com/Consensys/starknet-snap/commit/d500465dc95294b2a5e45707911cbf9dfd994c9b))
* typos ([#172](https://github.com/Consensys/starknet-snap/issues/172)) ([d745354](https://github.com/Consensys/starknet-snap/commit/d7453547d7828050c4e98873d864d2361ccdf8a5))

## [2.2.0](https://github.com/Consensys/starknet-snap/compare/starknet-snap-v2.1.0...starknet-snap-v2.2.0) (2023-09-22)


### Features

* sf-510 deprecation of status field for snap ([#135](https://github.com/Consensys/starknet-snap/issues/135)) ([59711bb](https://github.com/Consensys/starknet-snap/commit/59711bbdbe6fd744fb35cf7cf18b1394d6f7c9e6))


### Bug Fixes

* remove hello method ([#146](https://github.com/Consensys/starknet-snap/issues/146)) ([241c1a7](https://github.com/Consensys/starknet-snap/commit/241c1a7d9f08b5bdad1551b384516e359f4132eb))

## [2.1.0](https://github.com/Consensys/starknet-snap/compare/starknet-snap-v2.0.2...starknet-snap-v2.1.0) (2023-09-13)


### Features

* changed name from StarkNet to Starknet ([#138](https://github.com/Consensys/starknet-snap/issues/138)) ([a153ee1](https://github.com/Consensys/starknet-snap/commit/a153ee1a04e6c742b7a6fc326d0c7556af082ee5))
* migrate metamask flask handle to metamask ([#121](https://github.com/Consensys/starknet-snap/issues/121)) ([5eff492](https://github.com/Consensys/starknet-snap/commit/5eff492cedb1bfa299e30b584fda8c936248fb9a))


### Bug Fixes

* fix account address ([#137](https://github.com/Consensys/starknet-snap/issues/137)) ([f406d43](https://github.com/Consensys/starknet-snap/commit/f406d43cacdf08894d94988a750af46680e91114))
* update proposedName ([#133](https://github.com/Consensys/starknet-snap/issues/133)) ([28dfb15](https://github.com/Consensys/starknet-snap/commit/28dfb152c8e252ecc3c6ea0cdb42e202ac858fc3))

## [2.0.2](https://github.com/Consensys/starknet-snap/compare/starknet-snap-v2.0.1...starknet-snap-v2.0.2) (2023-09-05)


### Features

*  Bumps ses from 0.18.2 to 0.18.7 ([#57](https://github.com/Consensys/starknet-snap/security/dependabot/57)) ([5b55275](https://github.com/Consensys/starknet-snap/commit/5b55275c0532c233dcf1f539213b17567047fd73))

* migrate metamask flask handle to metamask ([#121](https://github.com/Consensys/starknet-snap/issues/121)) ([5eff492](https://github.com/Consensys/starknet-snap/commit/5eff492cedb1bfa299e30b584fda8c936248fb9a))

* update proposedName ([#133](https://github.com/Consensys/starknet-snap/issues/133)) ([28dfb15](https://github.com/Consensys/starknet-snap/commit/28dfb152c8e252ecc3c6ea0cdb42e202ac858fc3))


## [2.0.1](https://github.com/Consensys/starknet-snap/compare/starknet-snap-v2.0.0...starknet-snap-v2.0.1) (2023-07-17)


### ⚠ BREAKING CHANGES
* starknet.js to 5.16.0

### Features

* Upgrade starknet library from 4.22.0 to 5.16.0


## [1.7.0](https://github.com/ConsenSys/starknet-snap/compare/starknet-snap-v1.6.0...starknet-snap-v1.7.0) (2023-04-21)


### Features

* upgraded snap packages and patched luxon by upgrading yarn to v2 ([#79](https://github.com/ConsenSys/starknet-snap/issues/79)) ([94c2544](https://github.com/ConsenSys/starknet-snap/commit/94c25445b48a5d02ce4baba62621357c22e3bc89))

## [1.6.0](https://github.com/ConsenSys/starknet-snap/compare/starknet-snap-v1.5.0...starknet-snap-v1.6.0) (2023-03-28)


### Features

* switched back to use Infura endpoints except for estimateFeeBulk ([#76](https://github.com/ConsenSys/starknet-snap/issues/76)) ([9df15df](https://github.com/ConsenSys/starknet-snap/commit/9df15df1aab5324f00529a1e0bb24d5f0d33ad07))

## [1.5.0](https://github.com/ConsenSys/starknet-snap/compare/starknet-snap-v1.4.0...starknet-snap-v1.5.0) (2023-03-15)


### Features

* upgrade starknet.js to v4.22 and fix the dependabot alerts by u… ([#74](https://github.com/ConsenSys/starknet-snap/issues/74)) ([a3827ee](https://github.com/ConsenSys/starknet-snap/commit/a3827ee837160bfc767c199aef206dc474231997))

## [1.4.0](https://github.com/ConsenSys/starknet-snap/compare/starknet-snap-v1.3.0...starknet-snap-v1.4.0) (2023-02-21)


### Features

* switch from snap confirm to snap dialog ([#71](https://github.com/ConsenSys/starknet-snap/issues/71)) ([9350517](https://github.com/ConsenSys/starknet-snap/commit/9350517931421902aac456c3b4862ec2a1bcd5da))

## [1.3.0](https://github.com/ConsenSys/starknet-snap/compare/starknet-snap-v1.2.1...starknet-snap-v1.3.0) (2023-02-17)


### Features

* added support for MM flask v10.24.1 and added starkNet_estimate… ([#50](https://github.com/ConsenSys/starknet-snap/issues/50)) ([88acb2f](https://github.com/ConsenSys/starknet-snap/commit/88acb2fbf7c4884a0bd142a70bc87a0366432fbe))

## [1.2.1](https://github.com/ConsenSys/starknet-snap/compare/starknet-snap-v1.2.0...starknet-snap-v1.2.1) (2023-02-15)


### Bug Fixes

* change filter in the snap so that it gets the not received transactions when refreshing ([#63](https://github.com/ConsenSys/starknet-snap/issues/63)) ([74a612f](https://github.com/ConsenSys/starknet-snap/commit/74a612fce6278526b3ee9db1cf83e452c2fdd3f2))

## [1.2.0](https://github.com/ConsenSys/starknet-snap/compare/starknet-snap-v1.1.0...starknet-snap-v1.2.0) (2023-02-04)


### Features

* Sf 479 account deployment with first transaction ([#55](https://github.com/ConsenSys/starknet-snap/issues/55)) ([dedcbba](https://github.com/ConsenSys/starknet-snap/commit/dedcbba7291431c6912002e96e5ece595f8474fa))

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

* temporarily reverted back to use Starknet feeder gateway APIs as default provider ([#39](https://github.com/ConsenSys/starknet-snap/issues/39)) ([ed05913](https://github.com/ConsenSys/starknet-snap/commit/ed059130c6b4cddd28965302eb3824529d1328ac))

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
