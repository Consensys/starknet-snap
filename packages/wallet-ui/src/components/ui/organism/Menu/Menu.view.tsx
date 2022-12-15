import {
  Left,
  Right,
  NetworkPill,
  MenuIcon,
  Badge,
  MenuDivider,
  MenuItems,
  Wrapper,
  MenuSection,
  Bold,
  MenuItemText,
  NetworkMenuItem,
} from './Menu.style';
import logo from 'assets/images/starknet-logo.svg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { HTMLAttributes } from 'react';
import { Menu } from '@headlessui/react';
import { theme } from 'theme/default';
import { Radio, Skeleton } from '@mui/material';
import { useAppDispatch, useAppSelector } from 'hooks/redux';
import { setWalletConnection, setForceReconnect, resetWallet, clearAccounts } from 'slices/walletSlice';
import { resetNetwork, setActiveNetwork } from 'slices/networkSlice';

interface IProps extends HTMLAttributes<HTMLElement> {
  connected: boolean;
}

export const MenuView = ({ connected, ...otherProps }: IProps) => {
  const networks = useAppSelector((state) => state.networks);
  const dispatch = useAppDispatch();

  const changeNetwork = (network: number) => {
    dispatch(clearAccounts());
    dispatch(setActiveNetwork(network));
  };
  /*
    There is no way to disconnect the snap from a dapp it must be done from MetaMask.
    This function just clears the memory state and sets forceReconnect which forces the connection prompt.
    TODO: This should maybe be replaced by a prompt informing the user how to disconnect from MetaMask for better security.
   */
  function disconnect() {
    dispatch(setWalletConnection(false));
    dispatch(setForceReconnect(true));
    dispatch(resetWallet());
    dispatch(resetNetwork());
  }

  return (
    <Wrapper {...otherProps}>
      <Left>
        <img src={logo} alt="logo" />
      </Left>
      <Right>
        <Menu as="div" style={{ display: 'inline-block', position: 'relative', textAlign: 'left' }}>
          <Menu.Button
            as="div"
            style={{
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
            }}
          >
            <NetworkPill iconRight="angle-down" backgroundTransparent>
              {networks.items[networks.activeNetwork] ? (
                networks.items[networks.activeNetwork].name
              ) : (
                <Skeleton variant="text" width={100} height={16} />
              )}
            </NetworkPill>
          </Menu.Button>
          <MenuItems>
            <MenuSection>
              <Menu.Item disabled>
                <div style={{ padding: '8px 0px 0px 8px' }}>
                  <Bold>Network</Bold>
                </div>
              </Menu.Item>
            </MenuSection>
            <MenuSection>
              {networks.items.map((network, index) => (
                <Menu.Item key={network.chainId + '_' + index}>
                  <NetworkMenuItem onClick={() => changeNetwork(index)}>
                    <Radio
                      checked={Number(networks.activeNetwork) === index}
                      name="radio-buttons"
                      inputProps={{ 'aria-label': network.name }}
                      sx={{
                        color: theme.palette.grey.grey1,
                        '&.Mui-checked': {
                          color: theme.palette.secondary.main,
                        },
                      }}
                    />
                    <MenuItemText>{network.name}</MenuItemText>
                  </NetworkMenuItem>
                </Menu.Item>
              ))}
            </MenuSection>
          </MenuItems>
        </Menu>
        <Menu as="div" style={{ display: 'inline-block', position: 'relative', textAlign: 'left' }}>
          <Menu.Button
            disabled={!connected}
            style={{
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
            }}
          >
            <MenuIcon>
              <FontAwesomeIcon icon={['fas', 'bars']} />
              {connected ? (
                <Badge style={{ background: theme.palette.success.main }}></Badge>
              ) : (
                <Badge style={{ background: theme.palette.grey.grey4, border: '1px solid #ffffff' }}></Badge>
              )}
            </MenuIcon>
          </Menu.Button>
          <MenuItems>
            <MenuSection>
              <Menu.Item disabled>
                <div style={{ padding: '8px 0px' }}>
                  <FontAwesomeIcon
                    icon="circle"
                    color={theme.palette.success.main}
                    style={{ fontSize: '12px', lineHeight: '12px', padding: '0px 10px' }}
                  />
                  <MenuItemText>Connected to StarkNet Snap</MenuItemText>
                </div>
              </Menu.Item>
            </MenuSection>
            <MenuDivider />
            <MenuSection>
              <Menu.Item>
                {({ active }) => (
                  <div
                    style={{
                      padding: '8px 0px',
                      background: active ? theme.palette.grey.grey4 : theme.palette.grey.white,
                      cursor: 'pointer',
                    }}
                  >
                    <FontAwesomeIcon
                      icon="info-circle"
                      color={theme.palette.grey.grey1}
                      style={{
                        fontSize: '12px',
                        lineHeight: '12px',
                        padding: '0px 10px',
                      }}
                    />
                    <a
                      href="https://consensys.net/blog/metamask/metamask-integrates-starkware-into-first-of-its-kind-zk-rollup-snap/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MenuItemText>About this snap</MenuItemText>
                    </a>
                  </div>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <div
                    onClick={disconnect}
                    style={{
                      padding: '8px 0px',
                      background: active ? theme.palette.grey.grey4 : theme.palette.grey.white,
                      cursor: 'pointer',
                    }}
                  >
                    <FontAwesomeIcon
                      icon="sign-out"
                      color={theme.palette.grey.grey1}
                      style={{ fontSize: '12px', lineHeight: '12px', padding: '0px 10px' }}
                    />
                    <MenuItemText>Disconnect</MenuItemText>
                  </div>
                )}
              </Menu.Item>
            </MenuSection>
          </MenuItems>
        </Menu>
      </Right>
    </Wrapper>
  );
};
