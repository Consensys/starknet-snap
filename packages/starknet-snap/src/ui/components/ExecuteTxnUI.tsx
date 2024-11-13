import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Box,
  Container,
  Row,
  Section,
  Value,
  Text,
  Icon,
  Divider,
} from '@metamask/snaps-sdk/jsx';
import { formatUnits } from 'ethers/lib/utils';

import type { FeeToken } from '../../types/snapApi';
import { DEFAULT_DECIMAL_PLACES } from '../../utils/constants';
import { AddressUI, JsonDataUI, RowUI } from '../fragments';
import { FeeTokenSelector } from '../fragments/FeeTokenSelector';

/**
 * The form errors.
 *
 * @property to - The error for the receiving address.
 * @property amount - The error for the amount.
 * @property fees - The error for the fees.
 */
export type ExecuteTxnUIErrors = {
  fees?: string;
};

export type ExecuteTxnUIProps = {
  type: string;
  signer: string;
  chainId: string;
  maxFee: string;
  calls: any[];
  feeToken: string;
  includeDeploy: boolean;
  errors?: ExecuteTxnUIErrors;
};

/**
 * A component for executing transactions, providing details and options to configure the transaction.
 *
 * @param props - The component props.
 * @param props.signer - The signer for the transaction.
 * @param props.chainId - The ID of the chain for the transaction.
 * @param props.maxFee - The maximum fee allowed for the transaction.
 * @param props.calls - The calls involved in the transaction.
 * @param props.feeToken - The token used for fees.
 * @param props.includeDeploy - Whether to include account deployment in the transaction.
 * //param props.errors : TODO : add this param
 * @param props.errors
 * @returns The ExecuteTxnUI component.
 */
export const ExecuteTxnUI: SnapComponent<ExecuteTxnUIProps> = ({
  signer,
  chainId,
  maxFee,
  calls,
  feeToken,
  includeDeploy,
  errors,
  // errors, // TODO: include this later
}) => {
  const tokenTotals: Record<string, { amount: number; decimals: number }> = {};

  // Sum up each call's transfer amount, converting to float
  calls.forEach((call) => {
    if (call.isTransfer) {
      if (!tokenTotals[call.tokenSymbol]) {
        tokenTotals[call.tokenSymbol] = { amount: 0, decimals: call.decimals };
      }

      tokenTotals[call.tokenSymbol].amount += parseFloat(
        formatUnits(call.amount, call.decimals),
      );
    }
  });

  // Convert maxFee (BigNumber) to float and add to feeToken's total if it's present
  const feeTokenAmount = parseFloat(
    formatUnits(maxFee, DEFAULT_DECIMAL_PLACES),
  );
  if (feeToken) {
    if (tokenTotals[feeToken] === undefined) {
      tokenTotals[feeToken] = {
        amount: feeTokenAmount,
        decimals: DEFAULT_DECIMAL_PLACES,
      };
    } else {
      tokenTotals[feeToken].amount += feeTokenAmount;
    }
  }

  return (
    <Container>
      <Box>
        <Section>
          <AddressUI label="Signer" address={signer} chainId={chainId} />
        </Section>

        {/* Loop through each call and render based on isTransfer */}

        {calls.map((call) => (
          <Section>
            <AddressUI
              label={call.label}
              address={call.contractAddress}
              chainId={chainId}
              svgIcon={call.svgIcon}
            />
            {call.isTransfer ? (
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
                <RowUI
                  label={`Amount`}
                  value={`${formatUnits(call.amount, call.decimals)} ${
                    call.tokenSymbol as string
                  }`}
                />
              </Section>
            ) : (
              <JsonDataUI label="Call Data" data={call.calldata} />
            )}
          </Section>
        ))}
        <FeeTokenSelector
          selectedToken={feeToken as FeeToken}
          error={errors?.fees}
        />
        <Section>
          <Icon name="gas" size="md" />
          <Row label="Estimated network fee">
            <Value
              value={`${formatUnits(
                maxFee,
                DEFAULT_DECIMAL_PLACES,
              )} ${feeToken}`}
              extra={`$0`}
            />
          </Row>
          <Divider />
          <Icon name="money" size="md" />
          <Box direction="vertical">
            {Object.entries(tokenTotals).map(([tokenSymbol, { amount }]) => (
              <Row key={tokenSymbol} label={`Total for ${tokenSymbol}`}>
                <Value value={`${amount} ${tokenSymbol}`} extra={`$0`} />
              </Row>
            ))}
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
