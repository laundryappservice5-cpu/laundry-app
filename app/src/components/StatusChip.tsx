import { StyleSheet, Text, View } from 'react-native';
import { ORDER_STAGE_LABELS, PICKUP_STATUS_LABELS, COLORS } from '../utils/constants';
import type { OrderStage, PickupStatus } from '../types';

const PICKUP_COLORS: Record<PickupStatus, string> = {
  CREATED: '#9CA3AF',
  DRIVER_ASSIGNED: '#3B82F6',
  ACCEPTED: COLORS.warning,
  PICKED_UP: COLORS.success,
  CANCELLED: COLORS.error,
};

const ORDER_COLORS: Record<OrderStage, string> = {
  PICKUP_CREATED: '#9CA3AF',
  DRIVER_ASSIGNED: '#3B82F6',
  PICKED_UP: '#3B82F6',
  RECEIVED_AT_LAUNDRY: COLORS.warning,
  READY_FOR_DELIVERY: COLORS.success,
  OUT_FOR_DELIVERY: COLORS.success,
  DELIVERED: COLORS.success,
};

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: `${color}22` }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

export function PickupStatusChip({ status }: { status: PickupStatus }) {
  return <Chip label={PICKUP_STATUS_LABELS[status]} color={PICKUP_COLORS[status]} />;
}

export function OrderStageChip({ stage }: { stage: OrderStage }) {
  return <Chip label={ORDER_STAGE_LABELS[stage]} color={ORDER_COLORS[stage]} />;
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
