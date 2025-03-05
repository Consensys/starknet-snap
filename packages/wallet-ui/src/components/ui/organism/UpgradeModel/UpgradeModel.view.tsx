import { useEffect, useState } from 'react';
import { useMultiLanguage, useStarkNetSnap } from 'services';
import { useAppSelector, useAppDispatch } from 'hooks/redux';
import Toastr from 'toastr2';

import { setUpgradeModalVisible } from 'slices/modalSlice';
import { Modal } from 'components/ui/atom/Modal';
import { openExplorerTab, shortenAddress } from 'utils/utils';
import { Txnlink } from './UpgradeModel.style';

interface Props {
  address: string;
}

enum Stage {
  INIT = 0,
  WAITING_FOR_TXN = 1,
  SUCCESS = 2,
  FAIL = 3,
}

export const UpgradeModelView = ({ address }: Props) => {
  const dispatch = useAppDispatch();
  const { upgradeAccount, waitForAccountUpdate } = useStarkNetSnap();
  const { translate } = useMultiLanguage();
  const [txnHash, setTxnHash] = useState('');
  const [stage, setStage] = useState(Stage.INIT);
  const networks = useAppSelector((state) => state.networks);
  const chainId = networks?.items[networks.activeNetwork]?.chainId;
  const toastr = new Toastr();

  const onUpgrade = async () => {
    try {
      const resp = await upgradeAccount(address, '0', chainId);

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
      toastr.error(translate('upgradeAccountFailed'));
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
      toastr.success(translate('accountUpgradedSuccessfully'));
      dispatch(setUpgradeModalVisible(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, dispatch]);

  const renderComponent = () => {
    switch (stage) {
      case Stage.INIT:
        return (
          <>
            <Modal.Body>
              {translate('newVersionOfSmartContractNecessaryPart1')} <br />
              <br />
              {translate('newVersionOfSmartContractNecessaryPart2')} <br />
              <br />
              {translate('newVersionOfSmartContractNecessaryPart3')} <br />
              {translate('newVersionOfSmartContractNecessaryPart4')}
            </Modal.Body>
            <Modal.Button onClick={onUpgrade}>
              {translate('upgrade')}
            </Modal.Button>
          </>
        );
      case Stage.WAITING_FOR_TXN:
        return <Modal.Body>{translate('waitingForTransaction')}</Modal.Body>;
      case Stage.SUCCESS:
        return (
          <Modal.Body>{translate('accountUpgradedSuccessfully')}</Modal.Body>
        );
      default:
        return (
          <Modal.Body>
            {translate('transactionHash')} <br />{' '}
            <Txnlink onClick={() => openExplorerTab(txnHash, 'tx', chainId)}>
              {shortenAddress(txnHash)}{' '}
            </Txnlink>
            <br />
            {translate('upgradeTransactionPendingPart1')} <br />
            <br />
            {translate('upgradeTransactionPendingPart2')} <br />
            <br />
            {translate('upgradeTransactionPendingPart3')}
          </Modal.Body>
        );
    }
  };

  return (
    <Modal>
      <Modal.Logo />
      <Modal.Title>{translate('upgradeAccount')}</Modal.Title>

      {renderComponent()}
    </Modal>
  );
};
