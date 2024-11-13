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
  error?: string;
};

/**
 * A component that allows the user to select the fee token.
 *
 * @param props - The component props.
 * @param props.selectedToken - The currently selected fee token.
 * @param props.error
 * @returns The FeeTokenSelector component.
 */
export const FeeTokenSelector: SnapComponent<FeeTokenSelectorProps> = ({
  selectedToken,
  error,
}) => {
  return (
    <Form name="form-fee-token-selection">
      <Field label="Fee Token" error={error}>
        <Selector
          name="feeTokenSelector"
          title="Select Fee Token"
          value={selectedToken}
        >
          {Object.values(FeeToken).map((token) => (
            <SelectorOption value={token}>
              <Card title={token} value={FeeTokenUnit[token]} />
            </SelectorOption>
          ))}
        </Selector>
      </Field>
    </Form>
  );
};
