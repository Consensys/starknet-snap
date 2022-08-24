import styled from 'styled-components';

interface IDiv {
  connected?: boolean;
  size?: number;
}

export const Wrapper = styled.div<IDiv>`
  width: fit-content;
  border: ${(props) => (props.connected ? '2px solid ' + props.theme.palette.secondary.main : 'none')};
  height: ${(props) => (props.size ? props.size + 'px' : '40px')};
  border-radius: 50px;
  padding: 2px;
  transform: translateX(-8px);
`;
