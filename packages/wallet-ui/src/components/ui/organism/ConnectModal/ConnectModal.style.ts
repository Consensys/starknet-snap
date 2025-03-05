import styled from 'styled-components';

export const Description = styled.div`
  font-size: ${(props) => props.theme.typography.p2.fontSize};
  color: ${(props) => props.theme.palette.grey.grey1};
`;

export const WhatIsSnapDiv = styled.div`
  margin-top: ${(props) => props.theme.spacing.base};
  margin-left: -${(props) => props.theme.spacing.base};
  padding: ${(props) => props.theme.spacing.base};
  background-color: ${(props) => props.theme.palette.grey.grey4};
  align-items: center;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const WhatIsSnap = styled.div`
  font-size: ${(props) => props.theme.typography.h4.fontSize};
  font-weight: ${(props) => props.theme.typography.h4.fontWeight};
  font-family: ${(props) => props.theme.typography.h4.fontFamily};
  margin-bottom: ${(props) => props.theme.spacing.tiny2};
`;

export const ReadMore = styled.div`
  margin-top: ${(props) => props.theme.spacing.tiny2};
  font-size: ${(props) => props.theme.typography.p2.fontSize};
  font-weight: ${(props) => props.theme.typography.bold.fontWeight};
  font-family: ${(props) => props.theme.typography.bold.fontFamily};
  cursor: pointer;
`;
