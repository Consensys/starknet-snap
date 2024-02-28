import { PopperPlacementType } from '@mui/material';
import { shortenAddress, shortenDomain } from 'utils/utils';
import { PopperTooltip } from '../PopperTooltip';
import { Wrapper } from './AccountAddress.style';

interface Props {
  address: string;
  full?: boolean;
  placement?: PopperPlacementType;
  starkName?: string;
}

export const AccountAddressView = ({ address, full, placement, starkName }: Props) => {
  const handleAddressClick = () => {
    navigator.clipboard.writeText(address);
  };

  return (
    <>
      <PopperTooltip content="Copied!" closeTrigger="click" placement={placement}>
        <PopperTooltip content="Copy to clipboard" closeTrigger="hover" placement={placement}>
          <Wrapper iconRight="clone" onClick={handleAddressClick} backgroundTransparent>
            {full ? starkName ?? address : starkName ? shortenDomain(starkName) : shortenAddress(address)}
          </Wrapper>
        </PopperTooltip>
      </PopperTooltip>
    </>
  );
};
