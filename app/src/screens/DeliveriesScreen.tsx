import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DeliveryCard } from '../components/DeliveryCard';
import { ConfirmModal } from '../components/ConfirmModal';
import { OrderStageChip } from '../components/StatusChip';
import { ExpressBadge } from '../components/ExpressBadge';
import { FadeSlideIn } from '../components/FadeSlideIn';
import { MainScreenHeader } from '../components/MainScreenHeader';
import { EmptyState } from '../components/EmptyState';
import { useMyDeliveryJobsQuery, useAvailableForDeliveryQuery, useSelfAssignDeliveryMutation } from '../api/orderApi';
import { COLORS } from '../utils/constants';
import { formatDateTime, getName } from '../utils/formatters';
import type { RootStackParamList } from '../navigation/types';
import type { Order } from '../types';

export function DeliveriesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { data: myDeliveries = [], isLoading, isFetching: isFetchingMine, refetch: refetchMine } = useMyDeliveryJobsQuery();
  const { data: available = [], isFetching: isFetchingAvailable, refetch: refetchAvailable } = useAvailableForDeliveryQuery();
  const [selfAssign, { isLoading: isClaiming }] = useSelfAssignDeliveryMutation();

  const [claimTarget, setClaimTarget] = useState<Order | null>(null);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const sections = [
    { title: 'My Deliveries', key: 'mine', data: myDeliveries },
    { title: 'Available for Delivery', key: 'available', data: available },
  ];

  async function handleClaim() {
    if (!claimTarget) return;
    await selfAssign(claimTarget._id);
    setClaimTarget(null);
  }

  return (
    <View style={styles.container}>
      <MainScreenHeader title="Deliveries" subtitle="Your delivery runs, and ones up for grabs" />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={isFetchingMine || isFetchingAvailable}
            onRefresh={() => {
              refetchMine();
              refetchAvailable();
            }}
          />
        }
        renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
        renderItem={({ item, index, section }) => {
          const delay = Math.min(index, 6) * 40;

          if (section.key === 'mine') {
            return (
              <FadeSlideIn delay={delay}>
                <DeliveryCard order={item} onPress={() => navigation.navigate('OrderDeliveryDetail', { id: item._id })} />
              </FadeSlideIn>
            );
          }
          const isExpress = item.isExpressPickup || item.isExpressDelivery;
          return (
            <FadeSlideIn delay={delay}>
              <Pressable
                style={({ pressed }) => [styles.availableCard, isExpress && styles.availableCardExpress, pressed && { opacity: 0.85 }]}
                onPress={() => setClaimTarget(item)}
              >
                <View style={styles.headerRow}>
                  <Text style={styles.customerName}>{getName(item.customer)}</Text>
                  <OrderStageChip stage={item.currentStatus} />
                </View>
                <Text style={styles.meta}>{formatDateTime(item.createdAt)}</Text>
                <View style={styles.footerRow}>
                  <Text style={styles.claimHint}>Tap to claim</Text>
                  {isExpress && <ExpressBadge />}
                </View>
              </Pressable>
            </FadeSlideIn>
          );
        }}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 ? (
            <EmptyState
              compact
              icon={section.key === 'mine' ? '🚚' : '🔍'}
              title={section.key === 'mine' ? 'No active deliveries' : 'Nothing to claim right now'}
              subtitle={
                section.key === 'mine'
                  ? 'Claim a delivery below, or check back later.'
                  : 'Orders ready for delivery will show up here.'
              }
            />
          ) : null
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        stickySectionHeadersEnabled={false}
      />

      <ConfirmModal
        visible={Boolean(claimTarget)}
        title="Claim this delivery?"
        description="You'll be responsible for delivering this order to the customer."
        confirmLabel="Claim"
        loading={isClaiming}
        onClose={() => setClaimTarget(null)}
        onConfirm={handleClaim}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginTop: 16, marginBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  customerName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  meta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  availableCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  availableCardExpress: { borderLeftWidth: 4, borderLeftColor: COLORS.warning, borderStyle: 'solid' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  claimHint: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
});
