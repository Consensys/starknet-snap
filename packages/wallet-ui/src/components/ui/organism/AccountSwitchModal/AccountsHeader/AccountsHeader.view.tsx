import { Account } from 'types';
import {
  AccountSwitchMenuItem,
  Container,
  MenuSection,
  Normal,
} from '../AccountSwitchModal.style';
import { Menu } from '@headlessui/react';
import { IconButton } from '@mui/material';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useMultiLanguage } from 'services';

interface Props {
  showHiddenAccounts: boolean;
  setShowHiddenAccounts: (value: boolean) => void;
  hiddenAccounts: Account[];
}

export const AccountsHeaderView = ({
  showHiddenAccounts,
  setShowHiddenAccounts,
  hiddenAccounts,
}: Props) => {
  const { translate } = useMultiLanguage();
  return (
    <MenuSection>
      <Menu.Item disabled>
        <AccountSwitchMenuItem style={{ paddingLeft: 20 }}>
          <Container>
            <Normal>{translate('accounts')}</Normal>
          </Container>
          {hiddenAccounts.length > 0 && (
            <IconButton
              onClick={() => setShowHiddenAccounts(!showHiddenAccounts)}
              size="small"
            >
              {showHiddenAccounts ? (
                <VisibilityOffIcon fontSize="small" />
              ) : (
                <VisibilityIcon fontSize="small" />
              )}
            </IconButton>
          )}
        </AccountSwitchMenuItem>
      </Menu.Item>
    </MenuSection>
  );
};
