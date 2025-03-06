import { IconButton } from '@mui/material';

import { Account } from 'types';
import { formatAddress } from 'utils/utils';
import {
  AccountInfoWrapper,
  AccountImageStyled,
  VisibilityIcon,
  Wrapper,
} from './AccountItem.style';

export interface Props {
  account: Account;
  selected?: boolean;
  visible: boolean;
  showIconButton?: boolean;
  scrollToRef?: React.RefObject<HTMLDivElement> | null;
  onItemClick?: (account: Account) => Promise<void>;
  onIconButtonClick?: (account: Account) => Promise<void>;
}

export const AccountItem = ({
  selected = false,
  account,
  visible,
  scrollToRef,
  showIconButton = true,
  onItemClick,
  onIconButtonClick,
}: Props) => {
  const { address, accountName } = account;

  const preventDefaultMouseEvent = (event: React.MouseEvent) => {
    // Prevent triggering the native behaviour
    event.preventDefault();
    // Prevent triggering the parent onClick event
    event.stopPropagation();
  };

  const onIconBtnClick = async (event: React.MouseEvent) => {
    preventDefaultMouseEvent(event);
    if (typeof onIconButtonClick === 'function') {
      await onIconButtonClick(account);
    }
  };

  const onClick = async (event: React.MouseEvent) => {
    preventDefaultMouseEvent(event);
    if (typeof onItemClick === 'function') {
      await onItemClick(account);
    }
  };

  return (
    <Wrapper
      ref={scrollToRef}
      selected={selected}
      visible={visible}
      onClick={onClick}
    >
      <AccountInfoWrapper>
        <AccountImageStyled size={30} address={address} />
        <div>
          <div>{accountName}</div>
          <div>{formatAddress(address)}</div>
        </div>
      </AccountInfoWrapper>
      {showIconButton && (
        <IconButton size="small" onClick={onIconBtnClick}>
          <VisibilityIcon icon={visible ? 'eye-slash' : 'eye'} />
        </IconButton>
      )}
    </Wrapper>
  );
};
