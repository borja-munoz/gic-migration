import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'app',
  initialState: {
    error: null,
    bottomSheetOpen: false,
    layerIsLoadingData: false,
  },
  reducers: {
    setError: (state, action) => {
      state.error = action.payload;
    },
    setBottomSheetOpen: (state, action) => {
      state.bottomSheetOpen = action.payload;
    },
    setLayerIsLoadingData: (state, action) => {
      state.layerIsLoadingData = action.payload;
    },
  },
});

export default slice.reducer;

export const setError = (payload) => ({ type: 'app/setError', payload });
export const setBottomSheetOpen = (payload) => ({
  type: 'app/setBottomSheetOpen',
  payload,
});
export const setLayerIsLoadingData = (payload) => ({
  type: 'app/setLayerIsLoadingData',
  payload,
});
