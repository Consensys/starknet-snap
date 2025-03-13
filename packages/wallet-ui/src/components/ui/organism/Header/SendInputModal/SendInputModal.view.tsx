import { useAppSelector } from 'hooks';
import { FeeToken } from 'types';
import { useMultiLanguage } from 'services';
import {
  getMaxAmountToSpend,
  isValidStarkName,
  shortenAddress,
} from 'utils/utils';
import { AmountInput } from 'components/ui/molecule/AmountInput';
import { AddressInput } from 'components/ui/molecule/AddressInput';
import { DropDown } from 'components/ui/molecule/DropDown';
import {
  Bold,
  Normal,
} from 'components/ui/organism/ConnectInfoModal/ConnectInfoModal.style';
import { InfoText } from 'components/ui/molecule/AddressInput/AddressInput.style';
import {
  ButtonStyled,
  MessageAlert,
  Network,
  Separator,
  SeparatorSmall,
} from './SendInputModal.style';
import { Modal } from 'components/ui/atom/Modal';

interface Props {
  closeModal?: () => void;
  setSummaryModalOpen: (open: boolean) => void;
  confirmEnabled: () => boolean;
  handleChange: (fieldName: string, fieldValue: string) => void;
  fields: {
    amount: string;
    address: string;
    chainId: string;
    feeToken: FeeToken;
  };
  errors: {
    amount: string;
    address: string;
  };
  resolvedAddress: string;
  loading: boolean;
  shouldApplyMax: boolean;
  setShouldApplyMax: (value: boolean) => void;
  feeEstimates: any;
}

export const SendInputModalView = ({
  closeModal,
  setSummaryModalOpen,
  confirmEnabled,
  handleChange,
  fields,
  errors,
  resolvedAddress,
  loading,
  shouldApplyMax,
  setShouldApplyMax,
  feeEstimates,
}: Props) => {
  const networks = useAppSelector((state) => state.networks);
  const erc20TokenBalanceSelected = useAppSelector(
    (state) => state.wallet.erc20TokenBalanceSelected,
  );
  const { translate } = useMultiLanguage();

  return (
    <Modal>
      <Modal.Title>{translate('send')}</Modal.Title>
      <Modal.Body>
        <Network>
          <Normal>{translate('network')}</Normal>
          <Bold>{networks.items[networks.activeNetwork].name}</Bold>
        </Network>
        <AddressInput
          label={translate('to')}
          placeholder={translate('pasteRecipientAddress')}
          onChange={(value) => handleChange('address', value.target.value)}
          value={fields.address}
          disableValidate
          validateError={errors.address}
        />
        {isValidStarkName(fields.address) && resolvedAddress && (
          <InfoText>{shortenAddress(resolvedAddress, 12)}</InfoText>
        )}
        <SeparatorSmall />
        <MessageAlert
          variant="info"
          text={translate('validStarknetAddressOnly')}
        />
        <Separator />
        <AmountInput
          label={translate('amount')}
          onChangeCustom={(value) => handleChange('amount', value)}
          value={fields.amount}
          error={errors.amount !== '' ? true : false}
          helperText={errors.amount}
          decimalsMax={erc20TokenBalanceSelected.decimals}
          asset={{
            ...erc20TokenBalanceSelected,
            amount: getMaxAmountToSpend(
              erc20TokenBalanceSelected,
              feeEstimates?.fee,
            ),
          }}
          isFetchingFee={loading}
          setShouldApplyMax={setShouldApplyMax}
          shouldApplyMax={shouldApplyMax}
        />
        <SeparatorSmall />
        <div>
          <label htmlFor="feeToken">
            {translate('selectTokenForTransactionFees')}
          </label>
          <DropDown
            value={fields.feeToken}
            options={Object.values(FeeToken).map((token) => ({
              label: token,
              value: token,
            }))}
            onChange={(e) => handleChange('feeToken', e.value)}
          />
        </div>
      </Modal.Body>
      <Modal.Buttons>
        <ButtonStyled onClick={closeModal} backgroundTransparent borderVisible>
          {translate('cancel')}
        </ButtonStyled>
        <ButtonStyled
          onClick={() => setSummaryModalOpen(true)}
          enabled={confirmEnabled()}
        >
          {translate('confirm')}
        </ButtonStyled>
      </Modal.Buttons>
    </Modal>
  );
};
