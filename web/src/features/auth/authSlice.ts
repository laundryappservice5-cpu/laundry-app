import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PublicUser } from '../../types';

interface AuthState {
  user: PublicUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isInitializing: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: localStorage.getItem('refreshToken'),
  isInitializing: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{ user: PublicUser; accessToken: string; refreshToken: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('refreshToken', action.payload.refreshToken);
    },
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
    setUser(state, action: PayloadAction<PublicUser>) {
      state.user = action.payload;
    },
    finishInitializing(state) {
      state.isInitializing = false;
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isInitializing = false;
      localStorage.removeItem('refreshToken');
    },
  },
});

export const { setSession, setAccessToken, setUser, finishInitializing, logout } = authSlice.actions;
export default authSlice.reducer;
