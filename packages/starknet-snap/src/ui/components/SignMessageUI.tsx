import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Heading, Section } from '@metamask/snaps-sdk/jsx';
import type { Infer } from 'superstruct';

import type { TypeDataStruct } from '../../utils';
import { JsonDataUI, SignerUI } from '../fragments';

export type SignMessageUIProps = {
  address: string;
  chainId: string;
  typedDataMessage: Infer<typeof TypeDataStruct>;
};

/**
 * Builds a UI component for confirming the signing of a message.
 *
 * @param options - The options to configure the component.
 * @param options.address - The address of the signer.
 * @param options.chainId - The chain ID of the blockchain network.
 * @param options.typedDataMessage - The typed data message to be signed.
 * @returns A JSX component for the user to review and confirm the message signing.
 */
export const SignMessageUI: SnapComponent<SignMessageUIProps> = ({
  address,
  chainId,
  typedDataMessage,
}) => {
  return (
    <Box>
      <Heading>Do you want to sign this message?</Heading>
      <Section>
        <SignerUI address={address} chainId={chainId} />
        <JsonDataUI label="Message" data={typedDataMessage} />
      </Section>
    </Box>
  );
};
