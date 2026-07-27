import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../utils/constants';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.background,
  },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
});
