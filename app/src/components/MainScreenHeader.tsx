import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenHeader } from './ScreenHeader';
import { AnimatedPressable } from './AnimatedPressable';
import { ProfileSheet } from './ProfileSheet';
import { useAppSelector } from '../store/hooks';
import { COLORS } from '../utils/constants';

interface MainScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export function MainScreenHeader({ title, subtitle }: MainScreenHeaderProps) {
  const user = useAppSelector((state) => state.auth.user);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <ScreenHeader
        title={title}
        subtitle={subtitle}
        right={
          <AnimatedPressable style={styles.avatar} onPress={() => setProfileOpen(true)} haptic="light">
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
          </AnimatedPressable>
        }
      />
      <ProfileSheet visible={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.secondary, fontSize: 16, fontWeight: '700' },
});
