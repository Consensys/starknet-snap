import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Box,
  Divider,
  Heading,
  Section,
  Text,
  Row,
} from '@metamask/snaps-sdk/jsx';

import type { Erc20Token } from '../../types/snapState';
import { getTranslator } from '../../utils/locale';
import { AddressUI, NetworkUI } from '../fragments';

export type WatchAssetUIProps = {
  networkName: string;
  chainId: string;
  token: Erc20Token;
};

/**
 * Builds a UI component for confirming the addition of an ERC-20 token.
 *
 * @param options - The options to configure the component.
 * @param options.networkName - The name of the blockchain network (e.g., Ethereum, Binance Smart Chain).
 * @param options.chainId - The chain ID of the blockchain network.
 * @param options.token - The ERC-20 token details, including its name, symbol, address, and decimals.
 * @returns A JSX component for the user to confirm adding the token.
 */
export const WatchAssetUI: SnapComponent<WatchAssetUIProps> = ({
  networkName,
  chainId,
  token,
}) => {
  const translate = getTranslator();
  const { name, symbol, address, decimals } = token;
  return (
    <Box>
      <Heading>{translate('signTransactionPrompt')}</Heading>
      <Divider />
      <NetworkUI networkName={networkName} />
      <Section>
        <AddressUI
          label={translate('tokenLabel')}
          address={address}
          chainId={chainId}
        />
        <Section>
          {name ? (
            <Row label={translate('nameLabel')}>
              <Text>{name}</Text>
            </Row>
          ) : null}
          {symbol ? (
            <Row label={translate('symbolLabel')}>
              <Text>{symbol}</Text>
            </Row>
          ) : null}
          {decimals !== null && (
            <Row label={translate('decimalsLabel')}>
              <Text>{decimals.toString()}</Text>
            </Row>
          )}
        </Section>
      </Section>
    </Box>
  );
};
