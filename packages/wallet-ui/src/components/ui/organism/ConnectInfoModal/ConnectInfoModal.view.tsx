import { Alert } from 'components/ui/atom/Alert';
import { Button } from 'components/ui/atom/Button';
import { Bold, ButtonDiv, Normal, Wrapper } from './ConnectInfoModal.style';
import { useAppDispatch, useAppSelector } from 'hooks/redux';
import { setInfoModalVisible } from 'slices/modalSlice';

interface Props {
  address: string;
  onButtonClick?: () => void;
}

export const ConnectInfoModalView = ({ address, onButtonClick }: Props) => {
  const networks = useAppSelector((state) => state.networks);
  const dispatch = useAppDispatch();
  return (
    <div>
      <Wrapper>
        <div>
          <Normal>Network</Normal>
          <Bold>{networks.items[networks.activeNetwork].name}</Bold>
        </div>
        <div>
          <Normal>StarkNet account</Normal>
          <Bold>{address}</Bold>
        </div>
        <Alert variant="info" text="This account was generated with your MetaMask Secret Recovery Phrase." />
      </Wrapper>
      <ButtonDiv>
        <Button
          onClick={() => {
            dispatch(setInfoModalVisible(false));
            onButtonClick && onButtonClick();
          }}
        >
          GOT IT!
        </Button>
      </ButtonDiv>
    </div>
  );
};
