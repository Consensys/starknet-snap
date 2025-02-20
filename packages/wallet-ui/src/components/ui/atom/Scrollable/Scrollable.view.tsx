import { useScrollTo } from 'hooks';
import { RefObject } from 'react';

import { ScrollableWrapper } from './Scrollable.style';

export interface Props<Element> {
  height: number;
  child: (scrollTo: RefObject<Element>) => React.ReactNode;
}

export const ScrollableView = <Element extends HTMLElement>({
  child,
  height,
}: Props<Element>) => {
  const { scrollTo } = useScrollTo<Element>();
  return (
    <ScrollableWrapper
      style={{
        height,
      }}
    >
      {child(scrollTo)}
    </ScrollableWrapper>
  );
};
