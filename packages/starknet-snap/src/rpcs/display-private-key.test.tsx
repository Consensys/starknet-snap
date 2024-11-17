import { Box, Copyable, Heading, Icon, Text } from '@metamask/snaps-sdk/jsx';
import { constants } from 'starknet';

import type { SnapState } from '../types/snapState';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import {
  UserRejectedOpError,
  InvalidRequestParamsError,
} from '../utils/exceptions';
import {
  mockAccount,
  prepareMockAccount,
  prepareConfirmDialogJsx,
  prepareAlertDialogJsx,
} from './__tests__/helper';
import { displayPrivateKey } from './display-private-key';
import type { DisplayPrivateKeyParams } from './display-private-key';

jest.mock('../utils/logger');

describe('displayPrivateKey', () => {
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  const createRequestParam = (
    chainId: constants.StarknetChainId,
    address: string,
  ): DisplayPrivateKeyParams => {
    const request: DisplayPrivateKeyParams = {
      chainId,
      address,
    };
    return request;
  };

  it('displays private key correctly', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    prepareConfirmDialogJsx();
    const { alertDialogSpy } = prepareAlertDialogJsx();

    const request = createRequestParam(chainId, account.address);

    await displayPrivateKey.execute(request);

    expect(alertDialogSpy).toHaveBeenCalledTimes(1);

    const calls = alertDialogSpy.mock.calls[0][0];

    expect(calls).toStrictEqual({
      children: (
        <Box>
          <Heading>Starknet Account Private Key</Heading>
          <Text>
            Below is your Starknet Account private key. Keep it confidential.
          </Text>
          <Copyable value={account.privateKey} />
        </Box>
      ),
    });
  });

  it('renders confirmation dialog', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareConfirmDialogJsx();
    prepareAlertDialogJsx();

    const request = createRequestParam(chainId, account.address);

    await displayPrivateKey.execute(request);

    expect(confirmDialogSpy).toHaveBeenCalledTimes(1);

    const calls = confirmDialogSpy.mock.calls[0][0];

    expect(calls).toStrictEqual({
      children: (
        <Box>
          <Heading>Are you sure you want to reveal your private key?</Heading>
          <Box direction="horizontal">
            <Icon name="warning" size="md" />
            <Text>
              Confirming this action will display your private key. Ensure you
              are in a secure environment.
            </Text>
          </Box>
        </Box>
      ),
    });
  });

  it('throws `UserRejectedOpError` if user denies the operation', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareConfirmDialogJsx();
    prepareAlertDialogJsx();

    confirmDialogSpy.mockResolvedValue(false);

    const request = createRequestParam(chainId, account.address);

    await expect(displayPrivateKey.execute(request)).rejects.toThrow(
      UserRejectedOpError,
    );
  });

  it.each([
    {
      case: 'user address is omitted',
      request: {
        chainId: constants.StarknetChainId.SN_SEPOLIA,
      },
    },
    {
      case: 'user address is invalid',
      request: {
        chainId: constants.StarknetChainId.SN_SEPOLIA,
        address: 'invalid_address',
      },
    },
  ])(
    'throws `InvalidRequestParamsError` when $case',
    async ({ request }: { request: unknown }) => {
      await expect(
        displayPrivateKey.execute(request as DisplayPrivateKeyParams),
      ).rejects.toThrow(InvalidRequestParamsError);
    },
  );
});
