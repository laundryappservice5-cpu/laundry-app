import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { JobCard } from '../components/JobCard';
import { ConfirmModal } from '../components/ConfirmModal';
import { PickupStatusChip } from '../components/StatusChip';
import { ExpressBadge } from '../components/ExpressBadge';
import { FadeSlideIn } from '../components/FadeSlideIn';
import { MainScreenHeader } from '../components/MainScreenHeader';
import { EmptyState } from '../components/EmptyState';
import { useMyAssignedPickupsQuery, useAvailablePickupsQuery, useSelfAssignPickupMutation } from '../api/pickupApi';
import { useMyStoreDropoffsQuery } from '../api/orderApi';
import { COLORS } from '../utils/constants';
import { formatDate, getName } from '../utils/formatters';
import type { RootStackParamList } from '../navigation/types';
import type { Order, Pickup } from '../types';

type JobListItem = { kind: 'pickup'; data: Pickup } | { kind: 'dropoff'; data: Order } | { kind: 'available'; data: Pickup };

export function JobsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { data: assigned = [], isLoading: isLoadingAssigned, isFetching: isFetchingAssigned, refetch: refetchAssigned } =
    useMyAssignedPickupsQuery();
  const { data: dropoffs = [], isFetching: isFetchingDropoffs, refetch: refetchDropoffs } = useMyStoreDropoffsQuery();
  const { data: available = [], isFetching: isFetchingAvailable, refetch: refetchAvailable } = useAvailablePickupsQuery();
  const [selfAssign, { isLoading: isClaiming }] = useSelfAssignPickupMutation();

  const [claimTarget, setClaimTarget] = useState<Pickup | null>(null);

  if (isLoadingAssigned) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const myJobs: JobListItem[] = [
    ...assigned.map((data): JobListItem => ({ kind: 'pickup', data })),
    ...dropoffs.map((data): JobListItem => ({ kind: 'dropoff', data })),
  ];
  const availableItems: JobListItem[] = available.map((data): JobListItem => ({ kind: 'available', data }));

  const sections: { title: string; key: string; data: JobListItem[] }[] = [
    { title: 'My Jobs', key: 'mine', data: myJobs },
    { title: 'Available to Claim', key: 'available', data: availableItems },
  ];

  async function handleClaim() {
    if (!claimTarget) return;
    await selfAssign(claimTarget._id);
    setClaimTarget(null);
  }

  return (
    <View style={styles.container}>
      <MainScreenHeader title="Jobs" subtitle="Pickups assigned to you, and ones up for grabs" />
      <SectionList
        sections={sections}
        keyExtractor={(item) => `${item.kind}-${item.data._id}`}
        refreshControl={
          <RefreshControl
            refreshing={isFetchingAssigned || isFetchingDropoffs || isFetchingAvailable}
            onRefresh={() => {
              refetchAssigned();
              refetchDropoffs();
              refetchAvailable();
            }}
          />
        }
        renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
        renderItem={({ item, index }) => {
          const delay = Math.min(index, 6) * 40;

          if (item.kind === 'pickup') {
            return (
              <FadeSlideIn delay={delay}>
                <JobCard pickup={item.data} onPress={() => navigation.navigate('PickupDetail', { id: item.data._id })} />
              </FadeSlideIn>
            );
          }

          if (item.kind === 'dropoff') {
            const isExpress = item.data.isExpressPickup || item.data.isExpressDelivery;
            return (
              <FadeSlideIn delay={delay}>
                <Pressable
                  style={({ pressed }) => [styles.dropoffCard, pressed && { opacity: 0.85 }]}
                  onPress={() => navigation.navigate('StoreDropoffDetail', { id: item.data._id })}
                >
                  <View style={styles.headerRow}>
                    <Text style={styles.customerName}>{getName(item.data.customer)}</Text>
                    <Text style={styles.dropoffBadge}>Deliver to Store</Text>
                  </View>
                  <Text style={styles.meta}>Picked up — needs drop-off at the laundry</Text>
                  {isExpress && (
                    <View style={{ marginTop: 8 }}>
                      <ExpressBadge />
                    </View>
                  )}
                </Pressable>
              </FadeSlideIn>
            );
          }

          const pickup = item.data;
          const isExpress = pickup.isExpressPickup || pickup.isExpressDelivery;
          return (
            <FadeSlideIn delay={delay}>
              <Pressable
                style={({ pressed }) => [styles.availableCard, isExpress && styles.availableCardExpress, pressed && { opacity: 0.85 }]}
                onPress={() => setClaimTarget(pickup)}
              >
                <View style={styles.headerRow}>
                  <Text style={styles.customerName}>{getName(pickup.customer)}</Text>
                  <PickupStatusChip status={pickup.status} />
                </View>
                <Text style={styles.meta} numberOfLines={1}>
                  {pickup.pickupAddress.address}
                  {pickup.pickupAddress.area ? `, ${pickup.pickupAddress.area}` : ''}
                </Text>
                <Text style={styles.meta}>
                  {formatDate(pickup.pickupDate)} · {pickup.pickupTime}
                </Text>
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
              icon={section.key === 'mine' ? '📦' : '🔍'}
              title={section.key === 'mine' ? 'No active jobs' : 'Nothing to claim right now'}
              subtitle={
                section.key === 'mine'
                  ? 'Claim a pickup below, or check back later.'
                  : 'New unclaimed pickups will show up here.'
              }
            />
          ) : null
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        stickySectionHeadersEnabled={false}
      />

      <ConfirmModal
        visible={Boolean(claimTarget)}
        title="Claim this pickup?"
        description="You'll be responsible for collecting the laundry from this address."
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
  dropoffCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  dropoffBadge: { fontSize: 11, fontWeight: '700', color: COLORS.warning },
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
