import { useState } from 'react';

import { PopIn } from 'components/ui/molecule/PopIn';
import { formatAddress } from 'utils/utils';
import { useCurrentAccount } from 'hooks';
import { AccountListModal } from '../AccountListModal';
import { AddAccountModal } from '../AddAccountModal';
import { Drawer } from './AccountDrawer.style';

export interface Props {
  starkName?: string;
}

export const AccountDrawerView = ({ starkName }: Props) => {
  const [accountListModalOpen, setAccountListModalOpen] = useState(false);
  const [accountAddModalOpen, setAccountAddModalOpen] = useState(false);
  const { address } = useCurrentAccount();

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
        {formatAddress(address, starkName)}
      </Drawer>
    </>
  );
};
