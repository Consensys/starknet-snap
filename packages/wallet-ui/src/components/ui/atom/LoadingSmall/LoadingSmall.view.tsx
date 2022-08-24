import { HTMLAttributes } from 'react';
import { LoadingSpinner, LoadingText, Wrapper } from './LoadingSmall.style';

interface Props extends HTMLAttributes<HTMLDivElement> {}

export const LoadingSmallView = ({ ...otherProps }: Props) => {
  return (
    <Wrapper {...otherProps}>
      <LoadingSpinner icon="spinner" pulse />
      <LoadingText>Loading</LoadingText>
    </Wrapper>
  );
};
