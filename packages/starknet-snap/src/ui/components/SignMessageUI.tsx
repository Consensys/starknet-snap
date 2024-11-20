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
 * Builds a loading UI component.
 *
 * @param options0
 * @param options0.address
 * @param options0.typedDataMessage
 * @param options0.chainId
 * @returns A loading component.
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
