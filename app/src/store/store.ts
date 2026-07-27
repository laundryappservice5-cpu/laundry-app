import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';
import authReducer from '../features/auth/authSlice';
import { setAccessTokenForClient } from '../utils/tokenStore';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
});

store.subscribe(() => {
  setAccessTokenForClient(store.getState().auth.accessToken);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
