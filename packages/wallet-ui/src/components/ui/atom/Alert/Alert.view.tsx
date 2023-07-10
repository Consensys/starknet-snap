import { Parag, Wrapper } from './Alert.style';
import { LeftIcon } from '../Button/Button.style';
import { Variant, VariantOptions } from 'theme/types';
import { theme } from 'theme/default';
import { useRef, useEffect, useState } from 'react';

interface Props {
  text: string;
  variant: Variant;
}

export function AlertView({ text, variant, ...otherProps }: Props) {
  const paragraph = useRef<HTMLParagraphElement | null>(null);
  const [isMultiline, setIsMultiline] = useState(false);
  useEffect(() => {
    if (paragraph.current) {
      const height = paragraph.current.offsetHeight;
      setIsMultiline(height > 20);
    }
  }, []);
  return (
    <Wrapper isMultiline={isMultiline} variant={variant} {...otherProps}>
      <>
        {variant === VariantOptions.SUCCESS && <LeftIcon icon={['fas', 'check-circle']} />}
        {variant === VariantOptions.INFO && <LeftIcon icon={['fas', 'info-circle']} color={theme.palette.info.dark} />}
        {variant === VariantOptions.ERROR && (
          <LeftIcon icon={['fas', 'exclamation-circle']} color={theme.palette.error.main} />
        )}
        {variant === VariantOptions.WARNING && (
          <LeftIcon icon={['fas', 'exclamation-triangle']} color={theme.palette.warning.main} />
        )}
        <Parag ref={paragraph} color={variant}>{text}</Parag>
      </>
    </Wrapper>
  );
}
