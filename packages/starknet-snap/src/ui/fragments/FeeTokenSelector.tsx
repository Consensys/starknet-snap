import {
  Card,
  Field,
  Form,
  Selector,
  Text,
  SelectorOption,
  type SnapComponent,
} from '@metamask/snaps-sdk/jsx';

import { FeeToken, FeeTokenUnit } from '../../types/snapApi';
import { getTranslator } from '../../utils/locale';

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
 * @param [props.error] - The error message for fee token selection.
 * @returns The FeeTokenSelector component.
 */
export const FeeTokenSelector: SnapComponent<FeeTokenSelectorProps> = ({
  selectedToken,
  error,
}) => {
  const translate = getTranslator();
  return (
    <Form name="form-fee-token-selection">
      <Field label={translate("feeToken")} error={error}>
        <Selector
          name="feeTokenSelector"
          title={translate("selectFeeToken")}
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
      <Text color="muted">
        {translate('autoSwitchToFundedToken')}
      </Text>
    </Form>
  );
};
