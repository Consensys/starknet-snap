import { MethodNotFoundError, SnapError } from '@metamask/snaps-sdk';
import { constants } from 'starknet';

import { onRpcRequest, onHomePage } from '.';
import { manageStateSpy } from '../test/snap-provider.mock';
import { generateAccounts, type StarknetAccount } from './__tests__/helper';
import * as createAccountApi from './createAccount';
import type { SnapState } from './types/snapState';
import {
  ETHER_MAINNET,
  ETHER_SEPOLIA_TESTNET,
  STARKNET_MAINNET_NETWORK,
  STARKNET_SEPOLIA_TESTNET_NETWORK,
} from './utils/constants';
import * as keyPairUtils from './utils/keyPair';
import * as starknetUtils from './utils/starknetUtils';

jest.mock('./utils/logger');

describe('onRpcRequest', () => {
  const createMockSpy = () => {
    const createAccountSpy = jest.spyOn(createAccountApi, 'createAccount');
    const keyPairSpy = jest.spyOn(keyPairUtils, 'getAddressKeyDeriver');
    return {
      createAccountSpy,
      keyPairSpy,
    };
  };

  const createMockRequest = (params = {}) => {
    return {
      origin: 'http://localhost:3000',
      request: {
        method: 'starkNet_createAccount',
        params,
        jsonrpc: '2.0' as const,
        id: 1,
      },
    };
  };

  it('processes request successfully', async () => {
    const { createAccountSpy, keyPairSpy } = createMockSpy();

    createAccountSpy.mockReturnThis();
    keyPairSpy.mockReturnThis();

    await onRpcRequest(createMockRequest());

    expect(keyPairSpy).toHaveBeenCalledTimes(1);
    expect(createAccountSpy).toHaveBeenCalledTimes(1);
  });

  it('throws `MethodNotFoundError` if the request method not found', async () => {
    await expect(
      onRpcRequest({
        ...createMockRequest(),
        request: {
          ...createMockRequest().request,
          method: 'method_not_found',
        },
      }),
    ).rejects.toThrow(MethodNotFoundError);
  });

  it('throws `SnapError` if the error is an instance of SnapError', async () => {
    const { createAccountSpy } = createMockSpy();
    createAccountSpy.mockRejectedValue(new SnapError('error'));

    await expect(onRpcRequest(createMockRequest())).rejects.toThrow(SnapError);
  });

  it('throws `SnapError` if the error is not an instance of SnapError', async () => {
    const { createAccountSpy } = createMockSpy();
    createAccountSpy.mockRejectedValue(new Error('error'));

    await expect(onRpcRequest(createMockRequest())).rejects.toThrow(SnapError);
  });
});

describe('onHomePage', () => {
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [ETHER_MAINNET, ETHER_SEPOLIA_TESTNET],
    networks: [STARKNET_MAINNET_NETWORK, STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
    currentNetwork: undefined,
  };

  const mockState = (snapState: SnapState) => {
    manageStateSpy.mockResolvedValue(snapState);
  };

  const mockAccount = async (chainId: constants.StarknetChainId) => {
    const accounts = await generateAccounts(chainId);
    return accounts[0];
  };

  const mockAccountDiscovery = (account: StarknetAccount) => {
    const getKeysFromAddressIndexSpy = jest.spyOn(
      starknetUtils,
      'getKeysFromAddressIndex',
    );
    const getCorrectContractAddressSpy = jest.spyOn(
      starknetUtils,
      'getCorrectContractAddress',
    );

    getKeysFromAddressIndexSpy.mockResolvedValue({
      privateKey: account.privateKey,
      publicKey: account.publicKey,
      addressIndex: account.addressIndex,
      derivationPath: account.derivationPath as unknown as any,
    });

    getCorrectContractAddressSpy.mockResolvedValue({
      address: account.address,
      signerPubKey: account.publicKey,
      upgradeRequired: false,
      deployRequired: false,
    });

    return {
      getKeysFromAddressIndexSpy,
      getCorrectContractAddressSpy,
    };
  };

  const mockGetBalance = (balance: string) => {
    const getBalanceSpy = jest.spyOn(starknetUtils, 'getBalance');
    getBalanceSpy.mockResolvedValue(balance);
  };

  it('renders user address, user balance and network', async () => {
    const account = await mockAccount(constants.StarknetChainId.SN_SEPOLIA);
    mockState(state);
    mockAccountDiscovery(account);
    mockGetBalance('1000');

    const result = await onHomePage();

    expect(result).toStrictEqual({
      content: {
        type: 'Box',
        key: null,
        props: {
          children: [
            {
              key: null,
              type: 'Text',
              props: {
                children: 'Address',
              },
            },
            {
              key: null,
              type: 'Copyable',
              props: {
                value: account.address,
              },
            },
            {
              key: null,
              type: 'Row',
              props: {
                label: 'Network',
                children: {
                  key: null,
                  type: 'Text',
                  props: {
                    children: 'Sepolia Testnet',
                  },
                },
              },
            },
            {
              key: null,
              type: 'Row',
              props: {
                label: 'Balance',
                children: {
                  key: null,
                  type: 'Text',
                  props: {
                    children: ['0.000000000000001', ' ETH'],
                  },
                },
              },
            },
            {
              key: null,
              type: 'Divider',
              props: {},
            },
            {
              key: null,
              type: 'Text',
              props: {
                children: [
                  'Visit the',
                  ' ',
                  {
                    key: null,
                    type: 'Link',
                    props: {
                      children: 'companion dapp for Starknet',
                      href: 'https://snaps.consensys.io/starknet',
                    },
                  },
                  ' to manage your account.',
                ],
              },
            },
          ],
        },
      },
    });
  });

  it('renders with network from state if `currentNetwork` is not undefined', async () => {
    const network = STARKNET_MAINNET_NETWORK;
    const account = await mockAccount(constants.StarknetChainId.SN_MAIN);
    mockState({
      ...state,
      currentNetwork: network,
    });
    mockAccountDiscovery(account);
    mockGetBalance('1000');

    const result = await onHomePage();

    expect(result).toStrictEqual({
      content: {
        type: 'Box',
        key: null,
        props: {
          children: [
            {
              key: null,
              type: 'Text',
              props: {
                children: 'Address',
              },
            },
            {
              key: null,
              type: 'Copyable',
              props: {
                value: account.address,
              },
            },
            {
              key: null,
              type: 'Row',
              props: {
                label: 'Network',
                children: {
                  key: null,
                  type: 'Text',
                  props: {
                    children: network.name,
                  },
                },
              },
            },
            {
              key: null,
              type: 'Row',
              props: {
                label: 'Balance',
                children: {
                  key: null,
                  type: 'Text',
                  props: {
                    children: ['0.000000000000001', ' ETH'],
                  },
                },
              },
            },
            {
              key: null,
              type: 'Divider',
              props: {},
            },
            {
              key: null,
              type: 'Text',
              props: {
                children: [
                  'Visit the',
                  ' ',
                  {
                    key: null,
                    type: 'Link',
                    props: {
                      children: 'companion dapp for Starknet',
                      href: 'https://snaps.consensys.io/starknet',
                    },
                  },
                  ' to manage your account.',
                ],
              },
            },
          ],
        },
      },
    });
  });

  it('throws `Unable to initialize Snap HomePage` error when state not found', async () => {
    await expect(onHomePage()).rejects.toThrow(
      'Unable to initialize Snap HomePage',
    );
  });
});
