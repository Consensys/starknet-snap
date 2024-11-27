import { constants } from 'starknet';

import { STARKNET_SEPOLIA_TESTNET_NETWORK } from '../utils/constants';
import { InvalidRequestParamsError } from '../utils/exceptions';
import * as starknetUtils from '../utils/starknetUtils';
import {
  getAddrFromStarkName,
  GetAddrFromStarkNameParams,
} from './get-addr-from-starkname';

jest.mock('../utils/snap');
jest.mock('../utils/logger');

const prepareMockGetAddrFromStarkName = ({
  chainId,
  starkName,
}: {
  chainId: constants.StarknetChainId;
  starkName: string;
}) => {
  const request = {
    chainId,
    starkName,
  } as unknown as GetAddrFromStarkNameParams;

  const getAddrFromStarkNameSpy = jest.spyOn(
    starknetUtils,
    'getAddrFromStarkNameUtil',
  );
  getAddrFromStarkNameSpy.mockResolvedValue(
    '0x01c744953f1d671673f46a9179a58a7e58d9299499b1e076cdb908e7abffe69f',
  );

  return {
    request,
    getAddrFromStarkNameSpy,
  };
};

describe('getAddrFromStarkName', () => {
  const state = {
    accContracts: [],
    erc20Tokens: [],
    networks: [STARKNET_SEPOLIA_TESTNET_NETWORK],
    transactions: [],
  };

  it('get address from stark name correctly', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const { request, getAddrFromStarkNameSpy } =
      prepareMockGetAddrFromStarkName({
        chainId,
        starkName: 'testname.stark',
      });

    const result = await getAddrFromStarkName.execute(request);

    expect(result).toStrictEqual(
      '0x01c744953f1d671673f46a9179a58a7e58d9299499b1e076cdb908e7abffe69f',
    );
  });

  it('throws `InvalidRequestParamsError` when request parameter is not correct', async () => {
    await expect(
      getAddrFromStarkName.execute({} as unknown as GetAddrFromStarkNameParams),
    ).rejects.toThrow(InvalidRequestParamsError);
  });
});
