import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { COLORS } from '../utils/constants';

export function ExpressBadge({ label = 'Express' }: { label?: string }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View style={[styles.badge, { transform: [{ scale: pulse }] }]}>
      <Text style={styles.text}>⚡ {label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});
