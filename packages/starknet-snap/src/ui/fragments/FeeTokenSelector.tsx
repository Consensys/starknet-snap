import {
  Card,
  Field,
  Form,
  Selector,
  SelectorOption,
  type SnapComponent,
} from '@metamask/snaps-sdk/jsx';

import { FeeToken, FeeTokenUnit } from '../../types/snapApi';

/**
 * The props for the {@link FeeTokenSelector} component.
 *
 * @property selectedToken - The currently selected fee token.
 */
export type FeeTokenSelectorProps = {
  selectedToken: FeeToken;
};

/**
 * A component that allows the user to select the fee token.
 *
 * @param props - The component props.
 * @param props.selectedToken - The currently selected fee token.
 * @returns The FeeTokenSelector component.
 */
export const FeeTokenSelector: SnapComponent<FeeTokenSelectorProps> = ({
  selectedToken,
}) => {
  return (
    <Form name="form-fee-token-selection">
      <Field label="Fee Token">
        <Selector
          name="feeTokenSelector"
          title="Select Fee Token"
          value={selectedToken}
        >
          <SelectorOption value={FeeToken.ETH}>
            <Card title="ETH" value={FeeTokenUnit.ETH} />
          </SelectorOption>
          <SelectorOption value={FeeToken.STRK}>
            <Card title="STRK" value={FeeTokenUnit.STRK} />
          </SelectorOption>
        </Selector>
      </Field>
    </Form>
  );
};