import { Pressable, StyleSheet, Text, View } from 'react-native';
import { OrderStageChip } from './StatusChip';
import { ExpressBadge } from './ExpressBadge';
import { COLORS } from '../utils/constants';
import { formatDateTime, getName } from '../utils/formatters';
import type { Order } from '../types';

export function DeliveryCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const isExpress = order.isExpressPickup || order.isExpressDelivery;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, isExpress && styles.cardExpress, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.headerRow}>
        <Text style={styles.customerName}>{getName(order.customer)}</Text>
        <OrderStageChip stage={order.currentStatus} />
      </View>
      <Text style={styles.meta}>{formatDateTime(order.createdAt)}</Text>
      {isExpress && (
        <View style={{ marginTop: 8 }}>
          <ExpressBadge />
        </View>
      )}
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
  meta: { fontSize: 13, color: COLORS.textSecondary },
});
