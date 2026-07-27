import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { OrderStageChip } from '../components/StatusChip';
import { ExpressBadge } from '../components/ExpressBadge';
import { ConfirmModal } from '../components/ConfirmModal';
import { Banner } from '../components/Banner';
import { useAdvanceOrderStatusMutation, useGetOrderByIdQuery } from '../api/orderApi';
import { useGetBillByIdQuery, useRecordPaymentMutation } from '../api/billApi';
import { COLORS, PAYMENT_METHODS } from '../utils/constants';
import { formatCurrency, getId, getName } from '../utils/formatters';
import { getMapsUrl } from '../utils/mapsLink';
import type { RootStackParamList } from '../navigation/types';
import type { PaymentMethod } from '../types';

type DetailRoute = RouteProp<RootStackParamList, 'OrderDeliveryDetail'>;

export function OrderDeliveryDetailScreen() {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id } = route.params;

  const { data: order, isLoading, isFetching: isFetchingOrder, refetch: refetchOrder } = useGetOrderByIdQuery(id);
  const billId = order ? getId(order.bill) : undefined;
  const { data: bill, isFetching: isFetchingBill, refetch: refetchBill } = useGetBillByIdQuery(billId!, { skip: !billId });
  const [advanceStatus, { isLoading: isAdvancing }] = useAdvanceOrderStatusMutation();
  const [recordPayment, { isLoading: isRecordingPayment }] = useRecordPaymentMutation();

  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [amount, setAmount] = useState('');
  const [startConfirmOpen, setStartConfirmOpen] = useState(false);
  const [deliverConfirmOpen, setDeliverConfirmOpen] = useState(false);

  if (isLoading || !order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const pickup = typeof order.pickup === 'string' ? undefined : order.pickup;
  const isPaid = !bill || bill.paymentStatus === 'PAID';
  const orderId = order._id;

  async function handleStartDelivery() {
    await advanceStatus({ id: orderId, status: 'OUT_FOR_DELIVERY' });
    setStartConfirmOpen(false);
  }

  async function handleCollectPayment() {
    if (!bill) return;
    await recordPayment({ id: bill._id, amount: Number(amount || bill.finalAmount), method });
  }

  async function handleMarkDelivered() {
    await advanceStatus({ id: orderId, status: 'DELIVERED' });
    setDeliverConfirmOpen(false);
    navigation.goBack();
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={isFetchingOrder || isFetchingBill}
          onRefresh={() => {
            refetchOrder();
            if (billId) refetchBill();
          }}
        />
      }
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
      {(order.isExpressPickup || order.isExpressDelivery) && (
        <Banner
          variant="express"
          title="Express delivery — prioritize this drop-off"
          subtitle="The customer is expecting this sooner than usual."
        />
      )}

      {order.currentStatus === 'OUT_FOR_DELIVERY' && !isPaid && bill && (
        <Banner variant="warning" title="Payment pending" subtitle="Collect payment from the customer before marking this delivered." />
      )}

      {pickup && (
        <View style={styles.card}>
          <Text style={styles.label}>Delivery Address</Text>
          <Text style={styles.value}>
            {pickup.pickupAddress.address}
            {pickup.pickupAddress.area ? `, ${pickup.pickupAddress.area}` : ''}
          </Text>
          <AnimatedPressable
            style={styles.navigateButton}
            onPress={() => Linking.openURL(getMapsUrl(pickup.pickupAddress.address, pickup.pickupAddress.geo))}
          >
            <Text style={styles.navigateText}>🧭 Navigate</Text>
          </AnimatedPressable>
        </View>
      )}

      {bill && (
        <View style={styles.card}>
          <Text style={styles.label}>Invoice</Text>
          <Text style={styles.value}>{bill.invoiceNumber}</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Due</Text>
            <Text style={styles.totalValue}>{formatCurrency(bill.finalAmount)}</Text>
          </View>
          <Text style={[styles.value, { color: isPaid ? COLORS.success : COLORS.error }]}>
            {isPaid ? `Paid via ${bill.paymentMethod}` : 'Payment Pending'}
          </Text>
        </View>
      )}

      {order.currentStatus === 'READY_FOR_DELIVERY' && (
        <AnimatedPressable style={styles.primaryButton} onPress={() => setStartConfirmOpen(true)}>
          <Text style={styles.primaryButtonText}>Start Delivery</Text>
        </AnimatedPressable>
      )}

      {order.currentStatus === 'OUT_FOR_DELIVERY' && !isPaid && bill && (
        <View style={styles.card}>
          <Text style={styles.label}>Collect Payment</Text>
          <View style={styles.methodRow}>
            {PAYMENT_METHODS.map((m) => (
              <Pressable key={m} style={[styles.methodChip, method === m && styles.methodChipActive]} onPress={() => setMethod(m)}>
                <Text style={[styles.methodText, method === m && styles.methodTextActive]}>{m}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder={String(bill.finalAmount)}
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="numeric"
            style={styles.amountInput}
          />
          <AnimatedPressable style={styles.primaryButton} onPress={handleCollectPayment}>
            {isRecordingPayment ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Record Payment</Text>}
          </AnimatedPressable>
        </View>
      )}

      {order.currentStatus === 'OUT_FOR_DELIVERY' && isPaid && (
        <AnimatedPressable style={styles.primaryButton} onPress={() => setDeliverConfirmOpen(true)}>
          <Text style={styles.primaryButtonText}>Mark Delivered</Text>
        </AnimatedPressable>
      )}

      <ConfirmModal
        visible={startConfirmOpen}
        title="Start this delivery?"
        description="The order will move to Out for Delivery."
        confirmLabel="Start"
        loading={isAdvancing}
        onClose={() => setStartConfirmOpen(false)}
        onConfirm={handleStartDelivery}
      />

      <ConfirmModal
        visible={deliverConfirmOpen}
        title="Mark as delivered?"
        description="This confirms the customer has received their order."
        confirmLabel="Mark Delivered"
        loading={isAdvancing}
        onClose={() => setDeliverConfirmOpen(false)}
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
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase' },
  value: { fontSize: 15, color: COLORS.textPrimary, marginTop: 2 },
  navigateButton: { marginTop: 12, backgroundColor: `${COLORS.primary}15`, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  navigateText: { color: COLORS.primary, fontWeight: '700' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  totalLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  totalValue: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  primaryButton: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  methodRow: { flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 12 },
  methodChip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  methodChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  methodText: { color: COLORS.textPrimary, fontWeight: '600' },
  methodTextActive: { color: '#fff' },
  amountInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 10, marginBottom: 12, color: COLORS.textPrimary },
});
