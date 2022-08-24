import styled from 'styled-components';
import { Menu } from 'components/ui/organism/Menu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const Wrapper = styled.div`
  background-color: ${(props) => props.theme.palette.grey.grey4};
  position: absolute;
  top: 0px;
  right: 0px;
  bottom: 0px;
  left: 0px;
`;

export const ColMiddle = styled.div`
  width: 1040px;
  margin: auto;

  @media (max-width: 1024px) {
    width: 896px;
  }
`;

export const MenuStyled = styled(Menu)`
  margin-left: 18px;
  margin-right: 18px;
`;

export const Content = styled.div`
  box-shadow: 0px 50px 70px -28px rgba(106, 115, 125, 0.2);
  border-radius: ${(props) => props.theme.corner.small};
  overflow: hidden;
`;

export const Banner = styled.div`
  position: fixed;
  left: 0px;
  bottom: 0px;
  width: 100%;
  background-color: ${(props) => props.theme.palette.primary.main};
  color: ${(props) => props.theme.palette.grey.grey3};
  display: flex;
  align-items: center;
  padding: 13px 24px;
  justify-content: space-between;
`;

export const CloseIcon = styled(FontAwesomeIcon)`
  font-size: ${(props) => props.theme.typography.i3.fontSize};
  color: ${(props) => props.theme.palette.grey.white};
  margin-right: 48px;
  cursor: pointer;
`;
