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
      state.value = Math.min(6, Math.max(0, action.payload));
    },
    gainChi(state, action: PayloadAction<number>) {
      state.value = Math.min(6, state.value + action.payload);
    },
    spendChi(state, action: PayloadAction<number>) {
      state.value = Math.max(0, state.value - action.payload);
    },
  },
});

export const { setChi, gainChi, spendChi } = chiSlice.actions;
export default chiSlice.reducer;
