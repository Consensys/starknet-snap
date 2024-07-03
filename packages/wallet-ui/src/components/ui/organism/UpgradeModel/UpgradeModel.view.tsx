import { useEffect, useState } from 'react';
import { useStarkNetSnap } from 'services';
import { useAppSelector, useAppDispatch } from 'hooks/redux';
import Toastr from 'toastr2';

import { setUpgradeModalVisible } from 'slices/modalSlice';
import { openExplorerTab, shortenAddress } from '../../../../utils/utils';
import { UpgradeButton, StarknetLogo, Title, Wrapper, DescriptionCentered, Txnlink } from './UpgradeModel.style';

interface Props {
  address: string;
  deploy: boolean; // whether to deploy before upgrade
}

enum Stage {
  INIT = 0,
  WAITING_FOR_TXN = 1,
  SUCCESS = 2,
  FAIL = 3,
}

export const UpgradeModelView = ({ address, deploy }: Props) => {
  const dispatch = useAppDispatch();
  const { upgradeAccount, waitForAccountUpdate } = useStarkNetSnap();
  const [txnHash, setTxnHash] = useState('');
  const [stage, setStage] = useState(Stage.INIT);
  const networks = useAppSelector((state) => state.networks);
  const chainId = networks?.items[networks.activeNetwork]?.chainId;
  const toastr = new Toastr();

  const onUpgrade = async () => {
    try {
      const resp = await upgradeAccount(address, '0', chainId, deploy);

      if (resp === false) {
        return;
      }

      if (resp.transaction_hash) {
        setTxnHash(resp.transaction_hash);
      } else {
        throw new Error('no transaction hash');
      }
    } catch (err) {
      //eslint-disable-next-line no-console
      console.error(err);
      toastr.error(`Upgrade account failed`);
    }
  };

  useEffect(() => {
    if (txnHash) {
      setStage(Stage.WAITING_FOR_TXN);
      waitForAccountUpdate(txnHash, address, chainId)
        .then((resp) => {
          setStage(resp === true ? Stage.SUCCESS : Stage.FAIL);
        })
        .catch(() => {
          setStage(Stage.FAIL);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txnHash, address, chainId]);

  useEffect(() => {
    if (stage === Stage.SUCCESS) {
      toastr.success(`Account upgraded successfully`);
      dispatch(setUpgradeModalVisible(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, dispatch]);

  const upgradeTxt = deploy ? 'Deploy & Upgrade' : 'Upgrade';

  const renderComponent = () => {
    switch (stage) {
      case Stage.INIT:
        return (
          <>
            <DescriptionCentered>
              A new version of the smart contract <br />
              is necessary to proceed with the Snap.
              <br />
              <br />
              New enhancements will come with <br />
              this version.
              <br />
              <br />
              Click on the "{upgradeTxt}" button to install it.
              <br />
              Thank you!
            </DescriptionCentered>
            <UpgradeButton onClick={onUpgrade}>{upgradeTxt}</UpgradeButton>
          </>
        );
      case Stage.WAITING_FOR_TXN:
        return <DescriptionCentered>Waiting for transaction to be complete.</DescriptionCentered>;
      case Stage.SUCCESS:
        return <DescriptionCentered>Account upgraded successfully.</DescriptionCentered>;
      default:
        return (
          <DescriptionCentered>
            Transaction Hash: <br />{' '}
            <Txnlink onClick={() => openExplorerTab(txnHash, 'tx', chainId)}>{shortenAddress(txnHash)} </Txnlink>
            <br />
            Unfortunately, you reached the maximum number of upgrade tentatives allowed.
            <br />
            <br />
            Please try again in a couple of hours.
            <br />
            <br />
            Thank you for your comprehension.
          </DescriptionCentered>
        );
    }
  };

  return (
    <Wrapper>
      <StarknetLogo />
      <Title>Upgrade Account</Title>
      {renderComponent()}
    </Wrapper>
  );
};
