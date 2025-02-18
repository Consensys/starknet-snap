import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

export const Wrapper = styled.div`
  background-color: ${(props) => props.theme.palette.grey.white};
  width: ${(props) => props.theme.modal.noPadding};
  border-radius: 8px 8px 0px 0px;
  padding-top: 56px;
  padding-bottom: 24px;
`;

export const ScrollableWrapper = styled.div`
  overflow-y: scroll;
  height: 365px;
  margin: 0px 15px;
`;

export const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0px 24px 24px 24px;
`;

export const Title = styled.div`
  font-size: ${(props) => props.theme.typography.h3.fontSize};
  font-weight: ${(props) => props.theme.typography.h3.fontSize};
  font-family: ${(props) => props.theme.typography.h3.fontFamily};
  text-align: center;
  margin-bottom: 25px;
`;

export const HiddenAccountBar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 15px 40px 0px 30px;
  cursor: pointer;
`;

export const HiddenAccountBarLeftIcon = styled(FontAwesomeIcon)`
  color: ${(props) => props.theme.palette.grey.grey1};
  margin-right: 8px;
`;

export const HiddenAccountBarRightIcon = styled(FontAwesomeIcon)`
  color: ${(props) => props.theme.palette.grey.grey1};
  margin-left: 8px;
`;
