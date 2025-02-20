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
  scrollToRef?: React.RefObject<HTMLDivElement> | null;
  onAccountItemClick?: (event: React.MouseEvent) => void;
  onAccountIconClick: (event: React.MouseEvent) => void;
}

export const AccountItem = ({
  selected = false,
  account,
  visible,
  scrollToRef,
  onAccountItemClick,
  onAccountIconClick,
}: Props) => {
  const { address, accountName } = account;
  return (
    <Wrapper
      ref={scrollToRef}
      selected={selected}
      visible={visible}
      onClick={
        typeof onAccountItemClick === 'function'
          ? onAccountItemClick
          : undefined
      }
    >
      <AccountInfoWrapper>
        <AccountImageStyled size={30} address={address} />
        <div>
          <div>{accountName}</div>
          <div>{formatAddress(address)}</div>
        </div>
      </AccountInfoWrapper>
      <IconButton size="small" onClick={onAccountIconClick}>
        <VisibilityIcon icon={visible ? 'eye-slash' : 'eye'} />
      </IconButton>
    </Wrapper>
  );
};
