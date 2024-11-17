import { TokenStateManager } from '../state/token-state-manager';
import type { Erc20Token } from '../types/snapState';
import { formatCallData, mapDeprecatedParams } from './formatter-utils';

jest.mock('../state/token-state-manager');

describe('mapDeprecatedParams', () => {
  it('maps deprecated parameters to their new equivalents', () => {
    const requestParams = {
      signerAddress: '0x123',
      txnInvocation: 'invoke',
    };
    const mappings = {
      signerAddress: 'address',
      txnInvocation: 'calls',
    };

    const expected = {
      address: '0x123',
      calls: 'invoke',
    };

    mapDeprecatedParams(requestParams, mappings);

    expect(requestParams).toStrictEqual(expected);
  });

  it('removes the deprecated parameter after mapping', () => {
    const requestParams = {
      signerAddress: '0x123',
      txnInvocation: 'invoke',
    };
    const mappings = {
      signerAddress: 'address',
      txnInvocation: 'calls',
    };

    mapDeprecatedParams(requestParams, mappings);

    expect(requestParams).not.toHaveProperty('signerAddress');
    expect(requestParams).not.toHaveProperty('txnInvocation');
  });

  it('does nothing if the deprecated parameter does not exist', () => {
    const requestParams = {
      otherParam: 'value',
    };
    const mappings = {
      signerAddress: 'address',
    };

    const expected = { otherParam: 'value' };

    mapDeprecatedParams(requestParams, mappings);

    expect(requestParams).toStrictEqual(expected);
  });

  it('does nothing if the mapping is empty', () => {
    const requestParams = {
      signerAddress: '0x123',
    };
    const mappings = {};

    const expected = { signerAddress: '0x123' };

    mapDeprecatedParams(requestParams, mappings);

    expect(requestParams).toStrictEqual(expected);
  });
});

describe('formatCallData', () => {
  const prepareMockData = async (tokenData: Erc20Token | null) => {
    const tokenStateManagerMock =
      new TokenStateManager() as jest.Mocked<TokenStateManager>;

    // Mock getToken method to return the provided tokenData
    tokenStateManagerMock.getToken.mockResolvedValue(tokenData);

    return {
      tokenStateManagerMock,
    };
  };

  it('formats calls array without transfers', async () => {
    const callsArray = [
      {
        contractAddress: '0xContractAddress1',
        calldata: ['0xRecipientAddress', '1000'],
        entrypoint: 'someOtherEntrypoint',
      },
    ];
    const chainId = '0xChainId';
    const address = '0xSenderAddress';

    // Prepare mock data with no token data to simulate non-ERC20 contract
    const { tokenStateManagerMock } = await prepareMockData(null);

    const result = await formatCallData(
      callsArray,
      chainId,
      address,
      tokenStateManagerMock,
    );

    expect(result).toStrictEqual([
      {
        type: 'contract',
        label: 'Contract Call',
        contractAddress: '0xContractAddress1',
        chainId: '0xChainId',
        calldata: ['0xRecipientAddress', '1000'],
        entrypoint: 'someOtherEntrypoint',
        isTransfer: false,
      },
    ]);
  });

  it('formats ERC20 transfer call data', async () => {
    const callsArray = [
      {
        contractAddress: '0xErc20TokenAddress',
        calldata: ['0xRecipientAddress', '1000'],
        entrypoint: 'transfer',
      },
    ];
    const chainId = '0xChainId';
    const address = '0xSenderAddress';

    // Mock ERC20 token data
    const tokenData: Erc20Token = {
      address: '0xErc20TokenAddress',
      chainId: '0xChainId',
      symbol: 'TKN',
      decimals: 18,
      name: 'MockToken',
    };

    // Prepare mock data with ERC20 token data
    const { tokenStateManagerMock } = await prepareMockData(tokenData);

    const result = await formatCallData(
      callsArray,
      chainId,
      address,
      tokenStateManagerMock,
    );

    expect(result).toStrictEqual([
      {
        type: 'contract',
        label: 'Token Transfer',
        contractAddress: '0xErc20TokenAddress',
        chainId: '0xChainId',
        calldata: ['0xRecipientAddress', '1000'],
        entrypoint: 'transfer',
        isTransfer: true,
        senderAddress: '0xSenderAddress',
        recipientAddress: '0xRecipientAddress',
        amount: '1000',
        tokenSymbol: 'TKN',
        decimals: 18,
      },
    ]);
  });
});
