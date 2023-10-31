import { Signature, Signer, stark } from 'starknet';
import { ApiParams, SignTransactionParams } from './types/snapApi';
import { getKeysFromAddress } from './utils/starknetUtils';
import { getNetworkFromChainId } from './utils/snapUtils';

export async function signTransaction(params: ApiParams): Promise<Signature> {
  const { state, keyDeriver, requestParams } = params;
  const requestParamsObj = requestParams as SignTransactionParams;
  const userAddress = requestParamsObj.userAddress;
  const network = getNetworkFromChainId(state, requestParamsObj.chainId);
  const { privateKey } = await getKeysFromAddress(keyDeriver, network, state, userAddress);
  const signer = new Signer(privateKey);

  try {
    const signatures = await signer.signTransaction(
      requestParamsObj.transactions,
      requestParamsObj.transactionsDetail,
      requestParamsObj.abis,
    );
    const formattedSignatures = stark.signatureToDecimalArray(signatures);
    const publicSigner = await signer.getPubKey();

    return [publicSigner, ...formattedSignatures];
  } catch (error) {
    throw new Error('Error signing the transaction');
  }
}
