import { ethers } from 'ethers';
import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from 'hooks/redux';
import { getAmountPrice } from 'utils/utils';
import { Button } from 'components/ui/atom/Button';
import { AssetQuantity } from 'components/ui/molecule/AssetQuantity';
import { PopIn } from 'components/ui/molecule/PopIn';
import { getSpendableTotalBalance } from 'utils/utils';
import { Buttons, HeaderButton, Wrapper } from './Header.style';
import { ReceiveModal } from './ReceiveModal';
import { SendModal } from './SendModal';
import { useMultiLanguage, useStarkNetSnap } from 'services';
import { TOKEN_BALANCE_REFRESH_FREQUENCY } from 'utils/constants';

interface Props {
  address: string;
}

export const HeaderView = ({ address }: Props) => {
  const { updateTokenBalance } = useStarkNetSnap();
  const { translate } = useMultiLanguage();
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const networks = useAppSelector((state) => state.networks);
  const erc20TokenBalanceSelected = useAppSelector(
    (state) => state.wallet.erc20TokenBalanceSelected,
  );
  const timeoutHandle = useRef(setTimeout(() => {}));

  const getUSDValue = () => {
    const amountFloat = parseFloat(
      ethers.utils.formatUnits(
        erc20TokenBalanceSelected.amount,
        erc20TokenBalanceSelected.decimals,
      ),
    );
    if (erc20TokenBalanceSelected.usdPrice)
      return getAmountPrice(erc20TokenBalanceSelected, amountFloat, false);
    return '';
  };

  useEffect(() => {
    const chain = networks.items[networks.activeNetwork]?.chainId;
    if (chain && address) {
      clearTimeout(timeoutHandle.current); // cancel the timeout that was in-flight
      timeoutHandle.current = setTimeout(async () => {
        await updateTokenBalance(
          erc20TokenBalanceSelected.address,
          address,
          chain,
        );
      }, TOKEN_BALANCE_REFRESH_FREQUENCY);
      return () => clearTimeout(timeoutHandle.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [erc20TokenBalanceSelected]);

  const handleSendClick = () => {
    setSendOpen(true);
  };

  return (
    <Wrapper>
      <AssetQuantity
        USDValue={getUSDValue()}
        currencyValue={getSpendableTotalBalance(erc20TokenBalanceSelected)}
        currency={erc20TokenBalanceSelected.symbol}
        size="big"
        centered
      />
      <Buttons>
        <HeaderButton onClick={() => setReceiveOpen(true)}>
          {translate('receive')}
        </HeaderButton>
        <Button
          onClick={() => handleSendClick()}
          backgroundTransparent
          borderVisible
        >
          {translate('send')}
        </Button>
      </Buttons>
      <PopIn isOpen={receiveOpen} setIsOpen={setReceiveOpen}>
        <ReceiveModal address={address} />
      </PopIn>
      <PopIn isOpen={sendOpen} setIsOpen={setSendOpen}>
        <SendModal closeModal={() => setSendOpen(false)} />
      </PopIn>
    </Wrapper>
  );
};
