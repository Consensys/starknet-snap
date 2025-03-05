import { useEffect, useState } from 'react';
import { useMultiLanguage, useStarkNetSnap } from 'services';
import { useAppSelector, useAppDispatch } from 'hooks/redux';
import Toastr from 'toastr2';

import { Modal } from 'components/ui/atom/Modal';
import { setDeployModalVisible } from 'slices/modalSlice';
import { openExplorerTab, shortenAddress } from 'utils/utils';
import { Txnlink } from './DeployModal.style';
import { AccountAddressView } from 'components/ui/molecule/AccountAddress/AccountAddress.view';

interface Props {
  address: string;
}

enum Stage {
  INIT = 0,
  WAITING_FOR_TXN = 1,
  SUCCESS = 2,
  FAIL = 3,
}

export const DeployModalView = ({ address }: Props) => {
  const dispatch = useAppDispatch();
  const { deployAccount, waitForAccountCreation } = useStarkNetSnap();
  const { translate } = useMultiLanguage();

  const [txnHash, setTxnHash] = useState('');
  const [stage, setStage] = useState(Stage.INIT);
  const networks = useAppSelector((state) => state.networks);
  const chainId = networks?.items[networks.activeNetwork]?.chainId;
  const toastr = new Toastr();

  const onDeploy = async () => {
    try {
      const resp = await deployAccount(address, '0', chainId);

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
      toastr.error(translate('deployAccountFailed'));
    }
  };

  useEffect(() => {
    if (txnHash) {
      setStage(Stage.WAITING_FOR_TXN);
      waitForAccountCreation(txnHash, address, chainId)
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
      toastr.success(translate('accountDeployedSuccessfully'));
      dispatch(setDeployModalVisible(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, dispatch]);

  const renderComponent = () => {
    switch (stage) {
      case Stage.INIT:
        return (
          <>
            <Modal.Body>
              {translate('nonZeroBalanceOnCairo0')}
              <br />
              <br />
              <center>
                <AccountAddressView address={address}></AccountAddressView>
              </center>
              <br />
              {translate('deploymentNecessaryToProceedPart1')} <br />
              <br />
              {translate('deploymentNecessaryToProceedPart2')} <br />
              <br />
              {translate('deploymentNecessaryToProceedPart3')}
            </Modal.Body>
            <Modal.Button onClick={onDeploy}>Deploy</Modal.Button>
          </>
        );
      case Stage.WAITING_FOR_TXN:
        return <Modal.Body>{translate('waitingForTransaction')}</Modal.Body>;
      case Stage.SUCCESS:
        return (
          <Modal.Body>{translate('accountDeployedSuccessfully')}</Modal.Body>
        );
      default:
        return (
          <Modal.Body>
            {translate('transactionHash')} <br />{' '}
            <Txnlink onClick={() => openExplorerTab(txnHash, 'tx', chainId)}>
              {shortenAddress(txnHash)}{' '}
            </Txnlink>
            <br />
            {translate('deployTransactionPendingPart1')} <br />
            <br />
            {translate('deployTransactionPendingPart2')} <br />
            <br />
            {translate('deployTransactionPendingPart3')}
          </Modal.Body>
        );
    }
  };

  return (
    <Modal>
      <Modal.Title>{translate('deployAccount')}</Modal.Title>
      <Modal.Logo />
      {renderComponent()}
    </Modal>
  );
};
