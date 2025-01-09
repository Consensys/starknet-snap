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
import { getTranslator } from '../../utils/locale';

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
  const t = getTranslator();
  const { name, symbol, address, decimals } = token;
  return (
    <Box>
      <Heading>{t("signTransactionPrompt")}</Heading>
      <Divider />
      <NetworkUI networkName={networkName} />
      <Section>
        <AddressUI label={t("tokenLabel")} address={address} chainId={chainId} />
        <Section>
          {name ? (
            <Row label={t("nameLabel")}>
              <Text>{name}</Text>
            </Row>
          ) : null}
          {symbol ? (
            <Row label={t("symbolLabel")}>
              <Text>{symbol}</Text>
            </Row>
          ) : null}
          {decimals !== null && (
            <Row label={t("decimalsLabel")}>
              <Text>{decimals.toString()}</Text>
            </Row>
          )}
        </Section>
      </Section>
    </Box>
  );
};
