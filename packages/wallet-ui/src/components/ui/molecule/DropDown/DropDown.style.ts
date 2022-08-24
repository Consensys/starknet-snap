import styled from 'styled-components';
import { theme } from 'theme/default';
import Dropdown from 'react-dropdown';
import selectArrow from 'assets/images/select-arrow.svg';

interface IDropDown {
  error?: boolean;
  disabled?: boolean;
}

const getInputTextColorByState = (focused?: boolean, disabled?: boolean, error?: boolean) => {
  if ((!focused && !error) || disabled) {
    return theme.palette.grey.grey1;
  }

  return theme.palette.grey.black;
};

const getInputBorderColorByState = (focused?: boolean, disabled?: boolean, error?: boolean) => {
  if (error) {
    return theme.palette.error.main;
  }

  if (disabled || !focused) {
    return theme.palette.grey.grey3;
  }

  return theme.palette.grey.grey2;
};

export const Wrapper = styled.div<IDropDown>`
  display: flex;
  flex-direction: column;

  .is-open .Dropdown-control {
    color: ${(props) => getInputTextColorByState(true, props.disabled, props.error)};
    border-color: ${(props) => getInputBorderColorByState(true, props.disabled, props.error)};
  }
`;

export const DropDown = styled.select<IDropDown>``;

export const DropdownStyled = styled(Dropdown)<IDropDown>`
  .Dropdown-control {
    border-radius: ${(props) => props.theme.corner.small};
    height: 50px;
    box-sizing: border-box;
    border: 1px solid ${(props) => props.theme.palette.grey.grey3};
    font-size: ${(props) => props.theme.typography.p2.fontSize};
    font-family: ${(props) => props.theme.typography.p2.fontFamily};
    color: ${(props) => getInputTextColorByState(false, props.disabled, props.error)};
    border-color: ${(props) => getInputBorderColorByState(false, props.disabled, props.error)};
    border-style: ${(props) => (props.disabled ? 'dashed' : 'solid')};
    :focus {
      outline: none;
    }
    padding-left: ${(props) => props.theme.spacing.small};
    background-color: ${(props) => props.theme.palette.grey.white};
    ::placeholder,
    ::-webkit-input-placeholder {
      color: ${(props) => props.theme.palette.grey.grey1};
    }
    -webkit-appearance: none;
    appearance: none;
    background-image: url(${selectArrow});
    background-repeat: no-repeat;
    background-position: calc(100% - 20px) center;
    background-size: 12px;
    padding-right: 20px;
    display: flex;
    align-items: center;
  }

  .Dropdown-menu {
    margin-top: ${(props) => props.theme.spacing.tiny2};
    border-radius: ${(props) => props.theme.corner.small};
    box-shadow: 0px 14px 24px -6px rgba(106, 115, 125, 0.2);
  }

  .Dropdown-arrow-wrapper {
    display: none;
  }

  .Dropdown-option {
    font-size: ${(props) => props.theme.typography.p2.fontSize};
    color: ${(props) => props.theme.palette.grey.black};
    padding: 10px 18px;

    :hover {
      background-color: ${(props) => props.theme.palette.grey.grey4};
    }
  }
`;

export const DropDownOption = styled.option``;
