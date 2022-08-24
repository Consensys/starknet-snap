import { Wrapper } from './AccountImage.style';
import Jazzicon from '@metamask/jazzicon';
import { useEffect, useRef } from 'react';

interface Props {
  address: string;
  size?: number;
  connected?: boolean;
}

export const AccountImageView = ({ address, size = 40, connected, ...otherProps }: Props) => {
  const ref = useRef<HTMLDivElement>();

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = '';
      ref.current.appendChild(Jazzicon(size, address ? parseInt(address.substring(0, 18)) : '0'));
    }
  }, [address, size]);

  return <Wrapper connected={connected} size={size} {...otherProps} ref={ref as any} />;
};
