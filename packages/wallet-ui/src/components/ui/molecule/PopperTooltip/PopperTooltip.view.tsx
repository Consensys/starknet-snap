import { PopperPlacementType } from '@mui/material';
import { ReactNode, useState } from 'react';
import { usePopperTooltip } from 'react-popper-tooltip';
import { CSSProperties } from 'styled-components';
import { POPOVER_DURATION } from 'utils/constants';
import { PopperContainer, ToolTipContent, Wrapper } from './PopperTooltip.style';

type CloseTriggers = 'timeout' | 'click' | 'hover';

interface Props {
  children: ReactNode;
  content: ReactNode;
  contentStyle?: CSSProperties;
  closeTrigger?: CloseTriggers;
  arrowVisible?: boolean;
  offSet?: [number, number];
  placement?: PopperPlacementType;
}

export const PopperTooltipView = ({
  children,
  content,
  contentStyle,
  closeTrigger = 'timeout',
  arrowVisible = true,
  offSet,
  placement,
}: Props) => {
  const [popperVisible, setPopperVisible] = useState(false);

  const handlePopperVisibleChange = () => {
    if (!popperVisible && closeTrigger === 'timeout') {
      setTimeout(() => {
        setPopperVisible(false);
      }, POPOVER_DURATION);
    } else if (closeTrigger === 'click') {
      setPopperVisible(!popperVisible);
    }
  };

  const handleOnClick = () => {
    if (closeTrigger === 'hover') setPopperVisible(false);
    else setPopperVisible(true);
  };

  const handleOnMouseEnter = () => {
    if (closeTrigger === 'hover') setPopperVisible(true);
  };

  const handleOnMouseLeave = () => {
    if (closeTrigger === 'hover') setPopperVisible(false);
  };

  const { getArrowProps, getTooltipProps, setTooltipRef, setTriggerRef, visible } = usePopperTooltip({
    trigger: 'click',
    offset: offSet || [0, 23],
    visible: popperVisible,
    onVisibleChange: handlePopperVisibleChange,
    closeOnOutsideClick: closeTrigger === 'click',
    placement: placement,
  });

  return (
    <>
      <Wrapper
        ref={setTriggerRef}
        onClick={handleOnClick}
        onMouseEnter={handleOnMouseEnter}
        onMouseLeave={handleOnMouseLeave}
      >
        {children}
      </Wrapper>

      {visible && (
        <PopperContainer ref={setTooltipRef} {...getTooltipProps({})} arrowVisible={arrowVisible}>
          {arrowVisible && <div {...getArrowProps({ className: 'arrow' })} />}
          <ToolTipContent style={contentStyle}>{content}</ToolTipContent>
        </PopperContainer>
      )}
    </>
  );
};
