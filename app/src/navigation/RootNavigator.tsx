import { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { PickupDetailScreen } from '../screens/PickupDetailScreen';
import { OrderDeliveryDetailScreen } from '../screens/OrderDeliveryDetailScreen';
import { StoreDropoffDetailScreen } from '../screens/StoreDropoffDetailScreen';
import { MainTabs } from './MainTabs';
import { useAppSelector } from '../store/hooks';
import { useGetSettingsQuery } from '../api/settingsApi';
import { setCurrency } from '../utils/currencyStore';
import { COLORS } from '../utils/constants';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const user = useAppSelector((state) => state.auth.user);
  const { data: settings } = useGetSettingsQuery(undefined, { skip: !user });

  useEffect(() => {
    if (settings?.currency) setCurrency(settings.currency);
  }, [settings?.currency]);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.textPrimary,
      }}
    >
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="PickupDetail" component={PickupDetailScreen} options={{ title: 'Pickup' }} />
          <Stack.Screen name="OrderDeliveryDetail" component={OrderDeliveryDetailScreen} options={{ title: 'Delivery' }} />
          <Stack.Screen name="StoreDropoffDetail" component={StoreDropoffDetailScreen} options={{ title: 'Deliver to Store' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
