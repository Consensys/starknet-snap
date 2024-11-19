import type { SnapComponent } from '@metamask/snaps-sdk/jsx';

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
}: SignerUIProps) => (
  <AddressUI
    label="Signer Address"
    address={address}
    chainId={chainId}
    shortern={true}
  />
);
