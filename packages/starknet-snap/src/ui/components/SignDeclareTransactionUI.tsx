import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Heading, Section } from '@metamask/snaps-sdk/jsx';
import type { Infer } from 'superstruct';

import type { DeclareSignDetailsStruct } from '../../utils';
import { AddressUI, JsonDataUI, NetworkUI } from '../fragments';

export type SignDeclareTransactionUIProps = {
  senderAddress: string;
  networkName: string;
  chainId: string;
  details: Infer<typeof DeclareSignDetailsStruct>;
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
export const SignDeclareTransactionUI: SnapComponent<
  SignDeclareTransactionUIProps
> = ({ senderAddress, networkName, chainId, details }) => {
  return (
    <Box>
      <Heading>Do you want to sign this transaction?</Heading>
      <Section>
        <AddressUI label="Signer" address={senderAddress} chainId={chainId} />
        <NetworkUI networkName={networkName} />
        <JsonDataUI label={'Declare Transaction Details'} data={details} />
      </Section>
    </Box>
  );
};
