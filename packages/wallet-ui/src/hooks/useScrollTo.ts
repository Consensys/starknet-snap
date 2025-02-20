import { useEffect, useRef } from 'react';

/**
 * A hook for scroll to the ref element
 * @param behavior - scrollIntoView options [MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/scrollIntoView)
 *
 * @returns scrollTo - ref object to scroll to
 * @returns scrollToView - function to scroll to the ref element
 */
export const useScrollTo = <Element extends HTMLElement>(
  behavior: ScrollIntoViewOptions = {
    behavior: 'smooth',
    block: 'start',
  },
): {
  scrollTo: React.RefObject<Element>;
  scrollToView: () => void;
} => {
  const scrollTo = useRef<Element>(null);

  const scrollToView = () => {
    if (scrollTo && scrollTo.current) {
      scrollTo.current.scrollIntoView(behavior);
    }
  };

  useEffect(() => {
    scrollToView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollTo]);

  return {
    scrollToView,
    scrollTo,
  };
};
