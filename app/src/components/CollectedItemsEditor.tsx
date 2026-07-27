import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { useCreateClothTypeMutation, useListClothTypesQuery, useListServicesQuery } from '../api/catalogApi';
import { getClothTypeIcon } from '../utils/clothTypeIcons';
import { getId, formatCurrency } from '../utils/formatters';
import { COLORS } from '../utils/constants';
import type { ClothType, CollectedItem, Service } from '../types';

interface CartEntry {
  clothType: ClothType;
  service: Service;
  quantity: number;
}

interface CollectedItemsEditorProps {
  items: CollectedItem[];
  onChange: (items: { clothType: string; service: string; quantity: number }[]) => void;
}

function cartKey(clothTypeId: string, serviceId: string): string {
  return `${clothTypeId}::${serviceId}`;
}

export function CollectedItemsEditor({ items, onChange }: CollectedItemsEditorProps) {
  const { data: clothTypes = [] } = useListClothTypesQuery();
  const { data: services = [] } = useListServicesQuery();
  const [createClothType, { isLoading: isCreatingType }] = useCreateClothTypeMutation();

  const [activeService, setActiveService] = useState('');

  useEffect(() => {
    if (!activeService && services.length > 0) setActiveService(services[0]._id);
  }, [services, activeService]);

  const [cart, setCart] = useState<Map<string, CartEntry>>(() => {
    const map = new Map<string, CartEntry>();
    for (const item of items) {
      const ct = typeof item.clothType === 'string' ? clothTypes.find((c) => c._id === item.clothType) : item.clothType;
      const svc = typeof item.service === 'string' ? services.find((s) => s._id === item.service) : item.service;
      const clothTypeId = getId(item.clothType);
      const serviceId = getId(item.service);
      if (clothTypeId && serviceId && ct && svc) {
        map.set(cartKey(clothTypeId, serviceId), { clothType: ct, service: svc, quantity: item.quantity });
      }
    }
    return map;
  });

  const [search, setSearch] = useState('');
  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  const filteredTypes = useMemo(
    () => clothTypes.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [clothTypes, search],
  );

  const totalQty = useMemo(() => [...cart.values()].reduce((sum, e) => sum + e.quantity, 0), [cart]);

  function priceFor(clothType: ClothType, serviceId: string): number | undefined {
    return clothType.prices?.[serviceId];
  }

  function emit(next: Map<string, CartEntry>) {
    setCart(next);
    onChange([...next.values()].map((e) => ({ clothType: e.clothType._id, service: e.service._id, quantity: e.quantity })));
  }

  function addToCart(clothType: ClothType) {
    const service = services.find((s) => s._id === activeService);
    if (!service) return;
    const key = cartKey(clothType._id, service._id);
    const next = new Map(cart);
    const existing = next.get(key);
    next.set(key, { clothType, service, quantity: (existing?.quantity ?? 0) + 1 });
    emit(next);
  }

  function changeQuantity(key: string, delta: number) {
    const next = new Map(cart);
    const existing = next.get(key);
    if (!existing) return;
    const quantity = existing.quantity + delta;
    if (quantity <= 0) next.delete(key);
    else next.set(key, { ...existing, quantity });
    emit(next);
  }

  async function handleCreateType() {
    if (!newTypeName.trim()) return;
    const created = await createClothType({ name: newTypeName.trim() }).unwrap();
    addToCart(created);
    setNewTypeName('');
    setAddTypeOpen(false);
  }

  return (
    <View>
      <View style={styles.cartHeader}>
        <Text style={styles.sectionTitle}>Collected Items</Text>
        <Text style={styles.totalText}>{totalQty} item{totalQty === 1 ? '' : 's'}</Text>
      </View>

      {cart.size === 0 && <Text style={styles.emptyText}>No items yet — pick a service below, then tap a cloth type to add it.</Text>}

      {[...cart.entries()].map(([key, entry]) => {
        const price = priceFor(entry.clothType, entry.service._id);
        return (
          <View key={key} style={styles.cartRow}>
            <Text style={styles.cartIcon}>{getClothTypeIcon(entry.clothType.name)}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cartName}>{entry.clothType.name}</Text>
              <Text style={styles.cartMeta}>
                {entry.service.name} · {price !== undefined ? formatCurrency(price) : 'Price not set'}
              </Text>
            </View>
            <Pressable style={styles.stepperButton} onPress={() => changeQuantity(key, -1)}>
              <Text style={styles.stepperText}>−</Text>
            </Pressable>
            <Text style={styles.cartQty}>{entry.quantity}</Text>
            <Pressable style={styles.stepperButton} onPress={() => changeQuantity(key, 1)}>
              <Text style={styles.stepperText}>+</Text>
            </Pressable>
          </View>
        );
      })}

      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Service</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {services.map((svc) => {
          const active = svc._id === activeService;
          return (
            <Pressable
              key={svc._id}
              onPress={() => setActiveService(svc._id)}
              style={[styles.tabPill, active && styles.tabPillActive]}
            >
              <Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>{svc.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Add Items</Text>
      <TextInput
        placeholder="Search cloth types…"
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
        placeholderTextColor={COLORS.textSecondary}
      />

      <FlatList
        data={[...filteredTypes, { _id: '__new__', name: 'New Type', isCustom: false } as ClothType]}
        keyExtractor={(item) => item._id}
        numColumns={4}
        scrollEnabled={false}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ gap: 10 }}
        renderItem={({ item }) => {
          if (item._id === '__new__') {
            return (
              <AnimatedPressable style={[styles.catalogCard, styles.newTypeCard]} onPress={() => setAddTypeOpen(true)}>
                <Text style={styles.catalogIcon}>➕</Text>
                <Text style={styles.catalogLabel} numberOfLines={1}>
                  New Type
                </Text>
              </AnimatedPressable>
            );
          }
          const key = activeService ? cartKey(item._id, activeService) : '';
          const qty = cart.get(key)?.quantity ?? 0;
          const price = activeService ? priceFor(item, activeService) : undefined;
          return (
            <AnimatedPressable style={styles.catalogCard} onPress={() => addToCart(item)}>
              {qty > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{qty}</Text>
                </View>
              )}
              <Text style={styles.catalogIcon}>{getClothTypeIcon(item.name)}</Text>
              <Text style={styles.catalogLabel} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.catalogPrice, price === undefined && styles.catalogPriceUnset]} numberOfLines={1}>
                {price !== undefined ? formatCurrency(price) : 'Not set'}
              </Text>
            </AnimatedPressable>
          );
        }}
      />

      <Modal visible={addTypeOpen} transparent animationType="fade" onRequestClose={() => setAddTypeOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>Add New Cloth Type</Text>
            <TextInput
              placeholder="Name"
              value={newTypeName}
              onChangeText={setNewTypeName}
              style={[styles.searchInput, { marginTop: 12 }]}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setAddTypeOpen(false)} style={styles.modalCancelButton}>
                <Text style={{ color: COLORS.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateType}
                disabled={!newTypeName.trim() || isCreatingType}
                style={[styles.modalConfirmButton, (!newTypeName.trim() || isCreatingType) && { opacity: 0.5 }]}
              >
                {isCreatingType ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Add</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  totalText: { fontSize: 13, color: COLORS.textSecondary },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  cartIcon: { fontSize: 22 },
  cartName: { fontWeight: '600', color: COLORS.textPrimary },
  cartMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  cartQty: { minWidth: 24, textAlign: 'center', fontWeight: '700', color: COLORS.textPrimary },
  tabRow: { gap: 8, paddingVertical: 4 },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabPillText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  tabPillTextActive: { color: '#fff' },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    color: COLORS.textPrimary,
  },
  catalogCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  newTypeCard: { borderStyle: 'dashed' },
  catalogIcon: { fontSize: 24, marginBottom: 4 },
  catalogLabel: { fontSize: 11, color: COLORS.textPrimary, maxWidth: 64 },
  catalogPrice: { fontSize: 10, fontWeight: '700', color: COLORS.primary, marginTop: 2 },
  catalogPriceUnset: { color: COLORS.textSecondary, fontWeight: '400' },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, width: '100%', maxWidth: 360 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  modalCancelButton: { paddingHorizontal: 16, paddingVertical: 10 },
  modalConfirmButton: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, minWidth: 70, alignItems: 'center' },
});
