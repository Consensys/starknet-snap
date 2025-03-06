import { useState } from 'react';

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
  NoHiddenAccountText,
  VerticalAlignBox,
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

  const chainId = currentNework?.chainId;

  const switchAccount = async (account: Account) => {
    onClose();
    await switchSnapAccount(chainId, account.address);
  };

  return (
    <Modal>
      <Modal.Title>{translate('selectAnAccount')}</Modal.Title>
      <Modal.Body>
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
                      onIconButtonClick={
                        canHideAccount ? hideAccount : undefined
                      }
                      showIconButton={canHideAccount}
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
                {hiddenAccounts.length === 0 ? (
                  <VerticalAlignBox>
                    <NoHiddenAccountText>
                      {translate('noHiddenAccount')}
                    </NoHiddenAccountText>
                  </VerticalAlignBox>
                ) : (
                  hiddenAccounts.map((account) => (
                    <AccountItem
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
