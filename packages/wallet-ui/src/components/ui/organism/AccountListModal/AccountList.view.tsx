import {
  Wrapper,
  ButtonDiv,
  Title,
  ButtonStyled,
  ScrollableWrapper,
  HiddenAccountBar,
} from './AccountList.style';
import { useAppSelector } from 'hooks/redux';
import { useMultiLanguage, useStarkNetSnap } from 'services';
import React, { useMemo, useState } from 'react';
import { Account } from 'types';
import { theme } from 'theme/default';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Toastr from 'toastr2';
import { AccountItem } from './AccountItem.view';

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
  const networks = useAppSelector((state) => state.networks);
  const currentAccount = useAppSelector((state) => state.wallet.currentAccount);
  const accounts = useAppSelector((state) => state.wallet.accounts);

  const [showHiddenAccounts, setShowHiddenAccounts] = useState(false);

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

  const currentAddress = currentAccount.address;
  const chainId = networks?.items[networks.activeNetwork]?.chainId;

  const onAccountSwitchClick = async (
    event: React.MouseEvent,
    account: Account,
  ) => {
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
    if (accounts.filter((account) => account.visibility).length < 2) {
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
    <div>
      <Wrapper>
        <Title>{translate('selectAnAccount')}</Title>
        <ScrollableWrapper>
          {!showHiddenAccounts &&
            visibleAccounts.map((account) => (
              <AccountItem
                selected={currentAddress === account.address}
                visible={true}
                account={account}
                onAccountItemClick={(event) =>
                  onAccountSwitchClick(event, account)
                }
                onAccountIconClick={(event) =>
                  onAccountHiddenClick(event, account)
                }
              />
            ))}
          {showHiddenAccounts &&
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
        <HiddenAccountBar
          onClick={() => setShowHiddenAccounts(!showHiddenAccounts)}
        >
          <div>
            <FontAwesomeIcon
              icon={'eye-slash'}
              color={theme.palette.primary.main}
              style={{ marginRight: '8px' }}
            />
            {translate('hiddenAccounts')}
          </div>
          <div>
            {hiddenAccounts.length}
            <FontAwesomeIcon
              style={{ marginLeft: '8px' }}
              icon={showHiddenAccounts ? 'angle-up' : 'angle-down'}
              color={theme.palette.primary.main}
            />
          </div>
        </HiddenAccountBar>
      </Wrapper>
      <ButtonDiv>
        <ButtonStyled onClick={onAddAccountClick}>
          <FontAwesomeIcon
            icon="plus"
            color={theme.palette.primary.main}
            style={{ marginRight: '8px' }}
          />
          {translate('addAccount')}
        </ButtonStyled>
      </ButtonDiv>
    </div>
  );
};
