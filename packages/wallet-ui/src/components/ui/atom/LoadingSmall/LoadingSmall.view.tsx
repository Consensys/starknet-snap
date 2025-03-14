import { HTMLAttributes } from 'react';
import { LoadingSpinner, LoadingText, Wrapper } from './LoadingSmall.style';
import { useMultiLanguage } from 'services';

interface Props extends HTMLAttributes<HTMLDivElement> {
  showText?: boolean;
}

export const LoadingSmallView = ({ showText = true, ...otherProps }: Props) => {
  const { translate } = useMultiLanguage();

  return (
    <Wrapper {...otherProps}>
      <LoadingSpinner icon="spinner" pulse />
      {showText && <LoadingText>{translate('loading')}</LoadingText>}
    </Wrapper>
  );
};
