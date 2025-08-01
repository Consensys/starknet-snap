# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.


## [1.30.0](https://github.com/Consensys/starknet-snap/compare/wallet-ui-v1.29.0...wallet-ui-v1.30.0) (2025-07-16)


### Features

* remove fee dropdown selection ([#549](https://github.com/Consensys/starknet-snap/issues/549)) ([42c5d0e](https://github.com/Consensys/starknet-snap/commit/42c5d0ead1ecba504d6f9101490a8f372d5d7668))


### Bug Fixes

* incorrect truncation in getMaxDecimalsReadable ([#556](https://github.com/Consensys/starknet-snap/issues/556)) ([6812d98](https://github.com/Consensys/starknet-snap/commit/6812d984127f82d0f1e7aad46525a076e861e16f))

## [1.29.0](https://github.com/Consensys/starknet-snap/compare/wallet-ui-v1.28.0...wallet-ui-v1.29.0) (2025-04-03)


### Features

* add account list contextual menu ([223c1c0](https://github.com/Consensys/starknet-snap/commit/223c1c025b9434714eea1186df3b9dde44cc83c4))
* enable account search by name ([866264f](https://github.com/Consensys/starknet-snap/commit/866264fa91474ef174a2b53d157f401c2153b21e))
* enhance account visibility management ([04426cd](https://github.com/Consensys/starknet-snap/commit/04426cdb98a9228fe1354bbe37a7e896e28c2876))
* enhance transaction fee estimation UX with cache ([4549a37](https://github.com/Consensys/starknet-snap/commit/4549a37b2f9782e117a77db4ff5da09d13da9380))
* prevent account with same name ([17a5b38](https://github.com/Consensys/starknet-snap/commit/17a5b38e67c6146ee719d8e000e60896be92f140))


### Bug Fixes

* invalid inputs on send transaction cause Error ([#533](https://github.com/Consensys/starknet-snap/issues/533)) ([cf6713a](https://github.com/Consensys/starknet-snap/commit/cf6713a6d86e091a6e51576aadc673a694f0e2eb))
* ui fails to send Snap RPC request on Firefox ([7453796](https://github.com/Consensys/starknet-snap/commit/745379627389237077eec8fca8f9bff861fe3fe1))

## [1.28.0](https://github.com/Consensys/starknet-snap/compare/wallet-ui-v1.27.0...wallet-ui-v1.28.0) (2025-03-04)


### Features

* Enable back button from send transaction ([710cca7](https://github.com/Consensys/starknet-snap/commit/710cca794dcd6e3f1f239d1b34baac62dc7b84c7))
* Enhance Accounts management UX by refining the layout of the account list popup ([ed2b4d6](https://github.com/Consensys/starknet-snap/commit/ed2b4d6bc682962bd24e2fc1a64d28d133f13290))
* Support account name management in wallet-ui ([d31f6a0](https://github.com/Consensys/starknet-snap/commit/d31f6a002c5793fffb0159b595322a2845554549))


### Bug Fixes

* SNAP version does not auto update in UI ([67f7d0d](https://github.com/Consensys/starknet-snap/commit/67f7d0d85116348f85445228935612257ae84a31))

## [1.27.0](https://github.com/Consensys/starknet-snap/compare/wallet-ui-v1.26.0...wallet-ui-v1.27.0) (2025-02-07)


### Features

* Enable multiple languages (FR) to support in SNAP and Wallet UI ([#495](https://github.com/Consensys/starknet-snap/issues/495), [#481](https://github.com/Consensys/starknet-snap/issues/481)) ([ece4e17](https://github.com/Consensys/starknet-snap/commit/ece4e1793bf16c2be2ae86f1999f81273e131878))
* Enable support multiple accounts in Wallet UI to allow add accounts, switch accounts and hide/unhide accounts ([#506](https://github.com/Consensys/starknet-snap/issues/506), [#475](https://github.com/Consensys/starknet-snap/issues/475), [#482](https://github.com/Consensys/starknet-snap/issues/482), [#499](https://github.com/Consensys/starknet-snap/issues/499), [#501](https://github.com/Consensys/starknet-snap/issues/501)). ([a9fcd27](https://github.com/Consensys/starknet-snap/commit/a9fcd2753d1fdfdb7559b5e90b4537aebfee1b11))

## [1.26.0](https://github.com/Consensys/starknet-snap/compare/wallet-ui-v1.25.0...wallet-ui-v1.26.0) (2024-12-19)


### Features

* allow users to transfer money to a .stark name ([#437](https://github.com/Consensys/starknet-snap/issues/437)) ([#449](https://github.com/Consensys/starknet-snap/issues/449)) ([c9e2c64](https://github.com/Consensys/starknet-snap/commit/c9e2c64572ce22bb111e6075fa6191dc025bc863))
* Refactor RPC `starkNet_getTransactions` and change the provider from Voyager to StarkScan ([#453](https://github.com/Consensys/starknet-snap/issues/453)) ([#457](https://github.com/Consensys/starknet-snap/issues/457)) ([#458](https://github.com/Consensys/starknet-snap/issues/458)) ([#459](https://github.com/Consensys/starknet-snap/issues/459)) ([5b72ef9](https://github.com/Consensys/starknet-snap/commit/5b72ef9f8ab55ad57dcaca25e306d3feecffcf0d))


### Bug Fixes

* Mute Wallet UI error message when user deny a request ([#460](https://github.com/Consensys/starknet-snap/issues/460)) ([8027bc2](https://github.com/Consensys/starknet-snap/commit/8027bc2ce968291b8d4724362f7d3b087610a5ec))

## [1.25.0](https://github.com/Consensys/starknet-snap/compare/wallet-ui-v1.24.1...wallet-ui-v1.25.0) (2024-11-26)


### Features

* Add minimum MetaMask version requirements detection. ([#424](https://github.com/Consensys/starknet-snap/issues/424)) ([f6cde30](https://github.com/Consensys/starknet-snap/commit/f6cde302f491f6f2bd4322ce996a699e046fe9ee))


### Bug Fixes

* Add missing asset icon for `USDC`, `USDT` and `STRK` token ([#428](https://github.com/Consensys/starknet-snap/issues/428)) ([9f43a22](https://github.com/Consensys/starknet-snap/commit/9f43a228e844ab200984a0b5a1f8ff7bb0d8288d))

## [1.24.1](https://github.com/Consensys/starknet-snap/compare/wallet-ui-v1.24.0...wallet-ui-v1.24.1) (2024-10-28)


### Bug Fixes

* Remove Snap dependency on Wallet UI package ([#397](https://github.com/Consensys/starknet-snap/issues/397)) ([c9c1aaf](https://github.com/Consensys/starknet-snap/commit/c9c1aafb45120b7d0767337f300e1ab6ff277ab3))

## [1.24.0](https://github.com/Consensys/starknet-snap/compare/wallet-ui-v1.23.0...wallet-ui-v1.24.0) (2024-09-20)


### Features

* support STRK token for the gas fee in wallet-ui ([#271](https://github.com/Consensys/starknet-snap/issues/271)) ([8f50a33](https://github.com/Consensys/starknet-snap/commit/8f50a33ca7cdce88c6853ce1945cd7f7a7b24fae))
* bump starknet.js to v6.11.0 ([#296](https://github.com/Consensys/starknet-snap/issues/296)) ([e298244](https://github.com/Consensys/starknet-snap/commit/e298244a5e68e2809ab6367330e104c53ca5c861))


### Bug Fixes

* update message for waiting deploy/upgrade txn complete ([#297](https://github.com/Consensys/starknet-snap/issues/297)) ([141fa20](https://github.com/Consensys/starknet-snap/commit/141fa2023911e8c6f2d1b495a2d78bec79a3e5d7))

## [1.23.0](https://github.com/Consensys/starknet-snap/compare/wallet-ui-v1.22.0...wallet-ui-v1.23.0) (2024-07-16)


### Features

* clean up and update dependency ([#259](https://github.com/Consensys/starknet-snap/issues/259)) ([fcb83e1](https://github.com/Consensys/starknet-snap/commit/fcb83e128fd4e483cdf9f4670e4e70e1d3876f7a))


### Bug Fixes

* non zero balance on non deployed cairo 0 account ([#276](https://github.com/Consensys/starknet-snap/issues/276)) ([d9beafe](https://github.com/Consensys/starknet-snap/commit/d9beafe45b304685581162ef9247a31919eb7556))
* implement EIP-6963 multi injected provider discovery ([#276](https://github.com/Consensys/starknet-snap/issues/276)) ([d9beafe](https://github.com/Consensys/starknet-snap/commit/d9beafe45b304685581162ef9247a31919eb7556))

## [1.22.0](https://github.com/Consensys/starknet-snap/compare/wallet-ui-v1.21.0...wallet-ui-v1.22.0) (2024-06-21)


### Features

* cairo 1 support ([#202](https://github.com/Consensys/starknet-snap/issues/202)) ([c5e36e9](https://github.com/Consensys/starknet-snap/commit/c5e36e9a6f3c63155d990bf519cd6af6eb3cd006))
* Enable Local Testing of Webpack Federation Module (get-starknet remoteEntry.js) ([#249](https://github.com/Consensys/starknet-snap/issues/249)) ([b06f9f2](https://github.com/Consensys/starknet-snap/commit/b06f9f26e6fa5be001075d128032064444990c17))
* sf-640 revamp cicd workflow ([#255](https://github.com/Consensys/starknet-snap/issues/255)) ([6faaf02](https://github.com/Consensys/starknet-snap/commit/6faaf024bd0b8112e5cea930a2bf8aad564a9454))


### Bug Fixes

* sf 639 update contract upgrade message ([#256](https://github.com/Consensys/starknet-snap/issues/256)) ([9decd4b](https://github.com/Consensys/starknet-snap/commit/9decd4b9c52a7b84951ea81658f77f1532ca2522))

## [1.21.0](https://github.com/Consensys/starknet-snap/compare/wallet-ui-v1.20.0...wallet-ui-v1.21.0) (2024-04-05)


### Features

* deprecate goerli network ([#217](https://github.com/Consensys/starknet-snap/issues/217)) ([168484d](https://github.com/Consensys/starknet-snap/commit/168484d5c1f1303f03a0db7f286a8e98ed50eb6a))

## [1.20.0](https://github.com/Consensys/starknet-snap/compare/wallet-ui-v1.19.0...wallet-ui-v1.20.0) (2024-03-05)


### Features

* display Stark name in Sidebar ([#184](https://github.com/Consensys/starknet-snap/issues/184)) ([60f37da](https://github.com/Consensys/starknet-snap/commit/60f37da767504382a4a93a5ce944e6119bd6e304))

## [1.19.0](https://github.com/Consensys/starknet-snap/compare/wallet-ui-v1.18.0...wallet-ui-v1.19.0) (2023-12-19)


### Features

* implement network switch in UI ([#175](https://github.com/Consensys/starknet-snap/issues/175)) ([4b4ace7](https://github.com/Consensys/starknet-snap/commit/4b4ace7f41998c36c7924dcfb07dde061a714d45))
* sepolia network ([#187](https://github.com/Consensys/starknet-snap/issues/187)) ([45b0463](https://github.com/Consensys/starknet-snap/commit/45b04633149bf1b9568feeb8c2f475d52a0e45a8))


### Bug Fixes

* fix wallet cant connect after disconnect ([#179](https://github.com/Consensys/starknet-snap/issues/179)) ([6907f29](https://github.com/Consensys/starknet-snap/commit/6907f2942dab662191d8182b6be58561fa1c2876))

## [1.18.0](https://github.com/Consensys/starknet-snap/compare/wallet-ui-v1.17.0...wallet-ui-v1.18.0) (2023-09-22)


### Features

* sf-510 deprecation of status field for snap ([#135](https://github.com/Consensys/starknet-snap/issues/135)) ([59711bb](https://github.com/Consensys/starknet-snap/commit/59711bbdbe6fd744fb35cf7cf18b1394d6f7c9e6))

## [1.17.0](https://github.com/Consensys/starknet-snap/compare/wallet-ui-v1.16.0...wallet-ui-v1.17.0) (2023-09-14)


### Features

* now use new logos ([#140](https://github.com/Consensys/starknet-snap/issues/140)) ([25aa9ac](https://github.com/Consensys/starknet-snap/commit/25aa9ac995ac510add2148ed6498bd4f92f50604))

## [1.16.0](https://github.com/Consensys/starknet-snap/compare/wallet-ui-v1.15.0...wallet-ui-v1.16.0) (2023-09-13)


### Features

* changed name from StarkNet to Starknet ([#138](https://github.com/Consensys/starknet-snap/issues/138)) ([a153ee1](https://github.com/Consensys/starknet-snap/commit/a153ee1a04e6c742b7a6fc326d0c7556af082ee5))

## [1.15.0](https://github.com/Consensys/starknet-snap/compare/wallet-ui-v1.14.2...wallet-ui-v1.15.0) (2023-09-05)


### Features

* add cookie banner ([#127](https://github.com/Consensys/starknet-snap/issues/127)) ([64a94de](https://github.com/Consensys/starknet-snap/commit/64a94de6194fd31ab68ae7eeb5b4c84c3e455889))
* add t and c at footer ([#120](https://github.com/Consensys/starknet-snap/issues/120)) ([f33de15](https://github.com/Consensys/starknet-snap/commit/f33de1512155d7d265d32a5f2ac8b95a88a41575))
* migrate metamask flask handle to metamask ([#121](https://github.com/Consensys/starknet-snap/issues/121)) ([5eff492](https://github.com/Consensys/starknet-snap/commit/5eff492cedb1bfa299e30b584fda8c936248fb9a))

## [1.14.2](https://github.com/Consensys/starknet-snap/compare/wallet-ui-v1.14.1...wallet-ui-v1.14.2) (2023-07-17)


### Bug Fixes
* remove html tag from alert dialog ([#114](https://github.com/Consensys/starknet-snap/issues/114)) ([7231bb7](https://github.com/Consensys/starknet-snap/commit/7231bb7fa4671283b2e7b4cbf5a519d56a57697a))

## [1.14.1](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v1.14.0...wallet-ui-v1.14.1) (2023-04-24)


### Bug Fixes

* fix deploy pipeline ([#85](https://github.com/ConsenSys/starknet-snap/issues/85)) ([ed3e76d](https://github.com/ConsenSys/starknet-snap/commit/ed3e76dfd8e8f54446299b66a4347b5f518ffee9))

## [1.14.0](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v1.13.0...wallet-ui-v1.14.0) (2023-04-21)


### Features

* upgraded snap packages and patched luxon by upgrading yarn to v2 ([#79](https://github.com/ConsenSys/starknet-snap/issues/79)) ([94c2544](https://github.com/ConsenSys/starknet-snap/commit/94c25445b48a5d02ce4baba62621357c22e3bc89))

## [1.13.0](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v1.12.0...wallet-ui-v1.13.0) (2023-03-15)


### Features

* upgrade starknet.js to v4.22 and fix the dependabot alerts by u… ([#74](https://github.com/ConsenSys/starknet-snap/issues/74)) ([a3827ee](https://github.com/ConsenSys/starknet-snap/commit/a3827ee837160bfc767c199aef206dc474231997))

## [1.12.0](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v1.11.0...wallet-ui-v1.12.0) (2023-02-21)


### Features

* bump min snap version to 1.4.0 ([c61c9cb](https://github.com/ConsenSys/starknet-snap/commit/c61c9cb90515b2cd6994c9c5c26e56d2ff2e6364))

## [1.11.0](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v1.10.0...wallet-ui-v1.11.0) (2023-02-21)


### Features

* switch from snap confirm to snap dialog ([#71](https://github.com/ConsenSys/starknet-snap/issues/71)) ([9350517](https://github.com/ConsenSys/starknet-snap/commit/9350517931421902aac456c3b4862ec2a1bcd5da))

## [1.10.0](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v1.9.0...wallet-ui-v1.10.0) (2023-02-17)


### Features

* display a modal for the user to reinstall the snap in case he already had snap installed ([#69](https://github.com/ConsenSys/starknet-snap/issues/69)) ([108fc00](https://github.com/ConsenSys/starknet-snap/commit/108fc00fc381def320a9f94a1c0e270a7037eaab))

## [1.9.0](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v1.8.0...wallet-ui-v1.9.0) (2023-02-17)


### Features

* bump min snap version to 1.3.0 ([b2ff2c1](https://github.com/ConsenSys/starknet-snap/commit/b2ff2c1578410c6742750e65e93ea2968e24555d))

## [1.8.0](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v1.7.2...wallet-ui-v1.8.0) (2023-02-17)


### Features

* added support for MM flask v10.24.1 and added starkNet_estimate… ([#50](https://github.com/ConsenSys/starknet-snap/issues/50)) ([88acb2f](https://github.com/ConsenSys/starknet-snap/commit/88acb2fbf7c4884a0bd142a70bc87a0366432fbe))

## [1.7.2](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v1.7.1...wallet-ui-v1.7.2) (2023-02-16)


### Bug Fixes

* Modify the min snap version ([#65](https://github.com/ConsenSys/starknet-snap/issues/65)) ([6b3eae5](https://github.com/ConsenSys/starknet-snap/commit/6b3eae5ce0fe710a77702e6b5e027601fedb2a16))

## [1.7.1](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v1.7.0...wallet-ui-v1.7.1) (2023-02-15)


### Bug Fixes

* change filter in the snap so that it gets the not received transactions when refreshing ([#63](https://github.com/ConsenSys/starknet-snap/issues/63)) ([74a612f](https://github.com/ConsenSys/starknet-snap/commit/74a612fce6278526b3ee9db1cf83e452c2fdd3f2))

## [1.7.0](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v1.6.0...wallet-ui-v1.7.0) (2023-02-15)


### Features

* bump min snap version to v1.2 ([2a937db](https://github.com/ConsenSys/starknet-snap/commit/2a937db3b6ecd47ce00b93cbcd379b800384d6f3))
* improved decimals display + fix max function in the send modal ([#59](https://github.com/ConsenSys/starknet-snap/issues/59)) ([63ae882](https://github.com/ConsenSys/starknet-snap/commit/63ae882fa69641e3f89a04252e5a4e2cec8fcf9f))
* show you have no transactions if account is not deployed yet ([#62](https://github.com/ConsenSys/starknet-snap/issues/62)) ([da47b1e](https://github.com/ConsenSys/starknet-snap/commit/da47b1efb661f335ba5e45a1e56e7effa295a51a))
* warn fees exceeds balance ([#60](https://github.com/ConsenSys/starknet-snap/issues/60)) ([3e9a66c](https://github.com/ConsenSys/starknet-snap/commit/3e9a66c61411b74e2fd45059d450d400b97be21a))


### Bug Fixes

* fix lint ([686c96c](https://github.com/ConsenSys/starknet-snap/commit/686c96c1b23e425e7b67ecd35db23abe2845aa24))
* fix token symbol in not enough tokens message ([#58](https://github.com/ConsenSys/starknet-snap/issues/58)) ([eb4b18e](https://github.com/ConsenSys/starknet-snap/commit/eb4b18e783396c6760b6ca24d668bfd7fc29fc45))
* switch to change from ETH to USD mode ([#61](https://github.com/ConsenSys/starknet-snap/issues/61)) ([7e9106c](https://github.com/ConsenSys/starknet-snap/commit/7e9106cd1c21ca8a85fd101c55b4043b5e617ed9))

## [1.6.0](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v1.5.0...wallet-ui-v1.6.0) (2023-02-04)


### Features

* Sf 479 account deployment with first transaction ([#55](https://github.com/ConsenSys/starknet-snap/issues/55)) ([dedcbba](https://github.com/ConsenSys/starknet-snap/commit/dedcbba7291431c6912002e96e5ece595f8474fa))

## [1.5.0](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v1.4.0...wallet-ui-v1.5.0) (2023-02-02)


### Features

* bump snap min version to v1.1 ([#53](https://github.com/ConsenSys/starknet-snap/issues/53)) ([77baf48](https://github.com/ConsenSys/starknet-snap/commit/77baf48f4fd36a67e12c7e17774130028856f200))

## [1.4.0](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v1.3.0...wallet-ui-v1.4.0) (2023-02-02)


### Features

* update the response of stark net get transactions ([#51](https://github.com/ConsenSys/starknet-snap/issues/51)) ([56266a8](https://github.com/ConsenSys/starknet-snap/commit/56266a8fc5db80c0fb84fe50dae1dcf2c4ec9922))

## [1.3.0](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v1.2.0...wallet-ui-v1.3.0) (2022-12-20)


### Features

* added console messages for version detection ([#48](https://github.com/ConsenSys/starknet-snap/issues/48)) ([1689a42](https://github.com/ConsenSys/starknet-snap/commit/1689a42de8ef8eacdbc795729e6c7ff487b3c740))

## [1.2.0](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v1.1.0...wallet-ui-v1.2.0) (2022-12-20)


### Features

* ensure the snap version in dev and staging env can be compared with that in prod ([#46](https://github.com/ConsenSys/starknet-snap/issues/46)) ([8f89a92](https://github.com/ConsenSys/starknet-snap/commit/8f89a927daab03d5f73f174e00169fda38ed8da3))

## [1.1.0](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v1.0.0...wallet-ui-v1.1.0) (2022-12-19)


### Features

* update the min snap version to v1.0.0 ([#44](https://github.com/ConsenSys/starknet-snap/issues/44)) ([0deb190](https://github.com/ConsenSys/starknet-snap/commit/0deb190c4ce6048e34c61b31e6c8e527f2787628))

## [1.0.0](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v0.15.1...wallet-ui-v1.0.0) (2022-12-15)


### ⚠ BREAKING CHANGES

* starknet.js to v4.17.1 for new account deployment ([#42](https://github.com/ConsenSys/starknet-snap/issues/42))

### Features

* starknet.js to v4.17.1 for new account deployment ([#42](https://github.com/ConsenSys/starknet-snap/issues/42)) ([f0df619](https://github.com/ConsenSys/starknet-snap/commit/f0df6194d149d04c21d9116aa5a3faaa64fa5cca))

## [0.15.1](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v0.15.0...wallet-ui-v0.15.1) (2022-10-25)


### Bug Fixes

* minimum snap version to 0.11.0 ([#36](https://github.com/ConsenSys/starknet-snap/issues/36)) ([afd1079](https://github.com/ConsenSys/starknet-snap/commit/afd107998cc37c0964f15152f9b2d765a9a8067a))

## [0.15.0](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v0.14.1...wallet-ui-v0.15.0) (2022-10-25)


### Features

* added changes to accommodate Voyager txn API responses changes ([#34](https://github.com/ConsenSys/starknet-snap/issues/34)) ([7990de0](https://github.com/ConsenSys/starknet-snap/commit/7990de0cbeadb100fd3d4b85bc3dfa6c7c607b30))

## [0.14.1](https://github.com/ConsenSys/starknet-snap/compare/wallet-ui-v0.14.0...wallet-ui-v0.14.1) (2022-10-11)


### Bug Fixes

* Alignment of the alert component ([#28](https://github.com/ConsenSys/starknet-snap/issues/28)) ([7c37970](https://github.com/ConsenSys/starknet-snap/commit/7c37970423fd73b6604fe9097ff8b0a5da1e7acd))


### Features

* auto select the newly added token from the asset list ([#16](https://github.com/ConsenSys/starknet-snap/issues/16)) ([b9f0282](https://github.com/ConsenSys/starknet-snap/commit/b9f0282e261f2fd1f3b791b8620249faee166525))
* fixed the starknet.js version to be v4.6.x ([#22](https://github.com/ConsenSys/starknet-snap/issues/22)) ([e71a87c](https://github.com/ConsenSys/starknet-snap/commit/e71a87c3aa4f5945214079e073cabef4e7c2dd0a))


### Bug Fixes

* number of decimals displayed for the token amount ([#19](https://github.com/ConsenSys/starknet-snap/issues/19)) ([78f3809](https://github.com/ConsenSys/starknet-snap/commit/78f3809551209de51186de7a0ae8c8ba052157be))

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
