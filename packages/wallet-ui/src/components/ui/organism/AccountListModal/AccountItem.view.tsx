import {
  AccountDetailWrapper,
  AccountImageStyled,
  Wrapper,
} from './AccountItem.style';
import { IconButton } from '@mui/material';
import { theme } from 'theme/default';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Account } from 'types';
import { shortenAddress } from 'utils/utils';

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
        <AccountImageStyled size={30} address={account.address} />
        <div>
          <div>{account.accountName}</div>
          <div>{shortenAddress(account.address)}</div>
        </div>
      </AccountDetailWrapper>
      <IconButton size="small" onClick={onAccountIconClick}>
        <FontAwesomeIcon
          icon={visible ? 'eye-slash' : 'eye'}
          color={theme.palette.primary.main}
        />
      </IconButton>
    </Wrapper>
  );
};
