import { useMemo, useState } from 'react';

import { useMultiLanguage, useStarkNetSnap } from 'services';
import {
  useCurrentNetwork,
  useCurrentAccount,
  useAccountVisibility,
} from 'hooks';
import { Account } from 'types';
import { Button } from 'components/ui/atom/Button';
import { Scrollable } from 'components/ui/atom/Scrollable';
import {
  HiddenAccountBar,
  HiddenAccountBarLeftIcon,
  HiddenAccountBarRightIcon,
  NoAccountsFoundText,
  VerticalAlignBox,
  SearchInputWrapper,
  SearchInput,
  SearchIcon,
} from './AccountList.style';
import { AccountItem } from './AccountItem.view';
import { Modal } from 'components/ui/atom/Modal';

export const AccountListModalView = ({
  onClose,
  onAddAccountClick,
}: {
  onClose: () => void;
  onAddAccountClick: () => void;
}) => {
  const { switchAccount: switchSnapAccount } = useStarkNetSnap();
  const { translate } = useMultiLanguage();
  const {
    visibleAccounts,
    hiddenAccounts,
    canHideAccount,
    hideAccount,
    showAccount,
  } = useAccountVisibility();
  const currentNework = useCurrentNetwork();
  const { address: currentAddress } = useCurrentAccount();
  const [visibility, setVisibility] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); // State for search input

  const chainId = currentNework?.chainId;

  const switchAccount = async (account: Account) => {
    onClose();
    await switchSnapAccount(chainId, account.address);
  };

  // Filter visible accounts based on search term
  const filteredVisibleAccounts = useMemo(() => {
    return visibleAccounts.filter((account) =>
      account.accountName.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [visibleAccounts, searchTerm]);

  // Filter hidden accounts based on search term
  const filteredHiddenAccounts = useMemo(() => {
    return hiddenAccounts.filter((account) =>
      account.accountName.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [hiddenAccounts, searchTerm]);

  return (
    <Modal>
      <Modal.Title>{translate('selectAnAccount')}</Modal.Title>
      <Modal.Body>
        {/* Search Input */}
        <SearchInputWrapper
          style={{
            visibility:
              visibility || (!visibility && hiddenAccounts.length > 0)
                ? 'visible'
                : 'hidden',
          }}
        >
          <SearchIcon icon="search" />
          <SearchInput
            type="text"
            placeholder={translate('searchAccounts')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchInputWrapper>

        {visibility && (
          <Scrollable<HTMLDivElement>
            height={365}
            child={(scrollTo) => (
              <>
                {filteredVisibleAccounts.length === 0 ? (
                  <VerticalAlignBox>
                    <NoAccountsFoundText>
                      {translate('noAccountForSearchQuery')}
                    </NoAccountsFoundText>
                  </VerticalAlignBox>
                ) : (
                  filteredVisibleAccounts.map((account) => {
                    const selected = currentAddress === account.address;
                    return (
                      <AccountItem
                        key={account.address}
                        scrollToRef={selected ? scrollTo : null}
                        selected={selected}
                        visible={true}
                        account={account}
                        onItemClick={selected ? undefined : switchAccount}
                        onIconButtonClick={
                          canHideAccount ? hideAccount : undefined
                        }
                        showIconButton={canHideAccount}
                      />
                    );
                  })
                )}
              </>
            )}
          />
        )}
        {!visibility && (
          <Scrollable<HTMLDivElement>
            height={365}
            child={() => (
              <>
                {filteredHiddenAccounts.length === 0 ? (
                  <VerticalAlignBox>
                    <NoAccountsFoundText>
                      {hiddenAccounts.length === 0
                        ? translate('noHiddenAccount')
                        : translate('noAccountForSearchQuery')}
                    </NoAccountsFoundText>
                  </VerticalAlignBox>
                ) : (
                  filteredHiddenAccounts.map((account) => (
                    <AccountItem
                      key={account.address}
                      visible={false}
                      account={account}
                      onIconButtonClick={showAccount}
                    />
                  ))
                )}
              </>
            )}
          />
        )}
        <HiddenAccountBar onClick={() => setVisibility(!visibility)}>
          <div>
            <HiddenAccountBarLeftIcon icon={'eye-slash'} />
            {translate('hiddenAccounts')}
          </div>
          <div>
            {hiddenAccounts.length}
            <HiddenAccountBarRightIcon
              icon={visibility ? 'angle-up' : 'angle-down'}
            />
          </div>
        </HiddenAccountBar>
      </Modal.Body>
      <Button
        onClick={() => onAddAccountClick()}
        iconLeft="plus"
        backgroundTransparent
        borderVisible
      >
        {translate('addAccount')}
      </Button>
    </Modal>
  );
};
