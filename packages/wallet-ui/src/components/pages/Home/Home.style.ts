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
