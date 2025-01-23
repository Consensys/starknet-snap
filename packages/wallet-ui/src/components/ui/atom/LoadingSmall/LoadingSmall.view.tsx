import { HTMLAttributes } from 'react';
import { LoadingSpinner, LoadingText, Wrapper } from './LoadingSmall.style';
import { useStarkNetSnap } from 'services';

interface Props extends HTMLAttributes<HTMLDivElement> {}

export const LoadingSmallView = ({ ...otherProps }: Props) => {
  const { getTranslator } = useStarkNetSnap();
  const translate = getTranslator();

  return (
    translate && (
      <Wrapper {...otherProps}>
        <LoadingSpinner icon="spinner" pulse />
        <LoadingText>{translate('loading')}</LoadingText>
      </Wrapper>
    )
  );
};
