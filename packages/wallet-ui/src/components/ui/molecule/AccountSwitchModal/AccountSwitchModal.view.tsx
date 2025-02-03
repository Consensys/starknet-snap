import { useState } from 'react';
import { shortenAddress, shortenDomain } from 'utils/utils';
import {
  AccountImageStyled,
  Normal,
  Wrapper,
  AccountSwitchMenuItem,
  Container,
} from './AccountSwitchModal.style';
import { Menu } from '@headlessui/react';
import {
  MenuItems,
  MenuSection,
  NetworkMenuItem,
  MenuItemText,
  MenuDivider,
} from 'components/ui/organism/Menu/Menu.style';
import { theme } from 'theme/default';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppSelector } from 'hooks/redux';
import { useStarkNetSnap } from 'services';
import IconButton from '@mui/material/IconButton';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box } from '@mui/material';
import { Account } from 'types';

interface Props {
  currentAddress: string;
  full?: boolean;
  starkName?: string;
}

export const AccountSwitchModalView = ({
  currentAddress,
  full,
  starkName,
}: Props) => {
  const networks = useAppSelector((state) => state.networks);
  const accounts = useAppSelector((state) => state.wallet.accounts);
  const { switchAccount, addNewAccount, hideAccount, unHideAccount } =
    useStarkNetSnap();
  const chainId = networks?.items[networks.activeNetwork]?.chainId;

  const [showHiddenAccounts, setShowHiddenAccounts] = useState(false);

  const visibleAccounts: Account[] = [];
  const hiddenAccounts: Account[] = [];
  for (const account of accounts) {
    // account.visibility = `undefined` refer to the case when previous account state doesnt include this field
    // hence we consider it is `visible`
    if (account.visibility === undefined || account.visibility === true) {
      visibleAccounts.push(account);
    } else {
      hiddenAccounts.push(account);
    }
  }

  let displayName;

  if (full) {
    displayName = starkName ?? currentAddress;
  } else if (starkName) {
    displayName = shortenDomain(starkName);
  } else {
    displayName = shortenAddress(currentAddress);
  }

  return (
    <Menu as="div" style={{ display: 'inline-block', position: 'relative' }}>
      <Menu.Button style={{ background: 'none', border: 'none' }}>
        <Wrapper backgroundTransparent iconRight="angle-down">
          {displayName}
        </Wrapper>
      </Menu.Button>

      <MenuItems style={{ right: 'auto', zIndex: '1', width: 'auto' }}>
        {/* Accounts Header with Show/Hide Button */}
        <MenuSection>
          <Menu.Item disabled>
            <AccountSwitchMenuItem
              style={{
                paddingLeft: 20,
              }}
            >
              <Container>
                <Normal>Accounts</Normal>
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
        <MenuDivider />

        {/* Toggle Between Visible and Hidden Accounts */}
        {showHiddenAccounts ? (
          /* Hidden Accounts */
          <MenuSection style={{ height: 201, overflowY: 'auto' }}>
            {hiddenAccounts.map((account) => (
              <Menu.Item key={account.address}>
                <AccountSwitchMenuItem
                  style={{
                    paddingLeft: 22,
                    opacity: 0.5,
                  }}
                  onClick={(e) => {
                    setShowHiddenAccounts(false);
                    unHideAccount({ chainId, address: account.address });
                    e.preventDefault();
                  }}
                >
                  <Container>
                    <AccountImageStyled size={30} address={account.address} />
                    <MenuItemText style={{ marginLeft: 20 }}>
                      <div>Account {account.addressIndex + 1}</div>
                      <div>
                        {full
                          ? account.address
                          : shortenAddress(account.address)}
                      </div>
                    </MenuItemText>
                  </Container>
                  <IconButton disabled size="small">
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </AccountSwitchMenuItem>
              </Menu.Item>
            ))}
          </MenuSection>
        ) : (
          /* Normal Accounts */
          <MenuSection style={{ height: 201, overflowY: 'auto' }}>
            {visibleAccounts.map((account) => {
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
                      style={{
                        padding: '0px',
                      }}
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
                          connected={account.address === currentAddress}
                        />
                        <MenuItemText
                          style={{ marginLeft: isSelected ? 19 : 20 }}
                        >
                          <div>Account {account.addressIndex + 1}</div>
                          <div>
                            {full
                              ? account.address
                              : shortenAddress(account.address)}
                          </div>
                        </MenuItemText>
                      </Box>
                    </AccountSwitchMenuItem>
                    <IconButton
                      onClick={(e) => {
                        if (visibleAccounts.length > 2) {
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
        )}

        <MenuDivider />
        <MenuSection>
          <Menu.Item>
            <NetworkMenuItem
              onClick={async () => await addNewAccount(chainId)}
              style={{
                justifyContent: 'center',
                padding: '8px 0',
                textAlign: 'center',
              }}
            >
              <FontAwesomeIcon
                icon="plus"
                color={theme.palette.primary.main}
                style={{ marginRight: '8px' }}
              />
            </NetworkMenuItem>
          </Menu.Item>
        </MenuSection>
      </MenuItems>
    </Menu>
  );
};
