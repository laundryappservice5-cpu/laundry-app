import { useState } from 'react';
import { ActivityIndicator, Linking, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { PickupStatusChip } from '../components/StatusChip';
import { ExpressBadge } from '../components/ExpressBadge';
import { ConfirmModal } from '../components/ConfirmModal';
import { Banner } from '../components/Banner';
import { FadeSlideIn } from '../components/FadeSlideIn';
import { CollectedItemsEditor } from '../components/CollectedItemsEditor';
import { ImagePickerGrid } from '../components/ImagePickerGrid';
import { useAcceptPickupMutation, useCompletePickupMutation, useGetPickupByIdQuery, useSelfAssignPickupMutation } from '../api/pickupApi';
import { useListClothTypesQuery, useListServicesQuery } from '../api/catalogApi';
import { COLORS } from '../utils/constants';
import { formatDate, formatCurrency, getName } from '../utils/formatters';
import { getMapsUrl } from '../utils/mapsLink';
import type { RootStackParamList } from '../navigation/types';

type PickupDetailRoute = RouteProp<RootStackParamList, 'PickupDetail'>;

export function PickupDetailScreen() {
  const route = useRoute<PickupDetailRoute>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id } = route.params;

  const { data: pickup, isLoading, isFetching, refetch } = useGetPickupByIdQuery(id);
  const [acceptPickup, { isLoading: isAccepting }] = useAcceptPickupMutation();
  const [selfAssignPickup, { isLoading: isClaiming }] = useSelfAssignPickupMutation();
  const [completePickup, { isLoading: isCompleting }] = useCompletePickupMutation();
  const { data: clothTypes = [] } = useListClothTypesQuery();
  const { data: services = [] } = useListServicesQuery();

  const [items, setItems] = useState<{ clothType: string; service: string; quantity: number }[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [pickupRemarks, setPickupRemarks] = useState('');
  const [damagedItemNotes, setDamagedItemNotes] = useState('');
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [acceptConfirmOpen, setAcceptConfirmOpen] = useState(false);

  if (isLoading || !pickup) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const pickupId = pickup._id;
  const isUnassigned = pickup.status === 'CREATED';

  async function handleAccept() {
    if (isUnassigned) {
      await selfAssignPickup(pickupId);
    } else {
      await acceptPickup(pickupId);
    }
    setAcceptConfirmOpen(false);
  }

  async function handleComplete() {
    await completePickup({
      id: pickupId,
      items,
      images,
      pickupRemarks: pickupRemarks || undefined,
      damagedItemNotes: damagedItemNotes || undefined,
    });
    setCompleteConfirmOpen(false);
    navigation.goBack();
  }

  const canEditItems = pickup.status === 'ACCEPTED' || pickup.status === 'DRIVER_ASSIGNED';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.customerName}>{getName(pickup.customer)}</Text>
        <PickupStatusChip status={pickup.status} />
      </View>
      {(pickup.isExpressPickup || pickup.isExpressDelivery) && (
        <View style={{ marginBottom: 4 }}>
          <ExpressBadge />
        </View>
      )}

      {(pickup.isExpressPickup || pickup.isExpressDelivery) && (
        <Banner
          variant="express"
          title="Express job — prioritize this pickup"
          subtitle="The customer has requested faster turnaround. Collect and drop off as soon as you can."
        />
      )}

      {isUnassigned && (
        <Banner variant="info" title="Unclaimed pickup" subtitle="Claim it below to take responsibility for this collection." />
      )}

      <View style={styles.card}>
        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>{typeof pickup.customer === 'string' ? '—' : pickup.customer.mobileNumber}</Text>

        <Text style={styles.label}>Address</Text>
        <Text style={styles.value}>
          {pickup.pickupAddress.address}
          {pickup.pickupAddress.area ? `, ${pickup.pickupAddress.area}` : ''}
        </Text>

        <Text style={styles.label}>Pickup Time</Text>
        <Text style={styles.value}>
          {formatDate(pickup.pickupDate)} · {pickup.pickupTime}
        </Text>

        {pickup.specialInstructions && (
          <>
            <Text style={styles.label}>Instructions</Text>
            <Text style={styles.value}>{pickup.specialInstructions}</Text>
          </>
        )}

        <AnimatedPressable
          style={styles.navigateButton}
          onPress={() => Linking.openURL(getMapsUrl(pickup.pickupAddress.address, pickup.pickupAddress.geo))}
        >
          <Text style={styles.navigateText}>🧭 Navigate</Text>
        </AnimatedPressable>
      </View>

      {(pickup.status === 'DRIVER_ASSIGNED' || pickup.status === 'CREATED') && (
        <AnimatedPressable style={styles.primaryButton} onPress={() => setAcceptConfirmOpen(true)}>
          <Text style={styles.primaryButtonText}>{pickup.status === 'CREATED' ? 'Claim Pickup' : 'Accept Pickup'}</Text>
        </AnimatedPressable>
      )}

      {canEditItems && (
        <View style={styles.card}>
          <CollectedItemsEditor items={pickup.collectedItems} onChange={setItems} />
        </View>
      )}

      {canEditItems && (
        <View style={styles.card}>
          <Text style={styles.label}>Photos</Text>
          <ImagePickerGrid images={images} onChange={setImages} />
        </View>
      )}

      {canEditItems && (
        <View style={styles.card}>
          <Text style={styles.label}>Pickup Remarks</Text>
          <TextInput
            value={pickupRemarks}
            onChangeText={setPickupRemarks}
            style={styles.textArea}
            placeholder="Any notes about this pickup…"
            placeholderTextColor={COLORS.textSecondary}
            multiline
          />
          <Text style={styles.label}>Damaged Items / Special Care</Text>
          <TextInput
            value={damagedItemNotes}
            onChangeText={setDamagedItemNotes}
            style={styles.textArea}
            placeholder="Flag any damage or special handling…"
            placeholderTextColor={COLORS.textSecondary}
            multiline
          />
        </View>
      )}

      {pickup.status === 'ACCEPTED' && (
        <AnimatedPressable
          style={[styles.primaryButton, items.length === 0 && styles.disabledButton]}
          onPress={() => items.length > 0 && setCompleteConfirmOpen(true)}
        >
          <Text style={styles.primaryButtonText}>Pickup Completed</Text>
        </AnimatedPressable>
      )}

      <ConfirmModal
        visible={acceptConfirmOpen}
        title={pickup.status === 'CREATED' ? 'Claim this pickup?' : 'Accept this pickup?'}
        description="You'll be responsible for collecting the laundry from this address."
        confirmLabel={pickup.status === 'CREATED' ? 'Claim' : 'Accept'}
        loading={isAccepting || isClaiming}
        onClose={() => setAcceptConfirmOpen(false)}
        onConfirm={handleAccept}
      />

      <ConfirmModal
        visible={completeConfirmOpen}
        title={`Confirm ${items.reduce((sum, i) => sum + i.quantity, 0)} item${items.reduce((sum, i) => sum + i.quantity, 0) === 1 ? '' : 's'}`}
        description="This sends the items to the laundry team and cannot be undone."
        confirmLabel="Complete"
        loading={isCompleting}
        onClose={() => setCompleteConfirmOpen(false)}
        onConfirm={handleComplete}
      >
        <View style={styles.confirmItemList}>
          {items.map((item, idx) => {
            const clothType = clothTypes.find((c) => c._id === item.clothType);
            const service = services.find((s) => s._id === item.service);
            const price = clothType?.prices?.[item.service];
            return (
              <View key={idx} style={styles.confirmItemRow}>
                <Text style={styles.confirmItemText}>
                  {clothType?.name ?? 'Item'} · {service?.name ?? ''} × {item.quantity}
                </Text>
                {price !== undefined && <Text style={styles.confirmItemPrice}>{formatCurrency(price * item.quantity)}</Text>}
              </View>
            );
          })}
        </View>
      </ConfirmModal>
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
  navigateButton: { marginTop: 16, backgroundColor: `${COLORS.primary}15`, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  navigateText: { color: COLORS.primary, fontWeight: '700' },
  primaryButton: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  disabledButton: { opacity: 0.5 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    minHeight: 60,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
  },
  confirmItemList: { marginBottom: 12, maxHeight: 220 },
  confirmItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  confirmItemText: { fontSize: 13, color: COLORS.textPrimary, flexShrink: 1, marginRight: 8 },
  confirmItemPrice: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
});
