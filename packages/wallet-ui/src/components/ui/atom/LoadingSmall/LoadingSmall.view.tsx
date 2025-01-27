import { HTMLAttributes } from 'react';
import { LoadingSpinner, LoadingText, Wrapper } from './LoadingSmall.style';
import { useMultiLanguage } from 'services';

interface Props extends HTMLAttributes<HTMLDivElement> {}

export const LoadingSmallView = ({ ...otherProps }: Props) => {
  const { translate } = useMultiLanguage();

  return (
    <Wrapper {...otherProps}>
      <LoadingSpinner icon="spinner" pulse />
      <LoadingText>{translate('loading')}</LoadingText>
    </Wrapper>
  );
};
