import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChiState {
  value: number;
}

const initialState: ChiState = {
  value: 2,
};

const chiSlice = createSlice({
  name: 'chi',
  initialState,
  reducers: {
    setChi(state, action: PayloadAction<number>) {
      state.value = Math.max(0, Math.min(6, action.payload));
    },
    gainChi(state, action: PayloadAction<number>) {
      state.value = Math.min(6, state.value + action.payload);
    },
    spendChi(state, action: PayloadAction<number>) {
      state.value = Math.max(0, state.value - action.payload);
    },
    resetChi(state) {
      state.value = 2;
    },
  },
});

export const { setChi, gainChi, spendChi, resetChi } = chiSlice.actions;
export default chiSlice.reducer;
