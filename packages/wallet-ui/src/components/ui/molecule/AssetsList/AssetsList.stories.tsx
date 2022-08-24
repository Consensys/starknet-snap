import { Meta } from '@storybook/react';
import { AssetsListView } from './AssetsList.view';

export default {
  title: 'Molecule/AssetsList',
  component: AssetsListView,
} as Meta;

const wrapperStyle = {
  backgroundColor: 'white',
  height: '300px',
};

export const SmallWidth = () => {
  return (
    <div style={wrapperStyle}>
      <div style={{ width: '30%' }}>
        <AssetsListView />
      </div>
    </div>
  );
};
