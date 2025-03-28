import styled from 'styled-components';

import { Button } from '../Button';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${(props) => props.theme.palette.grey.white};
  width: ${(props) => props.theme.modal.base};
  padding: ${(props) => props.theme.spacing.base};
  border-radius: ${(props) => props.theme.spacing.tiny2};
  align-items: center;
  overflow-wrap: break-word;
`;

export const Title = styled.div`
  text-align: center;
  font-weight: ${(props) => props.theme.typography.h3.fontWeight};
  font-size: ${(props) => props.theme.typography.h3.fontSize};
  font-family: ${(props) => props.theme.typography.h3.fontFamily};
  line-height: ${(props) => props.theme.typography.h3.lineHeight};
  margin-bottom: ${(props) => props.theme.spacing.base};
`;

export const Content = styled.div<{ align?: 'center' | 'left' | 'right' }>`
  font-size: ${(props) => props.theme.typography.p2.fontSize};
  color: ${(props) => props.theme.palette.primary.main};
  text-align: ${(props) => props.align ?? 'center'};
  margin-bottom: ${(props) => props.theme.spacing.base};
  overflow-wrap: break-word;
  width: 100%;
`;

export const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  align-content: center;
  width: 100%;
`;

export const StyledButton = styled(Button).attrs((props) => ({
  textStyle: {
    fontSize: props.theme.typography.p1.fontSize,
    fontWeight: 900,
  },
  upperCaseOnly: false,
  backgroundTransparent: true,
}))`
  box-shadow: 0px 14px 24px -6px rgba(106, 115, 125, 0.2);
  padding-top: ${(props) => props.theme.spacing.small};
  padding-bottom: ${(props) => props.theme.spacing.small};
`;
