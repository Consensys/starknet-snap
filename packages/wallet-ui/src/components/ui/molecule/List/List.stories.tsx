import { Meta } from '@storybook/react';
import { ListView } from './List.view';

export default {
  title: 'Molecule/List',
  component: ListView,
} as Meta;

export const Default = () => (
  <ListView
    data={[
      { name: 'France', lang: 'French' },
      { name: 'USA', lang: 'English' },
      { name: 'Germany', lang: 'German' },
    ]}
    keyExtractor={(item) => item.name}
    render={(item) => (
      <>
        <h3>{item.name}</h3>
        <p>{item.lang}</p>
      </>
    )}
    emptyView={<h3>Should not appear</h3>}
  />
);

export const EmptyView = () => (
  <ListView<string>
    keyExtractor={(text) => text.toString()}
    render={(text) => <p>{text.toString()}</p>}
    data={[]}
    emptyView={<h3>No items</h3>}
  />
);
