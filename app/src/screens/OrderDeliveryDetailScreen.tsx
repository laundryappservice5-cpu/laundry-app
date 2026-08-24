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
import { COLORS } from '../utils/constants';
import { formatCurrency, getId, getName } from '../utils/formatters';
import { getMapsUrl } from '../utils/mapsLink';
import type { RootStackParamList } from '../navigation/types';
import type { Bill, PaymentLeg, PaymentMethod } from '../types';

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

  const [collectionOption, setCollectionOption] = useState<'CARD' | 'CASH' | 'PARTIAL' | null>(null);
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [startConfirmOpen, setStartConfirmOpen] = useState(false);
  const [deliverConfirmOpen, setDeliverConfirmOpen] = useState(false);
  const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false);
  const [isCompletingDelivery, setIsCompletingDelivery] = useState(false);

  if (isLoading || !order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const pickup = typeof order.pickup === 'string' ? undefined : order.pickup;
  const isPaid = !bill || bill.paymentStatus === 'PAID';
  const balanceDue = bill ? bill.finalAmount - (bill.amountPaid ?? 0) : 0;
  const orderId = order._id;
  const cash = Number(cashAmount) || 0;
  const card = Number(cardAmount) || 0;
  const partialTotal = cash + card;

  async function handleStartDelivery() {
    await advanceStatus({ id: orderId, status: 'OUT_FOR_DELIVERY' });
    setStartConfirmOpen(false);
  }

  async function completeDeliveryIfFullyPaid(updatedBill: Bill) {
    if (updatedBill.paymentStatus !== 'PAID') return;
    setIsCompletingDelivery(true);
    await advanceStatus({ id: orderId, status: 'DELIVERED' });
    navigation.goBack();
  }

  async function handleCollectFull(method: PaymentMethod) {
    if (!bill) return;
    setPaymentError(null);
    try {
      const result = await recordPayment({ id: bill._id, splits: [{ amount: balanceDue, method }] }).unwrap();
      setCollectionOption(null);
      await completeDeliveryIfFullyPaid(result.bill);
    } catch {
      setPaymentError('Could not record the payment. Please try again.');
    }
  }

  async function handleCollectPartial() {
    if (!bill || partialTotal <= 0) return;
    setPaymentError(null);
    const splits: PaymentLeg[] = [];
    if (cash > 0) splits.push({ amount: cash, method: 'CASH' });
    if (card > 0) splits.push({ amount: card, method: 'CARD' });
    try {
      const result = await recordPayment({ id: bill._id, splits }).unwrap();
      setCollectionOption(null);
      setCashAmount('');
      setCardAmount('');
      await completeDeliveryIfFullyPaid(result.bill);
    } catch {
      setPaymentError('Could not record the payment. Please try again.');
    }
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
        <Banner
          variant="warning"
          title="Payment pending"
          subtitle="Collect payment from the customer — the order marks itself Delivered once it's fully paid."
        />
      )}
      {paymentError && <Banner variant="error" title="Payment failed" subtitle={paymentError} />}

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
            {isPaid
              ? `Paid via ${bill.paymentMethod}`
              : bill.paymentStatus === 'PARTIAL'
                ? `Partially Paid via ${bill.paymentMethod} — ${formatCurrency(balanceDue)} due`
                : 'Payment Pending'}
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
          <Text style={[styles.totalValue, { marginTop: 4, marginBottom: 12 }]}>{formatCurrency(balanceDue)}</Text>

          <View style={{ gap: 8, marginBottom: collectionOption === 'PARTIAL' ? 12 : 0 }}>
            <Pressable
              style={[styles.optionButton, collectionOption === 'CARD' && styles.optionButtonActive]}
              onPress={() => setCollectionOption('CARD')}
            >
              <Text style={[styles.optionText, collectionOption === 'CARD' && styles.optionTextActive]}>💳 Card (Swipe Machine)</Text>
            </Pressable>
            <Pressable
              style={[styles.optionButton, collectionOption === 'CASH' && styles.optionButtonActive]}
              onPress={() => setCollectionOption('CASH')}
            >
              <Text style={[styles.optionText, collectionOption === 'CASH' && styles.optionTextActive]}>💵 Cash</Text>
            </Pressable>
            <Pressable
              style={[styles.optionButton, collectionOption === 'PARTIAL' && styles.optionButtonActive]}
              onPress={() => setCollectionOption('PARTIAL')}
            >
              <Text style={[styles.optionText, collectionOption === 'PARTIAL' && styles.optionTextActive]}>➗ Partial Payment</Text>
            </Pressable>
          </View>

          {collectionOption === 'PARTIAL' && (
            <View style={{ marginBottom: 12 }}>
              <Text style={[styles.value, { marginBottom: 8 }]}>
                Split what's collected now between cash and card — both get recorded.
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  value={cashAmount}
                  onChangeText={setCashAmount}
                  placeholder="Cash amount"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                  style={[styles.amountInput, { flex: 1 }]}
                />
                <TextInput
                  value={cardAmount}
                  onChangeText={setCardAmount}
                  placeholder="Card amount"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                  style={[styles.amountInput, { flex: 1 }]}
                />
              </View>
              {partialTotal > 0 && (
                <Text style={styles.value}>
                  Collecting now: {formatCurrency(partialTotal)}
                  {partialTotal < balanceDue ? ` — remaining balance: ${formatCurrency(balanceDue - partialTotal)}` : ''}
                </Text>
              )}
              {partialTotal > balanceDue && <Text style={{ color: COLORS.error, fontSize: 13 }}>Total exceeds the balance due.</Text>}
            </View>
          )}

          {collectionOption === 'PARTIAL' ? (
            <AnimatedPressable
              style={[
                styles.primaryButton,
                (partialTotal <= 0 || partialTotal > balanceDue || isRecordingPayment || isCompletingDelivery) &&
                  styles.primaryButtonDisabled,
              ]}
              onPress={() => setPaymentConfirmOpen(true)}
            >
              {isRecordingPayment || isCompletingDelivery ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Record {formatCurrency(partialTotal)}</Text>
              )}
            </AnimatedPressable>
          ) : (
            <AnimatedPressable
              style={[
                styles.primaryButton,
                (!collectionOption || isRecordingPayment || isCompletingDelivery) && styles.primaryButtonDisabled,
              ]}
              onPress={() => setPaymentConfirmOpen(true)}
            >
              {isRecordingPayment || isCompletingDelivery ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Collect {formatCurrency(balanceDue)}</Text>
              )}
            </AnimatedPressable>
          )}
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

      <ConfirmModal
        visible={paymentConfirmOpen}
        title={`Mark ${formatCurrency(collectionOption === 'PARTIAL' ? partialTotal : balanceDue)} as paid?`}
        description="This records the payment as collected and cannot be undone. Make sure you've actually received this amount from the customer before confirming."
        confirmLabel="Yes, Paid"
        loading={isRecordingPayment || isCompletingDelivery}
        onClose={() => setPaymentConfirmOpen(false)}
        onConfirm={async () => {
          if (collectionOption === 'PARTIAL') {
            await handleCollectPartial();
          } else if (collectionOption) {
            await handleCollectFull(collectionOption);
          }
          setPaymentConfirmOpen(false);
        }}
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
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  optionButton: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 14 },
  optionButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optionText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 15 },
  optionTextActive: { color: '#fff' },
  amountInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 10, marginBottom: 12, color: COLORS.textPrimary },
});
