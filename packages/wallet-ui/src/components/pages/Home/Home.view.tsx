import { TransactionsList } from 'components/ui/molecule/TransactionsList';
import { Header } from 'components/ui/organism/Header';
import { SideBar } from 'components/ui/organism/SideBar';
import { RightPart, Wrapper } from './Home.style';
import { useAppSelector } from 'hooks/redux';

interface Props {
  address: string;
}

export const HomeView = ({ address }: Props) => {
  const { erc20TokenBalanceSelected } = useAppSelector((state) => state.wallet);
  return (
    <Wrapper>
      <SideBar address={address} />
      <RightPart>
        {Object.keys(erc20TokenBalanceSelected).length > 0 && <Header address={address} />}
        <TransactionsList transactions={[]} />
      </RightPart>
    </Wrapper>
  );
};
