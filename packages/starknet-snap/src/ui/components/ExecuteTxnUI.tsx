import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Box,
  Container,
  Row,
  Section,
  Text,
  Icon,
  Divider,
} from '@metamask/snaps-sdk/jsx';
import { formatUnits } from 'ethers/lib/utils';

import type { FeeToken } from '../../types/snapApi';
import type { FormattedCallData } from '../../types/snapState';
import { DEFAULT_DECIMAL_PLACES } from '../../utils/constants';
import { AddressUI, JsonDataUI } from '../fragments';
import { FeeTokenSelector } from '../fragments/FeeTokenSelector';

export type ExecuteTxnUIProps = {
  type: string;
  signer: string;
  chainId: string;
  maxFee: string;
  calls: FormattedCallData[];
  selectedFeeToken: string;
  includeDeploy: boolean;
};

type TokenTotals = Record<
  string,
  {
    amount: bigint; // Use BigInt for precise calculations
    decimals: number;
  }
>;

/**
 * Calculates the totals for all tokens involved in calls and fees.
 *
 * @param calls - The transaction calls.
 * @param maxFee - The maximum fee as a string BigInt.
 * @param selectedFeeToken - The token symbol used for fees.
 * @returns The calculated totals for each token.
 */
export const calculateTotals = (
  calls: {
    isTransfer: boolean;
    tokenSymbol?: string;
    amount?: string; // Amount as a string BigInt
    decimals?: number;
  }[],
  maxFee: string,
  selectedFeeToken: string,
): TokenTotals => {
  const tokenTotals: TokenTotals = {};

  // Sum up transfer amounts for each token
  calls.forEach((call) => {
    if (call.amount && call.tokenSymbol && call.decimals && call.isTransfer) {
      const amount = BigInt(call.amount); // Convert to BigInt
      if (!tokenTotals[call.tokenSymbol]) {
        tokenTotals[call.tokenSymbol] = {
          amount: BigInt(0),
          decimals: call.decimals,
        };
      }
      tokenTotals[call.tokenSymbol].amount += amount;
    }
  });

  // Add the fee to the corresponding token
  const feeTokenAmount = BigInt(maxFee);
  if (tokenTotals[selectedFeeToken]) {
    tokenTotals[selectedFeeToken].amount += feeTokenAmount;
  } else {
    // We derive decimals based on the fee token. Currently, both supported fee tokens, ETH and STRK, use the standard 18 decimals.
    // Therefore, we use DEFAULT_DECIMAL_PLACES set to 18 here. If additional fee tokens with different decimals are introduced,
    // this logic should be updated to handle token-specific decimals dynamically.
    tokenTotals[selectedFeeToken] = {
      amount: feeTokenAmount,
      decimals: DEFAULT_DECIMAL_PLACES,
    };
  }

  return tokenTotals;
};

/**
 * A component for executing transactions, providing details and options to configure the transaction.
 *
 * @param props - The component props.
 * @param props.signer - The signer for the transaction.
 * @param props.chainId - The ID of the chain for the transaction.
 * @param props.maxFee - The maximum fee allowed for the transaction.
 * @param props.calls - The calls involved in the transaction.
 * @param props.selectedFeeToken - The token used for fees.
 * @param props.includeDeploy - Whether to include account deployment in the transaction.
 * //param props.errors : TODO : add this param
 * @returns The ExecuteTxnUI component.
 */
export const ExecuteTxnUI: SnapComponent<ExecuteTxnUIProps> = ({
  signer,
  chainId,
  maxFee,
  calls,
  selectedFeeToken,
  includeDeploy,
  // errors, // TODO: include this later
}) => {
  // Calculate the totals using the helper
  const tokenTotals = calculateTotals(calls, maxFee, selectedFeeToken);

  return (
    <Container>
      <Box>
        <Section>
          <AddressUI label="Signer" address={signer} chainId={chainId} />
        </Section>

        {/* Loop through each call and render based on isTransfer */}

        {calls.map((call) => (
          <Section>
            {call.isTransfer ? (
              <AddressUI
                label="Token Transfer"
                address={call.contractAddress}
                chainId={chainId}
              />
            ) : (
              <AddressUI
                label="Contract Interaction"
                address={call.contractAddress}
                chainId={chainId}
              />
            )}
            {call.amount &&
            call.senderAddress &&
            call.recipientAddress &&
            call.isTransfer ? (
              <Section>
                {call.senderAddress === signer ? null : (
                  <AddressUI
                    label="Sender Address"
                    address={call.senderAddress}
                    chainId={chainId}
                  />
                )}
                <AddressUI
                  label="Recipient Address"
                  address={call.recipientAddress}
                  chainId={chainId}
                />
                <Row label={`Amount`}>
                  <Text>{`${formatUnits(call.amount, call.decimals)} ${
                    call.tokenSymbol as string
                  }`}</Text>
                </Row>
              </Section>
            ) : (
              <JsonDataUI label="Call Data" data={call.calldata} />
            )}
          </Section>
        ))}
        <FeeTokenSelector selectedToken={selectedFeeToken as FeeToken} />
        <Section>
          <Icon name="gas" size="md" />
          <Row label="Estimated network fee">
            <Text>
              {`${formatUnits(
                maxFee,
                DEFAULT_DECIMAL_PLACES,
              )} ${selectedFeeToken}`}
            </Text>
          </Row>
          <Divider />
          <Icon name="money" size="md" />
          <Box direction="vertical">
            {Object.entries(tokenTotals).map(
              ([tokenSymbol, { amount, decimals }]) => (
                <Row key={tokenSymbol} label={`Total for ${tokenSymbol}`}>
                  <Text>{`${formatUnits(
                    amount,
                    decimals,
                  )} ${tokenSymbol}`}</Text>
                </Row>
              ),
            )}
          </Box>
          {includeDeploy ? <Divider /> : null}
          {includeDeploy ? (
            <Box direction="horizontal">
              <Icon name="warning" size="md" />
              <Text>The account will be deployed with this transaction</Text>
            </Box>
          ) : null}
        </Section>
      </Box>
    </Container>
  );
};
