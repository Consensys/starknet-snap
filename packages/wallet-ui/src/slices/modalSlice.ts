import { createSlice } from '@reduxjs/toolkit';

export interface modalState {
  infoModalVisible: boolean;
  minVersionModalVisible: boolean;
  minMMVersionModalVisible: boolean;
  upgradeModalVisible: boolean;
  deployModalVisible: boolean;
}

const initialState: modalState = {
  infoModalVisible: false,
  minVersionModalVisible: false,
  minMMVersionModalVisible: false,
  upgradeModalVisible: false,
  deployModalVisible: false,
};

export const modalSlice = createSlice({
  name: 'modal',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    setInfoModalVisible: (state, { payload }) => {
      state.infoModalVisible = payload;
    },
    setUpgradeModalVisible: (state, { payload }) => {
      state.upgradeModalVisible = payload;
    },
    setDeployModalVisible: (state, { payload }) => {
      state.deployModalVisible = payload;
    },
    setMinVersionModalVisible: (state, { payload }) => {
      state.minVersionModalVisible = payload;
    },
    setMinMMVersionModalVisible: (state, { payload }) => {
      state.minMMVersionModalVisible = payload;
    },
  },
});

export const {
  setInfoModalVisible,
  setMinVersionModalVisible,
  setUpgradeModalVisible,
  setDeployModalVisible,
  setMinMMVersionModalVisible,
} = modalSlice.actions;

export default modalSlice.reducer;
