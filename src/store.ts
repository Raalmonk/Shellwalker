import { configureStore } from '@reduxjs/toolkit';
import chiReducer from './store/chiSlice';

export const store = configureStore({
  reducer: {
    chi: chiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
