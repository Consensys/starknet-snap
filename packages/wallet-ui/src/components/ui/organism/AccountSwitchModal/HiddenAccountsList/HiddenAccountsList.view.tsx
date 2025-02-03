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

interface Props {
  accounts: Account[];
  unHideAccount: (params: { chainId: string; address: string }) => void;
  setShowHiddenAccounts: (value: boolean) => void;
  chainId: string;
}

export const HiddenAccountsListView = ({
  accounts,
  unHideAccount,
  setShowHiddenAccounts,
  chainId,
}: Props) => (
  <MenuSection style={{ height: 201, overflowY: 'auto' }}>
    {accounts.map((account) => (
      <Menu.Item key={account.address}>
        <AccountSwitchMenuItem
          style={{ paddingLeft: 22, opacity: 0.5 }}
          onClick={(e) => {
            setShowHiddenAccounts(false);
            unHideAccount({ chainId, address: account.address });
            e.preventDefault();
          }}
        >
          <Box style={{ display: 'flex', alignItems: 'center' }}>
            <AccountImageStyled size={30} address={account.address} />
            <MenuItemText style={{ marginLeft: 20 }}>
              <div>Account {account.addressIndex + 1}</div>
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
