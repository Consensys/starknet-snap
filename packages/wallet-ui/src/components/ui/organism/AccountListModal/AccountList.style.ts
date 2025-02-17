import styled from 'styled-components';
import { Button } from 'components/ui/atom/Button';

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

export const ButtonDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0px 24px 24px 24px;
  width: ${(props) => props.theme.modal.base};
  background-color: ${(props) => props.theme.palette.grey.white};
  border-radius: 0px 0px 8px 8px;
  gap: 16px;
  box-shadow: inset 0px 1px 0px rgba(212, 212, 225, 0.4);
`;

export const ButtonStyled = styled(Button).attrs(() => ({
  backgroundTransparent: true,
  borderVisible: true,
}))`
  width: 240px;
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
