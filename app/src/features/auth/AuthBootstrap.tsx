import { useEffect, type ReactNode } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setAccessToken, setUser, finishInitializing, logout } from './authSlice';
import { setAccessTokenForClient } from '../../utils/tokenStore';
import { registerAuthHandlers } from '../../utils/axiosClient';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const isInitializing = useAppSelector((state) => state.auth.isInitializing);

  useEffect(() => {
    registerAuthHandlers({
      onUnauthorized: () => dispatch(logout()),
      onTokenRefreshed: (accessToken) => dispatch(setAccessToken(accessToken)),
    });

    async function bootstrap() {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        dispatch(finishInitializing());
        return;
      }
      try {
        const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const accessToken = refreshRes.data.data.accessToken as string;
        setAccessTokenForClient(accessToken);
        dispatch(setAccessToken(accessToken));

        const meRes = await axios.get(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
        dispatch(setUser(meRes.data.data));
      } catch {
        await AsyncStorage.removeItem('refreshToken');
        dispatch(logout());
      } finally {
        dispatch(finishInitializing());
      }
    }

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}
