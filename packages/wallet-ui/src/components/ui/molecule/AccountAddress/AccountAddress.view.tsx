import { PopperPlacementType } from '@mui/material';
import { shortenAddress, shortenDomain } from 'utils/utils';
import { PopperTooltip } from '../PopperTooltip';
import { Wrapper } from './AccountAddress.style';
import { useMultiLanguage } from 'services';

interface Props {
  address: string;
  full?: boolean;
  placement?: PopperPlacementType;
  starkName?: string;
}

export const AccountAddressView = ({
  address,
  full,
  placement,
  starkName,
}: Props) => {
  const handleAddressClick = () => {
    navigator.clipboard.writeText(address);
  };
  const { translate } = useMultiLanguage();

  return (
    <>
      <PopperTooltip
        content={translate('copied')}
        closeTrigger="click"
        placement={placement}
      >
        <PopperTooltip
          content={translate('copyToClipboard')}
          closeTrigger="hover"
          placement={placement}
        >
          <Wrapper
            iconRight="clone"
            onClick={handleAddressClick}
            backgroundTransparent
          >
            {full
              ? starkName ?? address
              : starkName
              ? shortenDomain(starkName)
              : shortenAddress(address)}
          </Wrapper>
        </PopperTooltip>
      </PopperTooltip>
    </>
  );
};
