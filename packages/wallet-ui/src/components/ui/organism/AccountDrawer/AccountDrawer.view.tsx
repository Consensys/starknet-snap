import { useState } from 'react';
import { AccountListModal } from '../AccountListModal';
import { PopIn } from 'components/ui/molecule/PopIn';
import { Drawer } from './AccountDrawer.style';
import { AddAccountModal } from '../AddAccountModal';
import { useFormattedDisplayName } from 'hooks/useAccountName';

export interface Props {
  starkName?: string;
}

export const AccountDrawerView = ({ starkName }: Props) => {
  const [accountListModalOpen, setAccountListModalOpen] = useState(false);
  const [accountAddModalOpen, setAccountAddModalOpen] = useState(false);
  const displayName = useFormattedDisplayName(starkName);

  return (
    <>
      <PopIn isOpen={accountListModalOpen} setIsOpen={setAccountListModalOpen}>
        <AccountListModal
          onClose={() => setAccountListModalOpen(false)}
          onAddAccountClick={() => {
            setAccountListModalOpen(false);
            setAccountAddModalOpen(true);
          }}
        />
      </PopIn>
      <PopIn isOpen={accountAddModalOpen} setIsOpen={setAccountAddModalOpen}>
        <AddAccountModal onClose={() => setAccountAddModalOpen(false)} />
      </PopIn>
      <Drawer
        backgroundTransparent
        iconRight="angle-down"
        onClick={() => setAccountListModalOpen(true)}
      >
        {displayName}
      </Drawer>
    </>
  );
};
