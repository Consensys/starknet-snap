import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

export const Wrapper = styled.div`
  width: ${(props) => props.theme.modal.base};
  padding: ${(props) => props.theme.spacing.base};
  background-color: ${(props) => props.theme.palette.grey.white};
  border-radius: ${(props) => props.theme.corner.small};
`;

export const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${(props) => props.theme.spacing.base};
  padding-top: 0;
`;

export const Title = styled.div`
  text-align: center;
  font-style: normal;
  font-weight: ${(props) => props.theme.typography.h3.fontWeight};
  font-size: ${(props) => props.theme.typography.h3.fontSize};
  font-family: ${(props) => props.theme.typography.h3.fontFamily};
  line-height: ${(props) => props.theme.typography.h3.lineHeight};
  color: ${(props) => props.theme.palette.primary.main};
  margin-bottom: ${(props) => props.theme.spacing.base};
`;

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
