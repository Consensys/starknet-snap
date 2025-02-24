import React, { useState } from 'react';
import Toastr from 'toastr2';

import { useMultiLanguage, useStarkNetSnap } from 'services';
import {
  useCurrentNetwork,
  useCurrentAccount,
  useAccountVisibility,
  MinAccountToHideError,
  SwitchAccountError,
} from 'hooks';
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
  const { switchAccount } = useStarkNetSnap();
  const { translate } = useMultiLanguage();
  const currentNework = useCurrentNetwork();
  const { address: currentAddress } = useCurrentAccount();
  const [visibility, setVisibility] = useState(true);
  const { visibleAccounts, hiddenAccounts, showAccount, hideAccount } =
    useAccountVisibility();
  const chainId = currentNework?.chainId;

  const preventDefaultMouseEvent = (event: React.MouseEvent) => {
    // Prevent triggering the native behaviour
    event.preventDefault();
    // Prevent triggering the parent onClick event
    event.stopPropagation();
  };

  const onAccountSwitchClick = async (account: Account) => {
    onClose();
    await switchAccount(chainId, account.address);
  };

  const onAccountHiddenClick = async (
    event: React.MouseEvent,
    account: Account,
  ) => {
    preventDefaultMouseEvent(event);
    try {
      await hideAccount(account);
    } catch (error) {
      // TODO: Add translation
      if (error instanceof MinAccountToHideError) {
        toastr.error(translate('youCannotHideLastAccount'));
      } else if (error instanceof SwitchAccountError) {
        toastr.error(translate('switchAccountError'));
      } else {
        toastr.error(translate('hideAccountFail'));
      }
    }
  };

  const onAccountUnHideClick = async (
    event: React.MouseEvent,
    account: Account,
  ) => {
    preventDefaultMouseEvent(event);
    await showAccount(account);
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
                {visibleAccounts.map((account) => (
                  <AccountItem
                    scrollToRef={
                      currentAddress === account.address ? scrollTo : null
                    }
                    selected={currentAddress === account.address}
                    visible={true}
                    account={account}
                    onAccountItemClick={() => onAccountSwitchClick(account)}
                    onAccountIconClick={(event) =>
                      onAccountHiddenClick(event, account)
                    }
                  />
                ))}
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
                    onAccountIconClick={(event) =>
                      onAccountUnHideClick(event, account)
                    }
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
