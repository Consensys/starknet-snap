import { useEffect, useState } from 'react';
import { useStarkNetSnap } from 'services';
import { useAppSelector, useAppDispatch } from 'hooks/redux';
import Toastr from 'toastr2';

import { setUpgradeModalVisible } from 'slices/modalSlice';
import { openExplorerTab, shortenAddress } from '../../../../utils/utils';
import {
  UpgradeButton,
  StarknetLogo,
  Title,
  Wrapper,
  DescriptionCentered,
  Txnlink,
} from './UpgradeModel.style';

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
  const { upgradeAccount, waitForAccountUpdate, getTranslator } =
    useStarkNetSnap();
  const [txnHash, setTxnHash] = useState('');
  const [stage, setStage] = useState(Stage.INIT);
  const networks = useAppSelector((state) => state.networks);
  const chainId = networks?.items[networks.activeNetwork]?.chainId;
  const toastr = new Toastr();
  const translate = getTranslator();

  const onUpgrade = async () => {
    if (!translate) return;
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
    if (stage === Stage.SUCCESS && translate) {
      toastr.success(translate('accountUpgradedSuccessfully'));
      dispatch(setUpgradeModalVisible(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, dispatch]);

  const renderComponent = () => {
    switch (stage) {
      case Stage.INIT:
        return (
          translate && (
            <>
              <DescriptionCentered>
                {translate('newVersionOfSmartContractNecessary')}
              </DescriptionCentered>
              <UpgradeButton onClick={onUpgrade}>
                {translate('upgrade')}
              </UpgradeButton>
            </>
          )
        );
      case Stage.WAITING_FOR_TXN:
        return (
          translate && (
            <DescriptionCentered>
              {translate('waitingForTransaction')}
            </DescriptionCentered>
          )
        );
      case Stage.SUCCESS:
        return (
          translate && (
            <DescriptionCentered>
              {translate('accountUpgradedSuccessfully')}
            </DescriptionCentered>
          )
        );
      default:
        return (
          translate && (
            <DescriptionCentered>
              {translate('transactionHash')} <br />{' '}
              <Txnlink onClick={() => openExplorerTab(txnHash, 'tx', chainId)}>
                {shortenAddress(txnHash)}{' '}
              </Txnlink>
              <br />
              {translate('upgradeTransactionPending')}
            </DescriptionCentered>
          )
        );
    }
  };

  return (
    translate && (
      <Wrapper>
        <StarknetLogo />
        <Title>{translate('upgradeAccount')}</Title>
        {renderComponent()}
      </Wrapper>
    )
  );
};
