import { HTMLAttributes, ReactNode } from 'react';
import { CSSProperties } from 'styled-components';
import { List, ListItem, Wrapper } from './List.style';

export interface IListProps<T> extends HTMLAttributes<HTMLElement> {
  data: T[];
  render: (val: T, index: number) => ReactNode | string;
  keyExtractor: (val: T, index: number) => string;
  emptyView?: ReactNode;
  listStyle?: CSSProperties;
}

export const ListView = <T extends unknown>({
  data,
  render,
  keyExtractor,
  emptyView,
  listStyle,
  ...otherProps
}: IListProps<T>) => {
  return (
    <Wrapper {...otherProps}>
      {data.length > 0 ? (
        <List style={listStyle}>
          {data.map((item, index) => (
            <ListItem key={keyExtractor(item, index)}>{render(item, index)}</ListItem>
          ))}
        </List>
      ) : (
        emptyView
      )}
    </Wrapper>
  );
};
