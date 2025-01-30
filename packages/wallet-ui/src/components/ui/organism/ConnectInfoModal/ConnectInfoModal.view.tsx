import { Alert } from 'components/ui/atom/Alert';
import { Button } from 'components/ui/atom/Button';
import { Bold, ButtonDiv, Normal, Wrapper } from './ConnectInfoModal.style';
import { useAppDispatch, useAppSelector } from 'hooks/redux';
import { setInfoModalVisible } from 'slices/modalSlice';
import { useMultiLanguage } from 'services';

interface Props {
  address: string;
  onButtonClick?: () => void;
}

export const ConnectInfoModalView = ({ address, onButtonClick }: Props) => {
  const networks = useAppSelector((state) => state.networks);
  const dispatch = useAppDispatch();
  const { translate } = useMultiLanguage();

  return (
    <div>
      <Wrapper>
        <div>
          <Normal>{translate('network')}</Normal>
          <Bold>{networks.items[networks.activeNetwork].name}</Bold>
        </div>
        <div>
          <Normal>{translate('starknetAccount')}</Normal>
          <Bold>{address}</Bold>
        </div>
        <Alert
          variant="info"
          text={translate('accountGeneratedWithRecoveryPhrase')}
        />
      </Wrapper>
      <ButtonDiv>
        <Button
          onClick={() => {
            dispatch(setInfoModalVisible(false));
            onButtonClick && onButtonClick();
          }}
        >
          {translate('gotIt')}
        </Button>
      </ButtonDiv>
    </div>
  );
};
