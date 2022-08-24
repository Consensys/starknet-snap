import styled from 'styled-components';

export const Wrapper = styled.div`
  border: 1px solid ${(props) => props.theme.palette.grey.grey3};
  border-radius: 80px;
  width: 24px;
  height: 24px;
  box-sizing: border-box;
  justify-content: center;
  color: ${(props) => props.theme.palette.grey.grey1};
  align-items: center;
  display: flex;
`;
