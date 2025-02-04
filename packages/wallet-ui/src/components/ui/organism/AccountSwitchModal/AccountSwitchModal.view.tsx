import { useState } from 'react';
import { shortenAddress, shortenDomain } from 'utils/utils';
import { Menu } from '@headlessui/react';
import { useAppSelector } from 'hooks/redux';
import { useStarkNetSnap } from 'services';
import {
  AccountSwitchMenuItem,
  MenuSection,
  Wrapper,
} from './AccountSwitchModal.style';
import { MenuItems, MenuDivider } from 'components/ui/organism/Menu/Menu.style';
import { theme } from 'theme/default';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AccountsHeader } from './AccountsHeader';
import { VisibleAccountsList } from './VisibleAccountsList';
import { HiddenAccountsList } from './HiddenAccountsList';
import { DUMMY_ADDRESS } from 'utils/constants';
import { Account } from 'types';

interface Props {
  full?: boolean;
  starkName?: string;
}

export const AccountSwitchModalView = ({ full, starkName }: Props) => {
  const networks = useAppSelector((state) => state.networks);
  const { currentAccount, accounts } = useAppSelector((state) => state.wallet);
  const { switchAccount, addNewAccount, hideAccount, unHideAccount } =
    useStarkNetSnap();
  const chainId = networks?.items[networks.activeNetwork]?.chainId;

  const [showHiddenAccounts, setShowHiddenAccounts] = useState(false);

  const onAccountVisibleClick = (account: Account) => {
    setShowHiddenAccounts(false);
    unHideAccount({ chainId, address: account.address });
  };

  const onAccountHiddenClick = (account: Account) => {
    hideAccount({
      chainId,
      address: account.address,
      currentAddress,
    });
  };

  const onAccountSwitchClick = (account: Account) => {
    switchAccount(chainId, account.address);
  };

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
  const currentAddress = currentAccount?.address ?? DUMMY_ADDRESS;
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
            onAccountVisibleClick={onAccountVisibleClick}
          />
        ) : (
          <VisibleAccountsList
            accounts={visibleAccounts}
            currentAddress={currentAddress}
            onAccountHiddenClick={onAccountHiddenClick}
            onAccountSwitchClick={onAccountSwitchClick}
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
