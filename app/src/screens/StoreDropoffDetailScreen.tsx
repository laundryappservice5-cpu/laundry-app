import { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { OrderStageChip } from '../components/StatusChip';
import { ExpressBadge } from '../components/ExpressBadge';
import { ConfirmModal } from '../components/ConfirmModal';
import { Banner } from '../components/Banner';
import { EmptyState } from '../components/EmptyState';
import { useAdvanceOrderStatusMutation, useGetOrderByIdQuery } from '../api/orderApi';
import { getClothTypeIcon } from '../utils/clothTypeIcons';
import { COLORS } from '../utils/constants';
import { getName } from '../utils/formatters';
import type { RootStackParamList } from '../navigation/types';

type DetailRoute = RouteProp<RootStackParamList, 'StoreDropoffDetail'>;

export function StoreDropoffDetailScreen() {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id } = route.params;

  const { data: order, isLoading, isFetching, refetch } = useGetOrderByIdQuery(id);
  const [advanceStatus, { isLoading: isAdvancing }] = useAdvanceOrderStatusMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading || !order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const pickup = typeof order.pickup === 'string' ? undefined : order.pickup;
  const totalQty = pickup?.collectedItems.reduce((sum, i) => sum + i.quantity, 0) ?? undefined;
  const orderId = order._id;

  async function handleMarkDelivered() {
    await advanceStatus({ id: orderId, status: 'RECEIVED_AT_LAUNDRY', itemCount: totalQty });
    setConfirmOpen(false);
    navigation.goBack();
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.customerName}>{getName(order.customer)}</Text>
        <OrderStageChip stage={order.currentStatus} />
      </View>
      {(order.isExpressPickup || order.isExpressDelivery) && (
        <View style={{ marginBottom: 4 }}>
          <ExpressBadge />
        </View>
      )}

      <Banner variant="info" title="Drop this off at the store" subtitle="Hand the collected items to the laundry team, then mark it delivered below." />

      <View style={styles.card}>
        <Text style={styles.label}>Collected Items</Text>
        {pickup?.collectedItems.length ? (
          pickup.collectedItems.map((item, idx) => {
            const name = typeof item.clothType === 'string' ? item.clothType : item.clothType.name;
            const serviceName = typeof item.service === 'string' ? item.service : item.service.name;
            return (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemIcon}>{getClothTypeIcon(name)}</Text>
                <Text style={styles.itemName}>
                  {name} <Text style={styles.itemService}>· {serviceName}</Text>
                </Text>
                <Text style={styles.itemQty}>{item.quantity}</Text>
              </View>
            );
          })
        ) : (
          <EmptyState compact icon="🧺" title="No items recorded" />
        )}
        {pickup?.pickupRemarks && (
          <>
            <Text style={styles.label}>Pickup Remarks</Text>
            <Text style={styles.value}>{pickup.pickupRemarks}</Text>
          </>
        )}
      </View>

      <AnimatedPressable style={styles.primaryButton} onPress={() => setConfirmOpen(true)}>
        <Text style={styles.primaryButtonText}>Mark Delivered to Store</Text>
      </AnimatedPressable>

      <ConfirmModal
        visible={confirmOpen}
        title="Delivered to the store?"
        description="This confirms you've handed the collected items to the laundry team. Your job for this pickup ends here."
        confirmLabel="Mark Delivered"
        loading={isAdvancing}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleMarkDelivered}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  customerName: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginTop: 10, textTransform: 'uppercase' },
  value: { fontSize: 15, color: COLORS.textPrimary, marginTop: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  itemIcon: { fontSize: 20 },
  itemName: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  itemService: { fontSize: 12, fontWeight: '400', color: COLORS.textSecondary },
  itemQty: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  primaryButton: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
