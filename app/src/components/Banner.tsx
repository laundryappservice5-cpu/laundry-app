import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../utils/constants';

type BannerVariant = 'info' | 'warning' | 'success' | 'error' | 'express';

interface BannerProps {
  variant?: BannerVariant;
  icon?: string;
  title: string;
  subtitle?: string;
}

const VARIANT_COLORS: Record<BannerVariant, string> = {
  info: COLORS.primary,
  warning: COLORS.warning,
  success: COLORS.success,
  error: COLORS.error,
  express: COLORS.warning,
};

const DEFAULT_ICONS: Record<BannerVariant, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  success: '✅',
  error: '⛔',
  express: '⚡',
};

export function Banner({ variant = 'info', icon, title, subtitle }: BannerProps) {
  const color = VARIANT_COLORS[variant];

  return (
    <View style={[styles.container, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
      <Text style={styles.icon}>{icon ?? DEFAULT_ICONS[variant]}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color }]}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  icon: { fontSize: 18 },
  title: { fontSize: 14, fontWeight: '700' },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
