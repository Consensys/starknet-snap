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
  const { name, symbol, address, decimals } = token;
  return (
    <Box>
      <Heading>Do you want to add this token?</Heading>
      <Divider />
      <NetworkUI networkName={networkName} />
      <Section>
        <AddressUI label="Token" address={address} chainId={chainId} />
        <Section>
          {name ? (
            <Row label="Name">
              <Text>{name}</Text>
            </Row>
          ) : null}
          {symbol ? (
            <Row label="Symbol">
              <Text>{symbol}</Text>
            </Row>
          ) : null}
          {decimals !== null && (
            <Row label="Decimals">
              <Text>{decimals.toString()}</Text>
            </Row>
          )}
        </Section>
      </Section>
    </Box>
  );
};
