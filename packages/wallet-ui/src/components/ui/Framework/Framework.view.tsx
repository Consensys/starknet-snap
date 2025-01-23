import { ReactNode, useState } from 'react';
import { Footer } from 'components/ui/organism/Footer';
import {
  Banner,
  CloseIcon,
  ColMiddle,
  Content,
  MenuStyled,
  Wrapper,
} from './Framework.style';
import { useStarkNetSnap } from 'services';

interface Props {
  connected: boolean;
  children?: ReactNode;
}

export const FrameworkView = ({ connected, children }: Props) => {
  const [bannerOpen, setBannerOpen] = useState(true);
  const { getTranslator } = useStarkNetSnap();
  const translate = getTranslator();

  return (
    translate && (
      <Wrapper>
        <ColMiddle>
          <MenuStyled connected={connected} />
          <Content>{children}</Content>
          <Footer />
        </ColMiddle>
        {bannerOpen && (
          <Banner>
            {translate('openBetaVersion')}{' '}
            <CloseIcon icon={'close'} onClick={() => setBannerOpen(false)} />
          </Banner>
        )}
      </Wrapper>
    )
  );
};
