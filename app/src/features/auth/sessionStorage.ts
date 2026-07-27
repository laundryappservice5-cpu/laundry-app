import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveRefreshToken = (token: string): Promise<void> => AsyncStorage.setItem('refreshToken', token);

export const clearRefreshToken = (): Promise<void> => AsyncStorage.removeItem('refreshToken');
