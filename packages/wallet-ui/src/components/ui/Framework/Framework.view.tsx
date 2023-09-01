import { ReactNode, useState } from 'react';
import { Footer } from 'components/ui/organism/Footer';
import { Banner, CloseIcon, ColMiddle, Content, MenuStyled, Wrapper } from './Framework.style';

interface Props {
  connected: boolean;
  children?: ReactNode;
}

export const FrameworkView = ({ connected, children }: Props) => {
  const [bannerOpen, setBannerOpen] = useState(true);
  return (
    <Wrapper>
      <ColMiddle>
        <MenuStyled connected={connected} />
        <Content>{children}</Content>
        <Footer />
      </ColMiddle>
      {bannerOpen && (
        <Banner>
          This is the Open Beta version of the dapp, updates are made regularly{' '}
          <CloseIcon icon={'close'} onClick={() => setBannerOpen(false)} />
        </Banner>
      )}
    </Wrapper>
  );
};
