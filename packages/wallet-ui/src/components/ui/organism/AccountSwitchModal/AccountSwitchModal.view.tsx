import { useState } from 'react';
import { shortenAddress, shortenDomain } from 'utils/utils';
import { Menu } from '@headlessui/react';
import { useAppSelector } from 'hooks/redux';
import { useStarkNetSnap } from 'services';
import {
  Wrapper,
  AccountSwitchMenuItem,
  MenuSection,
} from './AccountSwitchModal.style';
import { MenuItems, MenuDivider } from 'components/ui/organism/Menu/Menu.style';
import { theme } from 'theme/default';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AccountsHeader } from './AccountsHeader';
import { VisibleAccountsList } from './VisibleAccountsList';
import { HiddenAccountsList } from './HiddenAccountsList';

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

  const visibleAccounts = accounts.filter(
    (acc) => acc.visibility === undefined || acc.visibility,
  );
  const hiddenAccounts = accounts.filter((acc) => acc.visibility === false);

  const displayName = full
    ? starkName ?? currentAddress
    : starkName
    ? shortenDomain(starkName)
    : shortenAddress(currentAddress);

  return (
    <Menu as="div" style={{ display: 'inline-block', position: 'relative' }}>
      <Menu.Button style={{ background: 'none', border: 'none' }}>
        <Wrapper backgroundTransparent iconRight="angle-down">
          {displayName}
        </Wrapper>
      </Menu.Button>

      <MenuItems style={{ right: 'auto', zIndex: '1', width: 'auto' }}>
        {/* Accounts Header */}
        <AccountsHeader
          showHiddenAccounts={showHiddenAccounts}
          setShowHiddenAccounts={setShowHiddenAccounts}
          hiddenAccounts={hiddenAccounts}
        />
        <MenuDivider />

        {/* Account Lists */}
        {showHiddenAccounts ? (
          <HiddenAccountsList
            accounts={hiddenAccounts}
            unHideAccount={unHideAccount}
            setShowHiddenAccounts={setShowHiddenAccounts}
            chainId={chainId}
          />
        ) : (
          <VisibleAccountsList
            accounts={visibleAccounts}
            currentAddress={currentAddress}
            switchAccount={switchAccount}
            hideAccount={hideAccount}
            chainId={chainId}
          />
        )}

        <MenuDivider />
        <MenuSection>
          <Menu.Item>
            <AccountSwitchMenuItem
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
            </AccountSwitchMenuItem>
          </Menu.Item>
        </MenuSection>
      </MenuItems>
    </Menu>
  );
};
