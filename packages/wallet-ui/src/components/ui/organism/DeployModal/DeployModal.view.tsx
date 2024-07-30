import { useEffect, useState } from 'react';
import { useStarkNetSnap } from 'services';
import { useAppSelector, useAppDispatch } from 'hooks/redux';
import Toastr from 'toastr2';

import { setDeployModalVisible } from 'slices/modalSlice';
import { openExplorerTab, shortenAddress } from '../../../../utils/utils';
import {
  DeployButton,
  StarknetLogo,
  Title,
  Wrapper,
  DescriptionCentered,
  Txnlink,
} from './DeployModal.style';
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
      toastr.error(`Deploy account failed`);
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
      toastr.success(`Account deployed successfully`);
      dispatch(setDeployModalVisible(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, dispatch]);

  const renderComponent = () => {
    switch (stage) {
      case Stage.INIT:
        return (
          <>
            <DescriptionCentered>
              You have a non-zero balance on a Cairo 0 non-deployed address
              <br />
              <br />
              <center>
                <AccountAddressView address={address}></AccountAddressView>
              </center>
              <br />
              A deployment of your address is necessary to proceed with the
              Snap.
              <br />
              <br />
              Click on the "Deploy" button to proceed.
              <br />
              Thank you!
            </DescriptionCentered>
            <DeployButton onClick={onDeploy}>Deploy</DeployButton>
          </>
        );
      case Stage.WAITING_FOR_TXN:
        return (
          <DescriptionCentered>
            Waiting for transaction to be complete.
          </DescriptionCentered>
        );
      case Stage.SUCCESS:
        return (
          <DescriptionCentered>
            Account deployd successfully.
          </DescriptionCentered>
        );
      default:
        return (
          <DescriptionCentered>
            Transaction Hash: <br />{' '}
            <Txnlink onClick={() => openExplorerTab(txnHash, 'tx', chainId)}>
              {shortenAddress(txnHash)}{' '}
            </Txnlink>
            <br />
            Your deploy transaction is still pending and has reached the maximum
            retry limit for status checks. Please wait for the transaction to
            complete.
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
      <Title>Deploy Account</Title>
      {renderComponent()}
    </Wrapper>
  );
};
