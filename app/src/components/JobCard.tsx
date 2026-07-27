import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PickupStatusChip } from './StatusChip';
import { ExpressBadge } from './ExpressBadge';
import { COLORS } from '../utils/constants';
import { formatDate, getName } from '../utils/formatters';
import type { Pickup } from '../types';

export function JobCard({ pickup, onPress }: { pickup: Pickup; onPress: () => void }) {
  const isExpress = pickup.isExpressPickup || pickup.isExpressDelivery;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, isExpress && styles.cardExpress, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.headerRow}>
        <Text style={styles.customerName}>{getName(pickup.customer)}</Text>
        <PickupStatusChip status={pickup.status} />
      </View>
      <Text style={styles.address} numberOfLines={2}>
        {pickup.pickupAddress.address}
        {pickup.pickupAddress.area ? `, ${pickup.pickupAddress.area}` : ''}
      </Text>
      <View style={styles.footerRow}>
        <Text style={styles.meta}>
          {formatDate(pickup.pickupDate)} · {pickup.pickupTime}
        </Text>
        {isExpress && <ExpressBadge />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardExpress: { borderLeftWidth: 4, borderLeftColor: COLORS.warning },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  customerName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  address: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 10 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { fontSize: 13, color: COLORS.textSecondary },
});
