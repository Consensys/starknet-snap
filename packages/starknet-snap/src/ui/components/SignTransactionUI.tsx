import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Heading, Section } from '@metamask/snaps-sdk/jsx';
import type { Infer } from 'superstruct';

import type { CallDataStruct } from '../../utils';
import { JsonDataUI, AddressUI, NetworkUI } from '../fragments';

export type SignTransactionUIProps = {
  senderAddress: string;
  networkName: string;
  chainId: string;
  details: Infer<typeof CallDataStruct>[];
};

/**
 * Builds a loading UI component.
 *
 * @param options0
 * @param options0.senderAddress
 * @param options0.networkName
 * @param options0.chainId
 * @param options0.details
 * @returns A loading component.
 */
export const SignTransactionUI: SnapComponent<SignTransactionUIProps> = ({
  senderAddress,
  networkName,
  chainId,
  details,
}) => {
  return (
    <Box>
      <Heading>Do you want to sign this transaction?</Heading>
      <Section>
        <AddressUI label="Signer" address={senderAddress} chainId={chainId} />
        <NetworkUI networkName={networkName} />
        <JsonDataUI label={'Transactions'} data={details} />
      </Section>
    </Box>
  );
};
