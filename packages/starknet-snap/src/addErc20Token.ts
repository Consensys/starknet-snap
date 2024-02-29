import { toJson } from './utils/serializer';
import { AddErc20TokenRequestParams, ApiParams } from './types/snapApi';
import { Erc20Token } from './types/snapState';
import {
  getNetworkFromChainId,
  upsertErc20Token,
  getValidNumber,
  validateAddErc20TokenParams,
  getAddTokenText,
} from './utils/snapUtils';
import { DEFAULT_DECIMAL_PLACES } from './utils/constants';
import { DialogType } from '@metamask/rpc-methods';
import { heading, panel } from '@metamask/snaps-sdk';
import { logger } from './utils/logger';

export async function addErc20Token(params: ApiParams) {
  try {
    const { state, wallet, saveMutex, requestParams } = params;
    const requestParamsObj = requestParams as AddErc20TokenRequestParams;

    if (!requestParamsObj.tokenAddress || !requestParamsObj.tokenName || !requestParamsObj.tokenSymbol) {
      throw new Error(
        `The given token address, name, and symbol need to be non-empty string, got: ${toJson(requestParamsObj)}`,
      );
    }

    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const tokenAddress = requestParamsObj.tokenAddress;
    const tokenName = requestParamsObj.tokenName;
    const tokenSymbol = requestParamsObj.tokenSymbol;
    const tokenDecimals = getValidNumber(requestParamsObj.tokenDecimals, DEFAULT_DECIMAL_PLACES, 0);

    validateAddErc20TokenParams(requestParamsObj, network);

    const response = await wallet.request({
      method: 'snap_dialog',
      params: {
        type: DialogType.Confirmation,
        content: panel([
          heading('Do you want to add this token?'),
          ...getAddTokenText(tokenAddress, tokenName, tokenSymbol, tokenDecimals, network),
        ]),
      },
    });
    if (!response) return false;

    const erc20Token: Erc20Token = {
      address: tokenAddress,
      name: tokenName,
      symbol: tokenSymbol,
      decimals: tokenDecimals,
      chainId: network.chainId,
    };

    await upsertErc20Token(erc20Token, wallet, saveMutex);

    logger.log(`addErc20Token:\nerc20Token: ${toJson(erc20Token)}`);
    return erc20Token;
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
