import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Heading, Section } from '@metamask/snaps-sdk/jsx';
import type { Infer } from 'superstruct';

import type { DeclareSignDetailsStruct } from '../../utils';
import { getTranslator } from '../../utils/locale';
import { AddressUI, JsonDataUI, NetworkUI } from '../fragments';

export type SignDeclareTransactionUIProps = {
  senderAddress: string;
  networkName: string;
  chainId: string;
  declareTransactions: Infer<typeof DeclareSignDetailsStruct>;
};

/**
 * Builds a UI component for confirming the signing of a Declare transaction.
 *
 * @param options - The options to configure the component.
 * @param options.senderAddress - The address of the sender initiating the transaction.
 * @param options.networkName - The name of the blockchain network where the transaction will occur.
 * @param options.chainId - The chain ID of the blockchain network.
 * @param options.declareTransactions - The details of the Declare transaction.
 * @returns A JSX component for the user to review and confirm the Declare transaction signing.
 */
export const SignDeclareTransactionUI: SnapComponent<
  SignDeclareTransactionUIProps
> = ({ senderAddress, networkName, chainId, declareTransactions }) => {
  const translate = getTranslator();
  return (
    <Box>
      <Heading>{translate('signTransactionPrompt')}</Heading>
      <Section>
        <AddressUI
          label={translate('signer')}
          address={senderAddress}
          chainId={chainId}
        />
        <NetworkUI networkName={networkName} />
        <JsonDataUI
          label={translate('declareTransactionDetails')}
          data={declareTransactions}
        />
      </Section>
    </Box>
  );
};
