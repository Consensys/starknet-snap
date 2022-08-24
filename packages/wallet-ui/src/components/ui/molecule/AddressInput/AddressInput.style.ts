import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';
import { theme } from 'theme/default';

interface IInput {
  focused?: boolean;
  error?: boolean;
  withIcon?: boolean;
  disabled?: boolean;
  amountInputMode?: boolean;
  placeholder?: string;
}

interface IIcon {
  error: string;
}

const getInputTextColorByState = (focused?: boolean, disabled?: boolean, error?: boolean) => {
  if ((!focused && !error) || disabled) {
    return theme.palette.grey.grey1;
  }

  return theme.palette.grey.black;
};

const getInputBorderColorByState = (focused?: boolean, disabled?: boolean, error?: boolean) => {
  if (disabled) {
    return 'transparent';
  }

  if (error) {
    return theme.palette.error.main;
  }

  if (!focused) {
    return theme.palette.grey.grey3;
  }

  return theme.palette.grey.grey2;
};

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

export const RowWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
`;

export const Input = styled.input.attrs((props) => ({
  placeholder: props?.placeholder,
}))<IInput>`
  border: none;
  height: 50px;
  width: ${(props) => (props.amountInputMode ? '8px' : '100%')};
  font-size: ${(props) => props.theme.typography.p2.fontSize};
  font-family: ${(props) => props.theme.typography.p2.fontFamily};
  color: ${(props) => getInputTextColorByState(props.focused, props.disabled, props.error)};
  :focus {
    outline: none;
  }
  padding-left: ${(props) => (props.withIcon ? '9px' : '0px')};
  background-color: ${(props) => props.theme.palette.grey.white};
  ::placeholder,
  ::-webkit-input-placeholder {
    color: ${(props) => props.theme.palette.grey.grey1};
  }
`;

export const InputContainer = styled.div<IInput>`
  border-radius: ${(props) => props.theme.corner.small};
  box-sizing: border-box;
  border: 1px solid ${(props) => props.theme.palette.grey.grey3};
  border-color: ${(props) => getInputBorderColorByState(props.focused, props.disabled, props.error)};
  background-color: ${(props) => props.theme.palette.grey.white};
  padding-left: ${(props) => props.theme.spacing.small};
  padding-right: ${(props) => props.theme.spacing.small};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const Left = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
`;

export const Icon = styled(FontAwesomeIcon).attrs<IIcon>((props) => ({
  color: props.error !== '' ? props.theme.palette.error.main : props.theme.palette.success.main,
}))<IIcon>``;
