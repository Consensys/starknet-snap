import { Box, Heading, Section } from '@metamask/snaps-sdk/jsx';
import type { InvocationsSignerDetails } from 'starknet';
import { constants } from 'starknet';

import transactionExample from '../__tests__/fixture/transactionExample.json'; // Assuming you have a similar fixture
import type { SnapState } from '../types/snapState';
import { AddressUI, JsonDataUI, NetworkUI } from '../ui/fragments';
import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import {
  UserRejectedOpError,
  InvalidRequestParamsError,
} from '../utils/exceptions';
import * as starknetUtils from '../utils/starknetUtils';
import {
  mockAccount,
  prepareMockAccount,
  prepareConfirmDialogJsx as prepareConfirmDialog,
} from './__tests__/helper';
import { signTransaction } from './sign-transaction';
import type { SignTransactionParams } from './sign-transaction';

jest.mock('../utils/logger');

describe('signTransaction', () => {
  const state: SnapState = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  const createRequestParam = (
    chainId: constants.StarknetChainId,
    address: string,
    enableAuthorize?: boolean,
  ): SignTransactionParams => {
    const request: SignTransactionParams = {
      chainId,
      address,
      transactions: transactionExample.transactions,
      transactionsDetail:
        transactionExample.transactionsDetail as unknown as InvocationsSignerDetails,
    };
    if (enableAuthorize) {
      request.enableAuthorize = enableAuthorize;
    }
    return request;
  };

  it('signs a transaction correctly', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    prepareConfirmDialog();
    const request = createRequestParam(chainId, account.address);

    const expectedResult = await starknetUtils.signTransactions(
      account.privateKey,
      request.transactions,
      request.transactionsDetail,
    );

    const result = await signTransaction.execute(request);

    expect(result).toStrictEqual(expectedResult);
  });

  it('renders confirmation dialog', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    const { address } = account;
    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareConfirmDialog();
    const request = createRequestParam(chainId, account.address, true);

    await signTransaction.execute(request);

    const calls = confirmDialogSpy.mock.calls[0][0];
    expect(calls).toStrictEqual({
      children: (
        <Box>
          <Heading>Do you want to sign this transaction?</Heading>
          <Section>
            <AddressUI label="Signer" address={address} chainId={chainId} />
            <NetworkUI networkName={STARKNET_SEPOLIA_TESTNET_NETWORK.name} />
            <JsonDataUI
              label={'Transactions'}
              data={transactionExample.transactions}
            />
          </Section>
        </Box>
      ),
    });
  });

  it('does not render the confirmation dialog if enableAuthorize is false', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareConfirmDialog();
    const request = createRequestParam(chainId, account.address, false);

    await signTransaction.execute(request);

    expect(confirmDialogSpy).not.toHaveBeenCalled();
  });

  it('throws `UserRejectedOpError` if user denied the operation', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(chainId);
    prepareMockAccount(account, state);
    const { confirmDialogSpy } = prepareConfirmDialog();
    confirmDialogSpy.mockResolvedValue(false);
    const request = createRequestParam(chainId, account.address, true);

    await expect(signTransaction.execute(request)).rejects.toThrow(
      UserRejectedOpError,
    );
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      signTransaction.execute({} as unknown as SignTransactionParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
