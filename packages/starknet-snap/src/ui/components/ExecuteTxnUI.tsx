import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Box,
  Container,
  Section,
  Text,
  Icon,
  Divider,
} from '@metamask/snaps-sdk/jsx';

import type { FeeToken } from '../../types/snapApi';
import type { FormattedCallData } from '../../types/snapState';
import { DEFAULT_DECIMAL_PLACES } from '../../utils/constants';
import { AddressUI, JsonDataUI, NetworkUI, SignerUI } from '../fragments';
import { Amount } from '../fragments/Amount';
import { FeeTokenSelector } from '../fragments/FeeTokenSelector';
import { accumulateTotals } from '../utils';

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
  signer: string;
  chainId: string;
  networkName: string;
  maxFee: string;
  calls: FormattedCallData[];
  selectedFeeToken: string;
  includeDeploy: boolean;
  errors?: ExecuteTxnUIErrors;
};

/**
 * A component for executing transactions, providing details and options to configure the transaction.
 *
 * @param props - The component props.
 * @param props.signer - The signer for the transaction.
 * @param props.chainId - The ID of the chain for the transaction.
 * @param props.networkName - The ID of the chain for the transaction.
 * @param props.maxFee - The maximum fee allowed for the transaction.
 * @param props.calls - The calls involved in the transaction.
 * @param props.selectedFeeToken - The token used for fees.
 * @param props.includeDeploy - Whether to include account deployment in the transaction.
 * @param [props.errors] - The object contains the error message for fee token selection.
 * @returns The ExecuteTxnUI component.
 */
export const ExecuteTxnUI: SnapComponent<ExecuteTxnUIProps> = ({
  signer,
  chainId,
  networkName,
  maxFee,
  calls,
  selectedFeeToken,
  includeDeploy,
  errors,
}) => {
  // Calculate the totals using the helper
  const tokenTotals = accumulateTotals(calls, maxFee, selectedFeeToken);

  return (
    <Container>
      <Box>
        <Section>
          <NetworkUI networkName={networkName} />
          <SignerUI address={signer} chainId={chainId} />
        </Section>

        {/* Loop through each call and render based on `tokenTransferData` */}
        {calls.map((call) => (
          <Section>
            <AddressUI
              label="Contract"
              address={call.contractAddress}
              chainId={chainId}
            />
            {call.tokenTransferData ? (
              <Section>
                <AddressUI
                  label="Recipient"
                  address={call.tokenTransferData.recipientAddress}
                  chainId={chainId}
                />
                <Amount
                  label={`Amount`}
                  amount={call.tokenTransferData.amount}
                  decimals={call.tokenTransferData.decimals}
                  symbol={call.tokenTransferData.symbol}
                />
              </Section>
            ) : (
              <JsonDataUI label="Call Data" data={call.calldata} />
            )}
          </Section>
        ))}
        <FeeTokenSelector
          selectedToken={selectedFeeToken as FeeToken}
          error={errors?.fees}
        />
        <Section>
          <Icon name="gas" size="md" />
          <Amount
            label="Network fee"
            amount={maxFee}
            decimals={DEFAULT_DECIMAL_PLACES}
            symbol={selectedFeeToken}
          />
          <Divider />
          <Icon name="money" size="md" />
          <Box direction="vertical">
            {Object.entries(tokenTotals).map(
              ([tokenSymbol, { amount, decimals }]) => (
                <Amount
                  label={`Total for ${tokenSymbol}`}
                  amount={amount.toString()}
                  decimals={decimals}
                  symbol={tokenSymbol}
                />
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
