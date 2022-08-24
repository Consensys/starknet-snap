import styled from 'styled-components';

export const Backdrop = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: ${(props) => props.theme.palette.grey.black};
  opacity: 0.5;
`;
