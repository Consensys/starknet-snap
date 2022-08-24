import styled from 'styled-components';

export type Size = 'normal' | 'medium' | 'big';

interface IWrapper {
  centered?: boolean;
}

interface ISize {
  size?: Size;
}

export const Wrapper = styled.div<IWrapper>`
  display: flex;
  flex-direction: column;
  text-align: ${(props) => (props.centered ? 'center' : 'inherit')};
`;

export const Currency = styled.span<ISize>`
  font-size: ${(props) =>
    props.size === 'normal'
      ? props.theme.typography.p1.fontSize
      : props.size === 'medium'
      ? props.theme.typography.h2.fontSize
      : props.theme.typography.h1.fontSize};
  line-height: ${(props) =>
    props.size === 'normal'
      ? props.theme.typography.p1.lineHeight
      : props.size === 'medium'
      ? props.theme.typography.h2.lineHeight
      : props.theme.typography.h1.lineHeight};
  font-weight: ${(props) => props.theme.typography.h1.fontWeight};
  font-family: ${(props) => props.theme.typography.h1.fontFamily};
`;

export const Dollars = styled.span<ISize>`
  font-size: ${(props) =>
    props.size === 'normal'
      ? props.theme.typography.p2.fontSize
      : props.size === 'medium'
      ? props.theme.typography.p1.fontSize
      : props.theme.typography.h4.fontSize};
  line-height: ${(props) =>
    props.size === 'normal'
      ? props.theme.typography.p2.lineHeight
      : props.size === 'medium'
      ? props.theme.typography.p1.lineHeight
      : props.theme.typography.h4.lineHeight};
  color: ${(props) => props.theme.palette.grey.grey1};
`;
