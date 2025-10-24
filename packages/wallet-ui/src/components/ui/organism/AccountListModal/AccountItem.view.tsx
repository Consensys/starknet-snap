import { IconButton, Menu } from '@mui/material';
import { useState } from 'react';
import { Account } from 'types';
import { formatAddress } from 'utils/utils';
import {
  AccountInfoWrapper,
  AccountImageStyled,
  VisibilityIcon,
  Wrapper,
  MenuItem,
  AccountDetailsWrapper,
  AccountName,
  AccountAddress,
} from './AccountItem.style';
import { useMultiLanguage } from 'services';

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
  const { translate } = useMultiLanguage();
  const { address, accountName } = account;
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const preventDefaultMouseEvent = (event: React.MouseEvent) => {
    // Prevent triggering the native behaviour
    event.preventDefault();
    event.stopPropagation();
  };

  const onIconBtnClick = async (event: React.MouseEvent) => {
    preventDefaultMouseEvent(event);
    if (typeof onIconButtonClick === 'function') {
      await onIconButtonClick(account);
    }
    setMenuAnchorEl(null);
  };

  const onClick = async (event: React.MouseEvent) => {
    preventDefaultMouseEvent(event);
    if (typeof onItemClick === 'function') {
      await onItemClick(account);
    }
  };

  const handleCopyAddress = (event: React.MouseEvent) => {
    preventDefaultMouseEvent(event);
    navigator.clipboard.writeText(address);
    setMenuAnchorEl(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    preventDefaultMouseEvent(event);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
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
        <AccountDetailsWrapper>
          <AccountName>{accountName}</AccountName>
          <AccountAddress>{formatAddress(address)}</AccountAddress>
        </AccountDetailsWrapper>
      </AccountInfoWrapper>
      <div>
        <IconButton
          size="small"
          style={{ width: '30px' }}
          onClick={handleMenuOpen}
        >
          <VisibilityIcon icon="ellipsis-vertical" />
        </IconButton>
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
        >
          {showIconButton && (
            <MenuItem onClick={onIconBtnClick}>
              <VisibilityIcon icon={visible ? 'eye-slash' : 'eye'} />
              <span>{visible ? translate('hide') : translate('unhide')}</span>
            </MenuItem>
          )}
          <MenuItem onClick={handleCopyAddress}>
            <VisibilityIcon icon="clone" />
            <span>{translate('copyToClipboard')}</span>
          </MenuItem>
        </Menu>
      </div>
    </Wrapper>
  );
};
