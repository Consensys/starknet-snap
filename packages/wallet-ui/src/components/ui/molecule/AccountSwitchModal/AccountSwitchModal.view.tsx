import { shortenAddress, shortenDomain } from 'utils/utils';
import { Wrapper } from './AccountSwitchModal.style';
import { Menu } from '@headlessui/react';
import {
  MenuItems,
  MenuSection,
  NetworkMenuItem,
  MenuItemText,
} from 'components/ui/organism/Menu/Menu.style';
import { Radio } from '@mui/material';
import { theme } from 'theme/default';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppSelector } from 'hooks/redux';
import { useStarkNetSnap } from 'services';

interface Props {
  currentAddress: string;
  accounts: string[];
  full?: boolean;
  starkName?: string;
}

export const AccountSwitchModalView = ({
  currentAddress,
  accounts,
  full,
  starkName,
}: Props) => {
  const networks = useAppSelector((state) => state.networks);
  const { switchAccount, addNewAccount } = useStarkNetSnap();
  const chainId = networks?.items[networks.activeNetwork]?.chainId;

  return (
    <Menu as="div" style={{ display: 'inline-block', position: 'relative' }}>
      <Menu.Button style={{ background: 'none', border: 'none' }}>
        <Wrapper backgroundTransparent iconRight="angle-down">
          {full
            ? starkName ?? currentAddress
            : starkName
            ? shortenDomain(starkName)
            : shortenAddress(currentAddress)}
        </Wrapper>
      </Menu.Button>

      <MenuItems style={{ right: 'auto', zIndex: '1' }}>
        {/* Account List */}
        <MenuSection>
          <Menu.Item disabled>
            <div style={{ padding: '8px 0px 0px 8px' }}>Accounts</div>
          </Menu.Item>
        </MenuSection>
        <MenuSection>
          {accounts.map((account) => (
            <Menu.Item key={account}>
              <NetworkMenuItem onClick={() => switchAccount(chainId, account)}>
                <Radio
                  checked={account === currentAddress}
                  name="radio-buttons"
                  inputProps={{ 'aria-label': account }}
                  sx={{
                    color: theme.palette.grey.grey1,
                    '&.Mui-checked': {
                      color: theme.palette.secondary.main,
                    },
                  }}
                />
                <MenuItemText>
                  {full ? account : shortenAddress(account)}
                </MenuItemText>
              </NetworkMenuItem>
            </Menu.Item>
          ))}
        </MenuSection>

        <MenuSection>
          <Menu.Item>
            <NetworkMenuItem
              onClick={async () => await addNewAccount(chainId)}
              style={{
                justifyContent: 'center',
                padding: '8px 0',
                textAlign: 'center',
              }}
            >
              <FontAwesomeIcon
                icon="plus"
                color={theme.palette.primary.main}
                style={{ marginRight: '8px' }}
              />
            </NetworkMenuItem>
          </Menu.Item>
        </MenuSection>
      </MenuItems>
    </Menu>
  );
};
