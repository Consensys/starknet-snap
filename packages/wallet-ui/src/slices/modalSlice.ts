import { createSlice } from '@reduxjs/toolkit';

export interface modalState {
  infoModalVisible: boolean;
  minVersionModalVisible: boolean;
  minMMVersionModalVisible: boolean;
  upgradeModalVisible: boolean;
  deployModalVisible: boolean;
  forceReconnectModalVisible: boolean;
}

const initialState: modalState = {
  infoModalVisible: false,
  minVersionModalVisible: false,
  minMMVersionModalVisible: false,
  upgradeModalVisible: false,
  deployModalVisible: false,
  forceReconnectModalVisible: false,
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
    setForceReconnectModalVisible: (state, { payload }) => {
      state.forceReconnectModalVisible = payload;
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
  setForceReconnectModalVisible,
} = modalSlice.actions;

export default modalSlice.reducer;
