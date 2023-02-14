import { ethers } from 'ethers';
import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from 'hooks/redux';
import { getAmountPrice } from 'utils/utils';
import { Button } from 'components/ui/atom/Button';
import { AssetQuantity } from 'components/ui/molecule/AssetQuantity';
import { PopIn } from 'components/ui/molecule/PopIn';
import { getHumanReadableAmount } from 'utils/utils';
import { Buttons, HeaderButton, Wrapper } from './Header.style';
import { ReceiveModal } from './ReceiveModal';
import { SendModal } from './SendModal';
import { useStarkNetSnap } from 'services';
import { TOKEN_BALANCE_REFRESH_FREQUENCY } from 'utils/constants';

interface Props {
  address: string;
}

export const HeaderView = ({ address }: Props) => {
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const networks = useAppSelector((state) => state.networks);
  const wallet = useAppSelector((state) => state.wallet);
  const { updateTokenBalance } = useStarkNetSnap();
  const timeoutHandle = useRef(setTimeout(() => {}));

  const getUSDValue = () => {
    const amountFloat = parseFloat(
      ethers.utils.formatUnits(wallet.erc20TokenBalanceSelected.amount, wallet.erc20TokenBalanceSelected.decimals),
    );
    if (wallet.erc20TokenBalanceSelected.usdPrice)
      return getAmountPrice(wallet.erc20TokenBalanceSelected, amountFloat, false);
    return '';
  };

  useEffect(() => {
    const chain = networks.items[networks.activeNetwork]?.chainId;
    if (chain && address) {
      clearTimeout(timeoutHandle.current); // cancel the timeout that was in-flight
      timeoutHandle.current = setTimeout(async () => {
        await updateTokenBalance(wallet.erc20TokenBalanceSelected.address, address, chain);
      }, TOKEN_BALANCE_REFRESH_FREQUENCY);
      return () => clearTimeout(timeoutHandle.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.erc20TokenBalanceSelected]);

  const handleSendClick = () => {
    setSendOpen(true);
  };

  return (
    <Wrapper>
      <AssetQuantity
        USDValue={getUSDValue()}
        currencyValue={getHumanReadableAmount(wallet.erc20TokenBalanceSelected)}
        currency={wallet.erc20TokenBalanceSelected.symbol}
        size="big"
        centered
      />
      <Buttons>
        <HeaderButton onClick={() => setReceiveOpen(true)}>Receive</HeaderButton>
        <Button onClick={() => handleSendClick()} backgroundTransparent borderVisible>
          Send
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
