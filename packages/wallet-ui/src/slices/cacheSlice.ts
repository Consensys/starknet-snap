import { createSlice } from '@reduxjs/toolkit';

import { CacheContent } from 'types';

export type CachePayload = {
  key: string;
  data: unknown;
  expiredAt: number;
};

export interface CacheState {
  cacheData: Record<string, CacheContent<unknown>>;
}

const initialState: CacheState = {
  cacheData: {},
};

export const cacheSlice = createSlice({
  name: 'cache',
  initialState,
  reducers: {
    setCacheData: (
      state,
      {
        payload,
      }: {
        payload: CachePayload;
      },
    ) => {
      const { key, data, expiredAt } = payload;
      state.cacheData[key] = {
        data,
        expiredAt,
      };
    },
    clearCache: (
      state,
      {
        payload,
      }: {
        payload: {
          key: string;
        };
      },
    ) => {
      const { key } = payload;
      if (state.cacheData[key]) {
        delete state.cacheData[key];
      }
    },
  },
});

export const { setCacheData, clearCache } = cacheSlice.actions;

export default cacheSlice.reducer;
