import { Account } from 'types';
import {
  AccountImageStyled,
  AccountSwitchMenuItem,
  MenuSection,
  MenuItemText,
} from '../AccountSwitchModal.style';
import { Menu } from '@headlessui/react';
import { Box, IconButton } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { shortenAddress } from 'utils/utils';
import { useMultiLanguage } from 'services';

interface Props {
  accounts: Account[];
  onAccountVisibleClick: (account: Account) => void;
}

export const HiddenAccountsListView = ({
  accounts,
  onAccountVisibleClick,
}: Props) => {
  const { translate } = useMultiLanguage();
  return (
    <MenuSection style={{ height: 201, overflowY: 'auto' }}>
      {accounts.map((account) => (
        <Menu.Item key={account.address}>
          <AccountSwitchMenuItem
            style={{ paddingLeft: 22, opacity: 0.5 }}
            onClick={(e) => {
              e.preventDefault();
              onAccountVisibleClick(account);
            }}
          >
            <Box style={{ display: 'flex', alignItems: 'center' }}>
              <AccountImageStyled size={30} address={account.address} />
              <MenuItemText style={{ marginLeft: 20 }}>
                <div>
                  {translate('account')} {account.addressIndex + 1}
                </div>
                <div>{shortenAddress(account.address)}</div>
              </MenuItemText>
            </Box>
            <IconButton disabled size="small">
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </AccountSwitchMenuItem>
        </Menu.Item>
      ))}
    </MenuSection>
  );
};
