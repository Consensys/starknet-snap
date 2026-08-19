import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  min-height: 609px;

  @media (max-height: 768px) {
    max-height: 609px;
  }

  max-height: 79vh;
`;

export const RightPart = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: ${(props) => props.theme.palette.grey.white};
`;

export const NoTransactions = styled.p`
  ${(props) => props.theme.typography.p1};
  text-align: center;
  color: ${(props) => props.theme.palette.grey.grey1};
`;

export const DeprecationBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 24px;
  padding: 16px;
  border-radius: 8px;
  background-color: ${(props) => props.theme.palette.warning.light};
  color: ${(props) => props.theme.palette.warning.dark};
`;

export const DeprecationTitle = styled.h2`
  ${(props) => props.theme.typography.h4};
  margin: 0;
`;

export const DeprecationBody = styled.p`
  ${(props) => props.theme.typography.p2};
  margin: 0;
`;

export const DeprecationLink = styled.a`
  color: ${(props) => props.theme.palette.info.dark};
  text-decoration: underline;
`;
