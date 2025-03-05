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

export const NoHiddenAccountText = styled.span`
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
