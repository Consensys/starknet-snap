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
import { useMultiLanguage } from 'services';

interface Props {
  accounts: Account[];
  currentAddress: string;
  onAccountSwitchClick: (account: Account) => void;
  onAccountHiddenClick: (account: Account) => void;
}

export const VisibleAccountsListView = ({
  accounts,
  currentAddress,
  onAccountSwitchClick,
  onAccountHiddenClick,
}: Props) => {
  const { translate } = useMultiLanguage();
  return (
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
                  !isSelected ? () => onAccountSwitchClick(account) : undefined
                }
              >
                <Box style={{ display: 'flex', alignItems: 'center' }}>
                  <AccountImageStyled
                    size={30}
                    address={account.address}
                    connected={isSelected}
                  />
                  <MenuItemText style={{ marginLeft: isSelected ? 19 : 20 }}>
                    <div>
                      {translate('account')} {account.addressIndex + 1}
                    </div>
                    <div>{shortenAddress(account.address)}</div>
                  </MenuItemText>
                </Box>
              </AccountSwitchMenuItem>
              <IconButton
                onClick={(e) => {
                  // Hiding accounts does not close the switch dropdown if there are still hidden accounts left.
                  // This allows to hide several accounts more effectively.
                  if (accounts.length > 2) {
                    e.preventDefault();
                  }
                  onAccountHiddenClick(account);
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
};
