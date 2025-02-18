import {
  AccountDetailWrapper,
  AccountImageStyled,
  VisibilityIcon,
  Wrapper,
} from './AccountItem.style';
import { IconButton } from '@mui/material';
import { Account } from 'types';
import { formatAddress } from 'utils/utils';

export interface Props {
  account: Account;
  selected: boolean;
  visible: boolean;
  onAccountItemClick?: (event: React.MouseEvent) => void;
  onAccountIconClick: (event: React.MouseEvent) => void;
}

export const AccountItem = ({
  selected,
  account,
  visible,
  onAccountItemClick,
  onAccountIconClick,
}: Props) => {
  const { address, accountName } = account;
  return (
    <Wrapper
      selected={selected}
      visible={visible}
      onClick={
        typeof onAccountItemClick === 'function'
          ? onAccountItemClick
          : undefined
      }
    >
      <AccountDetailWrapper>
        <AccountImageStyled size={30} address={address} />
        <div>
          <div>{accountName}</div>
          <div>{formatAddress(address)}</div>
        </div>
      </AccountDetailWrapper>
      <IconButton size="small" onClick={onAccountIconClick}>
        <VisibilityIcon icon={visible ? 'eye-slash' : 'eye'} />
      </IconButton>
    </Wrapper>
  );
};
