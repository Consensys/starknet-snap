import { Account } from 'types';
import {
  AccountImageStyled,
  AccountSwitchMenuItem,
  MenuSection,
  MenuItemText,
} from '../AccountSwitchModal.style';
import { Menu } from '@headlessui/react';
import { Box, IconButton } from '@mui/material';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { theme } from 'theme/default';
import { shortenAddress } from 'utils/utils';

interface Props {
  accounts: Account[];
  currentAddress: string;
  switchAccount: (chainId: string, address: string) => void;
  hideAccount: (params: {
    chainId: string;
    address: string;
    currentAddress: string;
  }) => void;
  chainId: string;
}

export const VisibleAccountsListView = ({
  accounts,
  currentAddress,
  switchAccount,
  hideAccount,
  chainId,
}: Props) => (
  <MenuSection>
    {accounts.map((account) => {
      const isSelected = account.address === currentAddress;
      return (
        <Menu.Item key={account.address}>
          <AccountSwitchMenuItem
            style={{
              backgroundColor: isSelected
                ? theme.palette.grey.grey4
                : 'transparent',
              borderLeft: isSelected
                ? `4px solid ${theme.palette.secondary.main}`
                : 'none',
              paddingLeft: isSelected ? 15 : 22,
            }}
          >
            <AccountSwitchMenuItem
              style={{ padding: '0px' }}
              onClick={
                !isSelected
                  ? () => switchAccount(chainId, account.address)
                  : undefined
              }
            >
              <Box style={{ display: 'flex', alignItems: 'center' }}>
                <AccountImageStyled
                  size={30}
                  address={account.address}
                  connected={isSelected}
                />
                <MenuItemText style={{ marginLeft: isSelected ? 19 : 20 }}>
                  <div>Account {account.addressIndex + 1}</div>
                  <div>{shortenAddress(account.address)}</div>
                </MenuItemText>
              </Box>
            </AccountSwitchMenuItem>
            <IconButton
              onClick={(e) => {
                if (accounts.length > 2) {
                  e.preventDefault();
                }
                hideAccount({
                  chainId,
                  address: account.address,
                  currentAddress,
                });
              }}
              size="small"
            >
              <VisibilityOffIcon fontSize="small" />
            </IconButton>
          </AccountSwitchMenuItem>
        </Menu.Item>
      );
    })}
  </MenuSection>
);
