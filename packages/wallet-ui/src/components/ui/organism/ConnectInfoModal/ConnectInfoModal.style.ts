import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${(props) => props.theme.palette.grey.white};
  width: ${(props) => props.theme.modal.base};
  padding: ${(props) => props.theme.spacing.base};
  padding-top: ${(props) => props.theme.spacing.small};
  padding-bottom: ${(props) => props.theme.spacing.small};
  border-radius: 8px 8px 0px 0px;
  gap: ${(props) => props.theme.spacing.small};
  overflow-wrap: break-word;
`;

export const Bold = styled.div`
  font-size: ${(props) => props.theme.typography.p1.fontSize};
  font-weight: ${(props) => props.theme.typography.bold.fontWeight};
  font-family: ${(props) => props.theme.typography.bold.fontFamily};
`;

export const Normal = styled.div`
  font-size: ${(props) => props.theme.typography.p2.fontSize};
`;

export const ButtonDiv = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 24px;
  box-shadow: inset 0px 1px 0px rgba(212, 212, 225, 0.4);
  width: ${(props) => props.theme.modal.noPadding};
  background-color: ${(props) => props.theme.palette.grey.white};
  border-radius: 0px 0px 8px 8px;
  padding-bottom: ${(props) => props.theme.spacing.base};
`;
