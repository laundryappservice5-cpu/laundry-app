import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../utils/constants';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  compact?: boolean;
}

export function EmptyState({ icon = '🧺', title, subtitle, compact = false }: EmptyStateProps) {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={[styles.iconCircle, compact && styles.iconCircleCompact]}>
        <Text style={[styles.icon, compact && styles.iconCompact]}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  containerCompact: { paddingVertical: 24, paddingHorizontal: 24 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconCircleCompact: { width: 52, height: 52, borderRadius: 26, marginBottom: 10 },
  icon: { fontSize: 32 },
  iconCompact: { fontSize: 22 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 18 },
});
