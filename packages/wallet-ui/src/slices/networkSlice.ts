import { createSlice } from '@reduxjs/toolkit';
import { Network } from 'types';

export interface NetworkState {
  items: Network[];
  activeNetwork: number;
}

const initialState: NetworkState = {
  items: [],
  activeNetwork: 0,
};

export const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setActiveNetwork: (state, action) => {
      state.activeNetwork = action.payload;
    },
    setNetworksAndActiveNetwork: (state, action) => {
      state.items = action.payload.networks;
      state.activeNetwork = action.payload.activeNetwork;
    },
    resetNetwork: () => {
      return {
        ...initialState,
      };
    },
  },
});

export const { setActiveNetwork, setNetworksAndActiveNetwork, resetNetwork } =
  networkSlice.actions;

export default networkSlice.reducer;
