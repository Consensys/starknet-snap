import { ReactNode } from 'react';
import { Footer } from 'components/ui/organism/Footer';
import { Button, Stack, Typography } from '@mui/material'; // Importing MUI components
import {
  Banner,
  ColMiddle,
  Content,
  MenuStyled,
  Wrapper,
} from './Framework.style';

interface Props {
  connected: boolean;
  children?: ReactNode;
}

export const FrameworkView = ({ connected, children }: Props) => {
  // Get the current `accountDiscovery` value from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const accountDiscovery = urlParams.get('accountDiscovery') ?? "FORCE_CAIRO_0";

  const bannerMessage =
    accountDiscovery === 'FORCE_CAIRO_1'
      ? 'This is a special version for recovering funds on a Cairo 1 account.'
      : 'This is a special version for recovering funds on a Cairo 0 account.';

  const handleAccountChange = (version: string) => {
    // Update the URL without reloading the page
    const newParams = new URLSearchParams(window.location.search);
    newParams.set('accountDiscovery', version);
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?${newParams.toString()}`,
    );
    window.location.reload(); // Reload to apply the updated query parameter
  };

  return (
    <Wrapper>
      <ColMiddle>
        <MenuStyled connected={connected} />
        <Content>{children}</Content>
        <Footer />
      </ColMiddle>
      <Banner>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {bannerMessage}, click <a target="_blank" href="https://github.com/Consensys/starknet-snap/blob/main/docs/tutorial-resolving-stuck-funds.md">here</a> to access the tutorial
        </Typography>
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          alignItems="center"
        >
          <Button
            variant={
              accountDiscovery === 'FORCE_CAIRO_1' ? 'contained' : 'outlined'
            }
            color="warning"
            onClick={() => handleAccountChange('FORCE_CAIRO_1')}
          >
            Force Cairo 1
          </Button>
          <Button
            variant={
              accountDiscovery === 'FORCE_CAIRO_0' ? 'contained' : 'outlined'
            }
            color="warning"
            onClick={() => handleAccountChange('FORCE_CAIRO_0')}
          >
            Force Cairo 0
          </Button>
        </Stack>
      </Banner>
    </Wrapper>
  );
};
