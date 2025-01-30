import type { SnapComponent } from '@metamask/snaps-sdk/jsx';

import { getTranslator } from '../../utils/locale';
import { AddressUI } from './AddressUI';

export type SignerUIProps = {
  address: string;
  chainId: string;
};

/**
 * Build a row component with the signer address.
 *
 * @param params - The parameters.
 * @param params.address - The signer address.
 * @param params.chainId - The chain ID.
 * @returns A row component with the signer address.
 */
export const SignerUI: SnapComponent<SignerUIProps> = ({
  address,
  chainId,
}: SignerUIProps) => {
  const translate = getTranslator();
  return (
    <AddressUI
      label={translate('signerAddress')}
      address={address}
      chainId={chainId}
      shortern={true}
    />
  );
};
