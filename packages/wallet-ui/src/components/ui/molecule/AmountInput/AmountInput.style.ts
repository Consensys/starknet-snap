import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'components/ui/atom/Button';
import styled, { keyframes } from 'styled-components';
import { theme } from 'theme/default';

interface IInput {
  focused?: boolean;
  error?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const getInputTextColorByState = (
  focused?: boolean,
  disabled?: boolean,
  error?: boolean,
) => {
  if ((!focused && !error) || disabled) {
    return theme.palette.grey.grey1;
  }

  return theme.palette.grey.black;
};

const getInputBorderColorByState = (
  focused?: boolean,
  disabled?: boolean,
  error?: boolean,
) => {
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

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

export const Spinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid #3498db;
  border-radius: 50%;
  margin-right: 10px;
  width: 16px;
  height: 16px;
  animation: ${spin} 1s linear infinite;
`;

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

export const MaxButton = styled(Button).attrs((props) => ({
  backgroundTransparent: true,
  fontSize: props.theme.typography.c1.fontSize,
}))`
  padding-right: 0px;
  min-width: 0px;
`;

export const Input = styled.input<IInput>`
  border: none;
  height: 50px;
  font-size: ${(props) => props.theme.typography.p2.fontSize};
  font-family: ${(props) => props.theme.typography.p2.fontFamily};
  color: ${(props) =>
    getInputTextColorByState(props.focused, props.disabled, props.error)};
  :focus {
    outline: none;
  }
  padding-left: 0px;
  background-color: ${(props) => props.theme.palette.grey.white};
  ::placeholder,
  ::-webkit-input-placeholder {
    color: ${(props) => props.theme.palette.grey.grey1};
  }
`;

export const USDDiv = styled.div`
  color: ${(props) => props.theme.palette.grey.grey1};
  margin-left: ${(props) => props.theme.spacing.tiny2};
`;

export const InputContainer = styled.div<IInput>`
  border-radius: ${(props) => props.theme.corner.small};
  box-sizing: border-box;
  border: 1px solid ${(props) => props.theme.palette.grey.grey3};
  border-color: ${(props) =>
    getInputBorderColorByState(props.focused, props.disabled, props.error)};
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

export const IconRight = styled(FontAwesomeIcon).attrs((props) => ({
  color: props.theme.palette.grey.grey1,
}))<IInput>`
  cursor: pointer;
`;
