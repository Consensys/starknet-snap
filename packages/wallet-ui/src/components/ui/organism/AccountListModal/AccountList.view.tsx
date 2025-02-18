import {
  Wrapper,
  ButtonWrapper,
  Title,
  ScrollableWrapper,
  HiddenAccountBar,
  HiddenAccountBarLeftIcon,
  HiddenAccountBarRightIcon,
} from './AccountList.style';
import { useAppSelector } from 'hooks/redux';
import { useMultiLanguage, useStarkNetSnap } from 'services';
import React, { useMemo, useState } from 'react';
import { Account } from 'types';
import Toastr from 'toastr2';
import { AccountItem } from './AccountItem.view';
import { Button } from 'components/ui/atom/Button';
import { useCurrentNetwork } from 'hooks/useCurrentNetwork';
import { useCurrentAccount } from 'hooks/useCurrentAccount';

export const AccountListModalView = ({
  onClose,
  onAddAccountClick,
}: {
  onClose: () => void;
  onAddAccountClick: () => void;
}) => {
  const toastr = new Toastr();
  const { switchAccount, hideAccount, unHideAccount } = useStarkNetSnap();
  const { translate } = useMultiLanguage();
  const currentNework = useCurrentNetwork();
  const { address: currentAddress } = useCurrentAccount();
  const accounts = useAppSelector((state) => state.wallet.accounts);
  const [visibility, setVisibility] = useState(true);
  // Use useMemo to avoid re-rendering the component when the state changes
  const [visibleAccounts, hiddenAccounts] = useMemo(() => {
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
    return [visibleAccounts, hiddenAccounts];
  }, [accounts]);
  const chainId = currentNework?.chainId;

  const onAccountSwitchClick = async (account: Account) => {
    await switchAccount(chainId, account.address);
    onClose();
  };

  const onAccountHiddenClick = async (
    event: React.MouseEvent,
    account: Account,
  ) => {
    // Prevent triggering the native behaviour
    event.preventDefault();
    // Prevent triggering the parent onClick event
    event.stopPropagation();
    if (visibleAccounts.length < 2) {
      toastr.error(translate('youCannotHideLastAccount'));
    } else {
      await hideAccount({
        chainId,
        address: account.address,
        currentAddress,
      });
    }
  };

  const onAccountUnHideClick = async (
    event: React.MouseEvent,
    account: Account,
  ) => {
    // Prevent triggering the native behaviour
    event.preventDefault();
    // Prevent triggering the parent onClick event
    event.stopPropagation();
    await unHideAccount({
      chainId,
      address: account.address,
    });
  };

  return (
    <>
      <Wrapper>
        <Title>{translate('selectAnAccount')}</Title>
        <ScrollableWrapper>
          {visibility &&
            visibleAccounts.map((account) => (
              <AccountItem
                selected={currentAddress === account.address}
                visible={true}
                account={account}
                onAccountItemClick={() => onAccountSwitchClick(account)}
                onAccountIconClick={(event) =>
                  onAccountHiddenClick(event, account)
                }
              />
            ))}
          {!visibility &&
            hiddenAccounts.map((account) => (
              <AccountItem
                selected={false}
                visible={false}
                account={account}
                onAccountIconClick={(event) =>
                  onAccountUnHideClick(event, account)
                }
              />
            ))}
        </ScrollableWrapper>
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
      </Wrapper>
      <ButtonWrapper>
        <Button
          onClick={() => onAddAccountClick()}
          iconLeft="plus"
          backgroundTransparent
          borderVisible
        >
          {translate('addAccount')}
        </Button>
      </ButtonWrapper>
    </>
  );
};
