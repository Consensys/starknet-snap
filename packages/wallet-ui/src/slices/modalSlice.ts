import { createSlice } from '@reduxjs/toolkit';

export interface modalState {
  infoModalVisible: boolean;
  minVersionModalVisible: boolean;
}

const initialState: modalState = {
  infoModalVisible: false,
  minVersionModalVisible: false,
};

export const modalSlice = createSlice({
  name: 'modal',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    setInfoModalVisible: (state, { payload }) => {
      state.infoModalVisible = payload;
    },
    setMinVersionModalVisible: (state, { payload }) => {
      state.minVersionModalVisible = payload;
    },
  },
});

export const { setInfoModalVisible, setMinVersionModalVisible } = modalSlice.actions;

export default modalSlice.reducer;
