import { shortenAddress, shortenDomain } from 'utils/utils';
import {
  AccountImageStyled,
  Normal,
  Wrapper,
  AccountSwitchMenuItem,
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
import { useEffect } from 'react';

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
  const accountsVisibility = accounts.map(
    (account) => account.visibility ?? true,
  );
  const accountsIndex = accounts.map((account) => account.addressIndex);
  const { switchAccount, addNewAccount, hideAccount } = useStarkNetSnap();
  const chainId = networks?.items[networks.activeNetwork]?.chainId;

  useEffect(() => {
    console.log('Updated accounts:', accounts);
  }, [accounts]);

  return (
    <Menu as="div" style={{ display: 'inline-block', position: 'relative' }}>
      <Menu.Button style={{ background: 'none', border: 'none' }}>
        <Wrapper backgroundTransparent iconRight="angle-down">
          {full
            ? starkName ?? currentAddress
            : starkName
            ? shortenDomain(starkName)
            : shortenAddress(currentAddress)}
        </Wrapper>
      </Menu.Button>

      <MenuItems style={{ right: 'auto', zIndex: '1', width: 'auto' }}>
        {/* Account List */}
        <MenuSection>
          <Menu.Item disabled>
            <Normal>Accounts</Normal>
          </Menu.Item>
        </MenuSection>
        <MenuDivider />
        <MenuSection style={{ height: 201, overflowY: 'auto' }}>
          {accounts.map((account, index) => {
            const isSelected = account.address === currentAddress; // Check if the account is selected
            return (
              accountsVisibility[index] !== false && (
                <Menu.Item key={account.addressIndex}>
                  <AccountSwitchMenuItem
                    onClick={() => switchAccount(chainId, account.address)}
                    style={{
                      backgroundColor: isSelected
                        ? theme.palette.grey.grey4
                        : 'transparent',
                      borderLeft: isSelected
                        ? `4px solid ${theme.palette.secondary.main}`
                        : 'none',
                      paddingLeft: isSelected ? 15 : 20,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <AccountImageStyled
                        size={30}
                        address={account.address}
                        connected={account.address === currentAddress}
                      />
                      <MenuItemText
                        style={{ marginLeft: isSelected ? 19 : 20 }}
                      >
                        <div>
                          <div>Account {accountsIndex[index] + 1}</div>
                          <div>
                            {full
                              ? account.address
                              : shortenAddress(account.address)}
                          </div>
                        </div>
                      </MenuItemText>
                    </div>
                    {/* Hide button */}
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering account switch
                        hideAccount(chainId, account.address);
                      }}
                      size="small"
                    >
                      <VisibilityOffIcon fontSize="small" />
                    </IconButton>
                  </AccountSwitchMenuItem>
                </Menu.Item>
              )
            );
          })}
        </MenuSection>
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
