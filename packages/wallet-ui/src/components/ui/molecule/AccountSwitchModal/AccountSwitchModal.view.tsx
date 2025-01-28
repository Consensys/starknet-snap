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

interface Props {
  currentAddress: string;
  accounts: string[];
  accountsIndex: number[];
  full?: boolean;
  starkName?: string;
}

export const AccountSwitchModalView = ({
  currentAddress,
  accounts,
  accountsIndex,
  full,
  starkName,
}: Props) => {
  const networks = useAppSelector((state) => state.networks);
  const { switchAccount, addNewAccount } = useStarkNetSnap();
  const chainId = networks?.items[networks.activeNetwork]?.chainId;

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
            const isSelected = account === currentAddress; // Check if the account is selected
            return (
              <Menu.Item key={account}>
                <AccountSwitchMenuItem
                  onClick={() => switchAccount(chainId, account)}
                  style={{
                    backgroundColor: isSelected
                      ? theme.palette.grey.grey4
                      : 'transparent', // Change background color if selected
                    borderLeft: isSelected
                      ? `4px solid ${theme.palette.secondary.main}`
                      : 'none', // Add left border if selected
                    paddingLeft: isSelected ? 15 : 20, // Add some padding if selected to make space for the border
                  }}
                >
                  <AccountImageStyled
                    size={30}
                    address={account}
                    connected={account === currentAddress}
                  />
                  <MenuItemText style={{ marginLeft: isSelected ? 19 : 20 }}>
                    <div>
                      <div>Account {accountsIndex[index] + 1}</div>
                      <div>{full ? account : shortenAddress(account)}</div>
                    </div>
                  </MenuItemText>
                </AccountSwitchMenuItem>
              </Menu.Item>
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
