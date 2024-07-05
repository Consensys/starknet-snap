import { createSlice } from '@reduxjs/toolkit';

export interface modalState {
  infoModalVisible: boolean;
  minVersionModalVisible: boolean;
  upgradeModalVisible: boolean;
  upgradeModalDeployText: boolean;
}

const initialState: modalState = {
  infoModalVisible: false,
  minVersionModalVisible: false,
  upgradeModalVisible: false,
  upgradeModalDeployText: false,
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
    setUpgradeModalDeployText: (state, { payload }) => {
      state.upgradeModalDeployText = payload;
    },
    setMinVersionModalVisible: (state, { payload }) => {
      state.minVersionModalVisible = payload;
    },
  },
});

export const { setInfoModalVisible, setMinVersionModalVisible, setUpgradeModalVisible, setUpgradeModalDeployText } =
  modalSlice.actions;

export default modalSlice.reducer;
