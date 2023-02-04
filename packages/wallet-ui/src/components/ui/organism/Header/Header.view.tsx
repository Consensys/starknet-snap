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
import { PopperTooltip } from 'components/ui/molecule/PopperTooltip';
import { TOKEN_BALANCE_REFRESH_FREQUENCY } from 'utils/constants';

interface Props {
  address: string;
}

export const HeaderView = ({ address }: Props) => {
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [needMoreETH, setNeedMoreETH] = useState(false);
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
    if (
      Number(wallet.erc20TokenBalanceSelected.amount) > 0 ||
      wallet.erc20TokenBalanceSelected.address !== wallet.erc20TokenBalances[0].address
    ) {
      setSendOpen(true);
      setNeedMoreETH(false);
    } else {
      setNeedMoreETH(true);
    }
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
        <PopperTooltip
          content={
            needMoreETH && (
              <div>
                Your account needs to hold enough ETH before being deployed,
                <br></br> Please send enough ETH to this account address and try again by refreshing the page
              </div>
            )
          }
          placement="left"
          closeTrigger="click"
        >
          <Button onClick={() => handleSendClick()} backgroundTransparent borderVisible>
            Send
          </Button>
        </PopperTooltip>
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
