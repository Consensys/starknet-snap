import styled from 'styled-components';
import { Variant, VariantOptions } from 'theme/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface IButtonProps {
  variant?: Variant;
  enabled?: boolean;
  backgroundTransparent?: boolean;
  borderVisible?: boolean;
}

interface ITextWrapper {
  fontSize?: string;
  upperCaseOnly?: boolean;
  hasIcons: boolean;
}

export const Wrapper = styled.button<IButtonProps>`
  background: ${(props) =>
    props.backgroundTransparent ? 'transparent' : props.theme.palette[props.variant || VariantOptions.PRIMARY].main};
  color: ${(props) =>
    props.backgroundTransparent
      ? props.theme.palette.grey.black
      : props.theme.palette[props.variant || VariantOptions.PRIMARY].contrastText};
  opacity: ${(props) => (props.disabled ? '50%' : '100%')};
  border-radius: 100px;
  border-width: 2px;
  border-style: ${(props) => (props.borderVisible ? 'solid' : 'none')};
  border-color: ${(props) => props.theme.palette[props.variant || VariantOptions.PRIMARY].main};
  cursor: ${(props) => (props.disabled ? 'initial' : 'pointer')};
  height: 44px;
  min-width: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0px 26px;
  transition: 0.1s all;

  :active {
    opacity: 0.5;
  }
`;

export const TextWrapper = styled.span<ITextWrapper>`
  font-size: ${(props) => props.fontSize || props.theme.typography.p2.fontSize};
  font-weight: ${(props) =>
    props.hasIcons ? props.theme.typography.c1.fontWeight : props.theme.typography.bold.fontWeight};
  font-family: ${(props) =>
    props.hasIcons ? props.theme.typography.c1.fontFamily : props.theme.typography.bold.fontFamily};
  text-transform: ${(props) => (props.upperCaseOnly ? 'uppercase' : 'initial')};
  margin-left: ${(props) => props.theme.spacing.tiny2};
  margin-right: ${(props) => props.theme.spacing.tiny2};
`;

export const LeftIcon = styled(FontAwesomeIcon)`
  font-size: ${(props) => props.theme.typography.i3.fontSize};
`;

export const RightIcon = styled(FontAwesomeIcon)`
  font-size: ${(props) => props.theme.typography.i3.fontSize};
`;
