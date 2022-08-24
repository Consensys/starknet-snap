import { AddErc20TokenRequestParams, ApiParams } from './types/snapApi';
import { Erc20Token } from './types/snapState';
import {
  getNetworkFromChainId,
  upsertErc20Token,
  getValidNumber,
  validateAddErc20TokenParams,
} from './utils/snapUtils';
import { DEFAULT_DECIMAL_PLACES } from './utils/constants';

export async function addErc20Token(params: ApiParams) {
  try {
    const { state, wallet, saveMutex, requestParams } = params;
    const requestParamsObj = requestParams as AddErc20TokenRequestParams;

    if (!requestParamsObj.tokenAddress || !requestParamsObj.tokenName || !requestParamsObj.tokenSymbol) {
      throw new Error(
        `The given token address, name, and symbol need to be non-empty string, got: ${JSON.stringify(
          requestParamsObj,
        )}`,
      );
    }

    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const tokenAddress = requestParamsObj.tokenAddress;
    const tokenName = requestParamsObj.tokenName;
    const tokenSymbol = requestParamsObj.tokenSymbol;
    const tokenDecimals = getValidNumber(requestParamsObj.tokenDecimals, DEFAULT_DECIMAL_PLACES, 0);

    validateAddErc20TokenParams(requestParamsObj, network);

    const erc20Token: Erc20Token = {
      address: tokenAddress,
      name: tokenName,
      symbol: tokenSymbol,
      decimals: tokenDecimals,
      chainId: network.chainId,
    };

    await upsertErc20Token(erc20Token, wallet, saveMutex);

    console.log(`addErc20Token:\nerc20Token: ${JSON.stringify(erc20Token)}`);
    return erc20Token;
  } catch (err) {
    console.error(`Problem found: ${err}`);
    throw err;
  }
}
