import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { PickupStatusChip, OrderStageChip } from '../components/StatusChip';
import { MainScreenHeader } from '../components/MainScreenHeader';
import { EmptyState } from '../components/EmptyState';
import { useMyPickupHistoryQuery } from '../api/pickupApi';
import { useMyOrderHistoryQuery } from '../api/orderApi';
import { COLORS } from '../utils/constants';
import { formatDate, formatDateTime, getName } from '../utils/formatters';

type Segment = 'pickups' | 'deliveries';

export function HistoryScreen() {
  const [segment, setSegment] = useState<Segment>('pickups');

  const { data: pickups = [], isFetching: isFetchingPickups, refetch: refetchPickups } = useMyPickupHistoryQuery();
  const { data: orders = [], isFetching: isFetchingOrders, refetch: refetchOrders } = useMyOrderHistoryQuery();

  return (
    <View style={styles.container}>
      <MainScreenHeader title="History" subtitle="Your completed pickups and deliveries, kept forever" />

      <View style={styles.body}>
        <View style={styles.segmentRow}>
          <Pressable
            style={[styles.segmentButton, segment === 'pickups' && styles.segmentButtonActive]}
            onPress={() => setSegment('pickups')}
          >
            <Text style={[styles.segmentText, segment === 'pickups' && styles.segmentTextActive]}>Pickups</Text>
          </Pressable>
          <Pressable
            style={[styles.segmentButton, segment === 'deliveries' && styles.segmentButtonActive]}
            onPress={() => setSegment('deliveries')}
          >
            <Text style={[styles.segmentText, segment === 'deliveries' && styles.segmentTextActive]}>Deliveries</Text>
          </Pressable>
        </View>

        {segment === 'pickups' ? (
          <FlatList
            data={pickups}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshControl={<RefreshControl refreshing={isFetchingPickups} onRefresh={refetchPickups} />}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.headerRow}>
                  <Text style={styles.customerName}>{getName(item.customer)}</Text>
                  <PickupStatusChip status={item.status} />
                </View>
                <Text style={styles.meta}>
                  {formatDate(item.pickupDate)} · {item.pickupTime}
                </Text>
              </View>
            )}
            ListEmptyComponent={
              isFetchingPickups ? (
                <ActivityIndicator style={{ marginTop: 24 }} />
              ) : (
                <EmptyState icon="🧺" title="No completed pickups yet" subtitle="Pickups you finish will show up here, permanently." />
              )
            }
          />
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshControl={<RefreshControl refreshing={isFetchingOrders} onRefresh={refetchOrders} />}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.headerRow}>
                  <Text style={styles.customerName}>{getName(item.customer)}</Text>
                  <OrderStageChip stage={item.currentStatus} />
                </View>
                <Text style={styles.meta}>{formatDateTime(item.createdAt)}</Text>
              </View>
            )}
            ListEmptyComponent={
              isFetchingOrders ? (
                <ActivityIndicator style={{ marginTop: 24 }} />
              ) : (
                <EmptyState icon="🚚" title="No completed deliveries yet" subtitle="Deliveries you finish will show up here, permanently." />
              )
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  body: { flex: 1, paddingHorizontal: 16 },
  segmentRow: { flexDirection: 'row', backgroundColor: COLORS.border, borderRadius: 10, padding: 4, marginBottom: 16 },
  segmentButton: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segmentButtonActive: { backgroundColor: COLORS.surface },
  segmentText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  segmentTextActive: { color: COLORS.primary },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  customerName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  meta: { fontSize: 13, color: COLORS.textSecondary },
});
