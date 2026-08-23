import { useRef, type ReactNode } from 'react';
import { Animated, Platform, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

interface AnimatedPressableProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  haptic?: 'light' | 'medium' | 'heavy' | 'none';
}

export function AnimatedPressable({ onPress, style, children, haptic = 'light' }: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
    if (haptic !== 'none' && Platform.OS !== 'web') {
      const style =
        haptic === 'heavy'
          ? Haptics.ImpactFeedbackStyle.Heavy
          : haptic === 'medium'
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Light;
      Haptics.impactAsync(style).catch(() => {});
    }
  }

  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={[style, Platform.OS === 'web' && ({ height: 'fit-content' } as unknown as ViewStyle)]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
    </Pressable>
  );
}
