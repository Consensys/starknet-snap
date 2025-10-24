import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

export const HiddenAccountBar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${(props) => props.theme.spacing.base};
  padding-bottom: 0;
  cursor: pointer;
`;

export const HiddenAccountBarLeftIcon = styled(FontAwesomeIcon)`
  color: ${(props) => props.theme.palette.grey.grey1};
  margin-right: ${(props) => props.theme.spacing.tiny2};
`;

export const HiddenAccountBarRightIcon = styled(FontAwesomeIcon)`
  color: ${(props) => props.theme.palette.grey.grey1};
  margin-left: ${(props) => props.theme.spacing.tiny2};
`;

export const NoAccountsFoundText = styled.span`
  color: ${(props) => props.theme.palette.grey.grey1};
`;

export const VerticalAlignBox = styled.div`
  height: 100%;
  display: flex;
  align-item: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
`;

export const SearchInputWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spacing.small};
  padding: ${(props) => props.theme.spacing.tiny};
  border: 1px solid ${(props) => props.theme.palette.grey.grey3};
  border-radius: 8px;
  background-color: ${(props) => props.theme.palette.grey.white};
`;

export const SearchIcon = styled(FontAwesomeIcon)`
  margin-right: ${(props) => props.theme.spacing.tiny};
  color: ${(props) => props.theme.palette.grey.grey2};
`;

export const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: ${(props) => props.theme.typography.p2.fontSize};
  color: ${(props) => props.theme.palette.grey.grey1};
  background-color: transparent;

  &::placeholder {
    color: ${(props) => props.theme.palette.grey.grey3};
  }
`;
