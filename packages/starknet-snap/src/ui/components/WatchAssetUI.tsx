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
 * Builds a loading UI component.
 *
 * @param options0
 * @param options0.networkName
 * @param options0.chainId
 * @param options0.token
 * @returns A loading component.
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
