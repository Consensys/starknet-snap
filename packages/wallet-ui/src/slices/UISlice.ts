import { createSlice } from '@reduxjs/toolkit';

export interface UIState {
  loader: {
    isLoading: boolean;
    loadingMessage: string;
  };
}

const initialState: UIState = {
  loader: {
    isLoading: false,
    loadingMessage: '',
  },
};

export const networkSlice = createSlice({
  name: 'UI',
  initialState,
  reducers: {
    enableLoadingWithMessage: (state, action) => {
      state.loader.isLoading = true;
      state.loader.loadingMessage = action.payload;
    },
    disableLoading: (state) => {
      state.loader.isLoading = false;
      state.loader.loadingMessage = '';
    },
  },
});

export const { enableLoadingWithMessage, disableLoading } = networkSlice.actions;

export default networkSlice.reducer;
