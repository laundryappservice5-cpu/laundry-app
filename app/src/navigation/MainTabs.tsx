import { useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Animated, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { JobsScreen } from '../screens/JobsScreen';
import { DeliveriesScreen } from '../screens/DeliveriesScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { COLORS } from '../utils/constants';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Jobs: { active: 'cube', inactive: 'cube-outline' },
  Deliveries: { active: 'bicycle', inactive: 'bicycle-outline' },
  History: { active: 'time', inactive: 'time-outline' },
};

function TabIcon({ name, focused }: { name: keyof MainTabParamList; focused: boolean }) {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.85)).current;
  const pillScale = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: focused ? 1 : 0.85, useNativeDriver: true, speed: 30, bounciness: 10 }).start();
    Animated.spring(pillScale, { toValue: focused ? 1 : 0, useNativeDriver: true, speed: 24, bounciness: 8 }).start();
  }, [focused, scale, pillScale]);

  const icon = ICONS[name];

  return (
    <Animated.View style={[styles.iconWrap, { transform: [{ scale }] }]}>
      <Animated.View style={[styles.pill, { transform: [{ scale: pillScale }] }]} />
      <Ionicons
        name={focused ? icon.active : icon.inactive}
        size={22}
        color={focused ? COLORS.primary : COLORS.textSecondary}
      />
    </Animated.View>
  );
}

export function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 56 + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom + 6,
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } },
            android: { elevation: 8 },
          }),
        },
        tabBarIcon: ({ focused }) => <TabIcon name={route.name as keyof MainTabParamList} focused={focused} />,
      })}
    >
      <Tab.Screen name="Jobs" component={JobsScreen} />
      <Tab.Screen name="Deliveries" component={DeliveriesScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: { width: 44, height: 32, alignItems: 'center', justifyContent: 'center' },
  pill: {
    position: 'absolute',
    width: 44,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.primary}18`,
  },
});
