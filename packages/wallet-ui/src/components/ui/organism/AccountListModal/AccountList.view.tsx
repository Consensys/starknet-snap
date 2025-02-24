import React, { useMemo, useState } from 'react';
import Toastr from 'toastr2';

import { useMultiLanguage, useStarkNetSnap } from 'services';
import { useCurrentNetwork, useCurrentAccount, useAppSelector } from 'hooks';
import { Account } from 'types';
import { Button } from 'components/ui/atom/Button';
import { Scrollable } from 'components/ui/atom/Scrollable';
import {
  Wrapper,
  ButtonWrapper,
  Title,
  HiddenAccountBar,
  HiddenAccountBarLeftIcon,
  HiddenAccountBarRightIcon,
} from './AccountList.style';
import { AccountItem } from './AccountItem.view';

export const AccountListModalView = ({
  onClose,
  onAddAccountClick,
}: {
  onClose: () => void;
  onAddAccountClick: () => void;
}) => {
  const toastr = new Toastr();
  const {
    switchAccount: switchSnapAccount,
    hideAccount: hideSnapAccount,
    unHideAccount: showSnapAccount,
  } = useStarkNetSnap();
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

  const switchAccount = async (account: Account) => {
    onClose();
    await switchSnapAccount(chainId, account.address);
  };

  const hideAccount = async (account: Account) => {
    if (visibleAccounts.length < 2) {
      toastr.error(translate('youCannotHideLastAccount'));
    } else {
      await hideSnapAccount({
        chainId,
        address: account.address,
        currentAddress,
      });
    }
  };

  const showAccount = async (account: Account) => {
    await showSnapAccount({
      chainId,
      address: account.address,
    });
  };

  return (
    <>
      <Wrapper>
        <Title>{translate('selectAnAccount')}</Title>
        {visibility && (
          <Scrollable<HTMLDivElement>
            height={365}
            child={(scrollTo) => (
              <>
                {visibleAccounts.map((account) => {
                  const selected = currentAddress === account.address;
                  return (
                    <AccountItem
                      scrollToRef={selected ? scrollTo : null}
                      selected={selected}
                      visible={true}
                      account={account}
                      onItemClick={selected ? undefined : switchAccount}
                      onIconButtonClick={hideAccount}
                    />
                  );
                })}
              </>
            )}
          />
        )}
        {!visibility && (
          <Scrollable<HTMLDivElement>
            height={365}
            child={() => (
              <>
                {hiddenAccounts.map((account) => (
                  <AccountItem
                    visible={false}
                    account={account}
                    onIconButtonClick={showAccount}
                  />
                ))}
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
