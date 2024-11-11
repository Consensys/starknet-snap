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
  Object.values(FeeToken).map((token) => console.log(token));
  console.log(`Selected token ${selectedToken}`);
  return (
    <Form name="form-fee-token-selection">
      <Field label="Fee Token">
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
          {/* <SelectorOption value="option-1">
          <Card title="Option 1" value="First option" />
        </SelectorOption>
        <SelectorOption value="option-2">
          <Card title="Option 2" value="Second option" />
        </SelectorOption> */}
        </Selector>
        {/* 
      <Selector
        name="feeTokenSelector"
        title="Select Fee Token"
        value={selectedToken}
      >
        {Object.values(FeeToken).map((token) => (
          <SelectorOption key={token} value={token}>
            <RowUI label={token} value={FeeTokenUnit[token]} />
          </SelectorOption>
        ))}
      </Selector> 
      */}
      </Field>
    </Form>
  );
};
