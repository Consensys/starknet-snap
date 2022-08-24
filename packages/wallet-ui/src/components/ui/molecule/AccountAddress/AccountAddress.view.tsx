import { PopperPlacementType } from '@mui/material';
import { shortenAddress } from 'utils/utils';
import { PopperTooltip } from '../PopperTooltip';
import { Wrapper } from './AccountAddress.style';

interface Props {
  address: string;
  full?: boolean;
  placement?: PopperPlacementType;
}

export const AccountAddressView = ({ address, full, placement }: Props) => {
  const handleAddressClick = () => {
    navigator.clipboard.writeText(address);
  };

  return (
    <>
      <PopperTooltip content="Copied!" closeTrigger="click" placement={placement}>
        <PopperTooltip content="Copy to clipboard" closeTrigger="hover" placement={placement}>
          <Wrapper iconRight="clone" onClick={handleAddressClick} backgroundTransparent>
            {full ? address : shortenAddress(address)}
          </Wrapper>
        </PopperTooltip>
      </PopperTooltip>
    </>
  );
};
