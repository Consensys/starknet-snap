import { useEffect, useRef, useState } from 'react';

/**
 * A hook to pull async function continuously
 *
 * @param asyncFunction - The async function to call repeatedly
 * @param interval - The interval to call the async function
 * @returns { start, stop }
 */
export const useAsyncRecursivePull = (
  asyncFunction: () => Promise<void>,
  interval = 1000,
) => {
  const timeoutHandle = useRef(setTimeout(() => {}));

  const stop = () => {
    timeoutHandle?.current && clearTimeout(timeoutHandle.current);
  };

  const [increment, setNextIncrement] = useState(0);

  const start = () => {
    setNextIncrement(Date.now());
  };

  useEffect(
    () => {
      if (increment) {
        stop();

        timeoutHandle.current = setTimeout(() => {
          asyncFunction()
            .catch((error) => {
              // Log the error but do not throw it to avoid breaking the app
              console.error('Failed to process the data pull', error);
            })
            .finally(() => {
              // Kick off the next refresh regardless if failed or success
              setNextIncrement(Date.now());
            });
        }, interval);
      }

      return () => {
        stop();
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [increment],
  );
  return {
    start,
    stop,
  };
};
