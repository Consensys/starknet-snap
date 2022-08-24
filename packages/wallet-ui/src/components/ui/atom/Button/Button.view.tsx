import { MouseEvent } from 'react';
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Variant } from 'theme/types';
import { LeftIcon, RightIcon, TextWrapper, Wrapper } from './Button.style';
import { IconName } from '@fortawesome/fontawesome-svg-core';
import { CSSProperties } from 'styled-components';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  enabled?: boolean;
  variant?: Variant;
  iconLeft?: IconName;
  iconRight?: IconName;
  backgroundTransparent?: boolean;
  fontSize?: string;
  borderVisible?: boolean;
  upperCaseOnly?: boolean;
  textStyle?: CSSProperties;
  iconStyle?: CSSProperties;
  customIconLeft?: ReactNode;
  customIconRight?: ReactNode;
}

export const ButtonView = ({
  onClick = () => void 0,
  enabled = true,
  variant,
  iconLeft,
  iconRight,
  customIconLeft,
  customIconRight,
  backgroundTransparent,
  children,
  fontSize,
  borderVisible,
  upperCaseOnly = true,
  textStyle,
  iconStyle,
  ...otherProps
}: Props) => {
  const hasIcons = iconRight !== undefined || iconLeft !== undefined;
  return (
    <Wrapper
      variant={variant}
      onClick={onClick}
      disabled={!enabled}
      backgroundTransparent={backgroundTransparent}
      borderVisible={borderVisible}
      {...otherProps}
    >
      {customIconLeft}
      {iconLeft && <LeftIcon icon={['fas', iconLeft]} style={iconStyle} />}
      <TextWrapper hasIcons={hasIcons} fontSize={fontSize} upperCaseOnly={upperCaseOnly} style={textStyle}>
        {children}
      </TextWrapper>
      {iconRight && <RightIcon icon={['fas', iconRight]} style={iconStyle} />}
      {customIconRight}
    </Wrapper>
  );
};
