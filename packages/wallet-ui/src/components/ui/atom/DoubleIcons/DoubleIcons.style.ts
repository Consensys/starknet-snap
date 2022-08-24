import styled from 'styled-components';

interface IDivProps {
  iconBackground: string;
  size?: string;
}

interface ICornerIcon {
  size?: string;
}

export const Wrapper = styled.div<IDivProps>`
  background: ${(props) =>
    props.iconBackground ? `url(${props.iconBackground})` : props.theme.palette.secondary.main};
  background-repeat: no-repeat;
  width: ${(props) => props.size};
  height: ${(props) => props.size};
  background-size: ${(props) => props.size} ${(props) => props.size};
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  border-radius: 100%;
  position: relative;
  span {
    border-radius: 100%;
    color: white;
    font-size: 10px;
    height: 100%;
    width: 100%;
    text-align: center;
    line-height: 24px;
  }
`;

export const CornerIcon = styled.img<ICornerIcon>`
  width: ${(props) => props.size};
  height: ${(props) => props.size};
  position: absolute;
`;

export const IconPlaceHolder = styled.span``;
