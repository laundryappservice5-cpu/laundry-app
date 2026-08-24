import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { useCreateClothTypeMutation, useListClothTypesQuery, useListServicesQuery } from '../api/catalogApi';
import { getClothTypeIcon } from '../utils/clothTypeIcons';
import { getId, formatCurrency } from '../utils/formatters';
import { COLORS } from '../utils/constants';
import type { ClothType, CollectedItem, Service } from '../types';

interface CartEntry {
  clothType: ClothType | null;
  service: Service;
  quantity: number;
}

interface CollectedItemsEditorProps {
  items: CollectedItem[];
  onChange: (items: { clothType?: string; service: string; quantity: number }[]) => void;
}

function cartKey(clothTypeId: string, serviceId: string): string {
  return `${clothTypeId}::${serviceId}`;
}

function flatKey(serviceId: string): string {
  return `flat::${serviceId}`;
}

const ALL_TAB = '__all__';
const GRID_GAP = 16;

export function CollectedItemsEditor({ items, onChange }: CollectedItemsEditorProps) {
  const { data: clothTypes = [] } = useListClothTypesQuery();
  const { data: services = [] } = useListServicesQuery();
  const [createClothType, { isLoading: isCreatingType }] = useCreateClothTypeMutation();

  const itemizedServices = services.filter((s) => s.flatPrice == null);

  const [activeService, setActiveService] = useState('');

  useEffect(() => {
    if (!activeService && services.length > 0) setActiveService(services[0]._id);
  }, [services, activeService]);

  const [cart, setCart] = useState<Map<string, CartEntry>>(() => {
    const map = new Map<string, CartEntry>();
    for (const item of items) {
      const svc = typeof item.service === 'string' ? services.find((s) => s._id === item.service) : item.service;
      const serviceId = getId(item.service);
      if (!serviceId || !svc) continue;

      if (!item.clothType) {
        map.set(flatKey(serviceId), { clothType: null, service: svc, quantity: 1 });
        continue;
      }
      const ct = typeof item.clothType === 'string' ? clothTypes.find((c) => c._id === item.clothType) : item.clothType;
      const clothTypeId = getId(item.clothType);
      if (clothTypeId && ct) {
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

  const hasFlatEntry = useMemo(() => [...cart.values()].some((e) => !e.clothType), [cart]);

  function priceFor(clothType: ClothType, serviceId: string): number | undefined {
    return clothType.prices?.[serviceId];
  }

  function lineTotal(entry: CartEntry): number {
    if (!entry.clothType) return entry.service.flatPrice ?? 0;
    return (priceFor(entry.clothType, entry.service._id) ?? 0) * entry.quantity;
  }

  function emit(next: Map<string, CartEntry>) {
    setCart(next);
    onChange(
      [...next.values()].map((e) => ({ clothType: e.clothType?._id, service: e.service._id, quantity: e.quantity })),
    );
  }

  function addToCart(clothType: ClothType, explicitService?: Service) {
    const service = explicitService ?? services.find((s) => s._id === activeService);
    if (!service) return;
    const key = cartKey(clothType._id, service._id);
    const next = new Map(cart);
    const existing = next.get(key);
    next.set(key, { clothType, service, quantity: (existing?.quantity ?? 0) + 1 });
    emit(next);
  }

  function addFlatFeeToCart(service: Service) {
    // A flat-fee service (e.g. House Cleaning) is a standalone, one-direct-charge
    // service — it replaces everything else in the cart rather than adding to it.
    emit(new Map([[flatKey(service._id), { clothType: null, service, quantity: 1 }]]));
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

  function removeFromCart(key: string) {
    const next = new Map(cart);
    next.delete(key);
    emit(next);
  }

  async function handleCreateType() {
    if (!newTypeName.trim()) return;
    const created = await createClothType({ name: newTypeName.trim() }).unwrap();
    addToCart(created);
    setNewTypeName('');
    setAddTypeOpen(false);
  }

  const activeServiceDoc = services.find((s) => s._id === activeService);
  const isFlatFeeActive = activeServiceDoc?.flatPrice != null;

  return (
    <View>
      <Text style={styles.sectionTitle}>Service</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {services.map((svc) => {
          const active = svc._id === activeService;
          const isFlat = svc.flatPrice != null;
          // House Cleaning stays tappable no matter what's already in the cart — picking it is
          // what clears everything else. Only itemized tabs get locked out once it's in the cart.
          const disabled = !isFlat && hasFlatEntry;
          return (
            <Pressable
              key={svc._id}
              onPress={() => !disabled && setActiveService(svc._id)}
              style={[styles.tabPill, active && styles.tabPillActive, disabled && styles.tabPillDisabled]}
            >
              <Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>
                {isFlat ? `🏠 ${svc.name}` : svc.name}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          key={ALL_TAB}
          onPress={() => !hasFlatEntry && setActiveService(ALL_TAB)}
          style={[styles.tabPill, activeService === ALL_TAB && styles.tabPillActive, hasFlatEntry && styles.tabPillDisabled]}
        >
          <Text style={[styles.tabPillText, activeService === ALL_TAB && styles.tabPillTextActive]}>All</Text>
        </Pressable>
      </ScrollView>

      {isFlatFeeActive && activeServiceDoc ? (
        <View style={styles.flatFeeCard}>
          <Text style={styles.flatFeeIcon}>🏠</Text>
          <Text style={styles.flatFeeName}>{activeServiceDoc.name}</Text>
          <Text style={styles.flatFeeDescription}>
            A direct, one-time service — no items needed. Adding it charges one flat amount and clears any other items
            already in the cart.
          </Text>
          <Text style={styles.flatFeePrice}>{formatCurrency(activeServiceDoc.flatPrice ?? 0)}</Text>
          <AnimatedPressable style={styles.primaryButton} onPress={() => addFlatFeeToCart(activeServiceDoc)}>
            <Text style={styles.primaryButtonText}>
              {cart.has(flatKey(activeServiceDoc._id)) ? 'Added' : `Add ${activeServiceDoc.name}`}
            </Text>
          </AnimatedPressable>
        </View>
      ) : (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Add Items</Text>
          <TextInput
            placeholder="Search cloth types…"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholderTextColor={COLORS.textSecondary}
          />

          {/* cancels the surrounding card's 16px padding so the grid fills its full width */}
          <View style={styles.gridBleed}>
          {activeService === ALL_TAB ? (
            <View style={styles.grid}>
              {filteredTypes.map((item) => {
                const pricedServices = itemizedServices.filter((svc) => priceFor(item, svc._id) !== undefined);
                const totalQtyForType = [...cart.values()]
                  .filter((e) => e.clothType?._id === item._id)
                  .reduce((sum, e) => sum + e.quantity, 0);
                return (
                  <View key={item._id} style={[styles.allCard, styles.cardWidth2]}>
                    {totalQtyForType > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{totalQtyForType}</Text>
                      </View>
                    )}
                    <View style={styles.allCardHeader}>
                      <Text style={styles.catalogIcon}>{getClothTypeIcon(item)}</Text>
                      <Text style={styles.allCardName}>{item.name}</Text>
                    </View>
                    {pricedServices.length === 0 ? (
                      <Text style={styles.catalogPriceUnset}>No prices set</Text>
                    ) : (
                      pricedServices.map((svc) => {
                        const price = priceFor(item, svc._id)!;
                        const qty = cart.get(cartKey(item._id, svc._id))?.quantity ?? 0;
                        return (
                          <Pressable
                            key={svc._id}
                            style={[styles.allPriceRow, qty > 0 && styles.allPriceRowActive]}
                            onPress={() => addToCart(item, svc)}
                          >
                            <Text style={styles.allPriceRowLabel}>{svc.name}</Text>
                            <Text style={styles.allPriceRowValue}>
                              {formatCurrency(price)}
                              {qty > 0 ? ` ×${qty}` : ''}
                            </Text>
                          </Pressable>
                        );
                      })
                    )}
                  </View>
                );
              })}
              <AnimatedPressable
                style={[styles.catalogCard, styles.newTypeCard, { width: '100%' }]}
                onPress={() => setAddTypeOpen(true)}
              >
                <Text style={styles.catalogIcon}>➕</Text>
                <Text style={styles.catalogLabel}>New Type</Text>
              </AnimatedPressable>
            </View>
          ) : (
            <View style={styles.grid}>
              {[...filteredTypes, { _id: '__new__', name: 'New Type', isCustom: false } as ClothType].map((item) => {
                if (item._id === '__new__') {
                  return (
                    <AnimatedPressable
                      key={item._id}
                      style={[styles.catalogCard, styles.newTypeCard, styles.cardWidth3]}
                      onPress={() => setAddTypeOpen(true)}
                    >
                      <Text style={styles.catalogIcon}>➕</Text>
                      <Text style={styles.catalogLabel}>New Type</Text>
                    </AnimatedPressable>
                  );
                }
                const key = activeService ? cartKey(item._id, activeService) : '';
                const qty = cart.get(key)?.quantity ?? 0;
                const price = activeService ? priceFor(item, activeService) : undefined;
                return (
                  <AnimatedPressable key={item._id} style={[styles.catalogCard, styles.cardWidth3]} onPress={() => addToCart(item)}>
                    {qty > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{qty}</Text>
                      </View>
                    )}
                    <Text style={styles.catalogIcon}>{getClothTypeIcon(item)}</Text>
                    <Text style={styles.catalogLabel}>{item.name}</Text>
                    <Text style={[styles.catalogPrice, price === undefined && styles.catalogPriceUnset]}>
                      {price !== undefined ? formatCurrency(price) : 'Not set'}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          )}
          </View>
        </>
      )}

      <View style={[styles.cartHeader, { marginTop: 20 }]}>
        <Text style={styles.sectionTitle}>Collected Items</Text>
        <Text style={styles.totalText}>{totalQty} item{totalQty === 1 ? '' : 's'}</Text>
      </View>

      {cart.size === 0 && <Text style={styles.emptyText}>No items yet — pick a service above, then tap a cloth type to add it.</Text>}

      {[...cart.entries()].map(([key, entry]) => {
        if (!entry.clothType) {
          return (
            <View key={key} style={styles.cartRow}>
              <Text style={styles.cartIcon}>🏠</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cartName}>{entry.service.name}</Text>
                <Text style={styles.cartMeta}>Flat fee — direct service</Text>
              </View>
              <Text style={styles.flatCartPrice}>{formatCurrency(lineTotal(entry))}</Text>
              <Pressable style={styles.stepperButton} onPress={() => removeFromCart(key)}>
                <Text style={styles.stepperText}>×</Text>
              </Pressable>
            </View>
          );
        }
        const price = priceFor(entry.clothType, entry.service._id);
        return (
          <View key={key} style={styles.cartRow}>
            <Text style={styles.cartIcon}>{getClothTypeIcon(entry.clothType)}</Text>
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
  flatCartPrice: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginRight: 4 },
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
  tabPillDisabled: { opacity: 0.4 },
  tabPillText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  tabPillTextActive: { color: '#fff' },
  flatFeeCard: {
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  flatFeeIcon: { fontSize: 36 },
  flatFeeName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  flatFeeDescription: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  flatFeePrice: { fontSize: 22, fontWeight: '800', color: COLORS.primary, marginVertical: 4 },
  primaryButton: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    color: COLORS.textPrimary,
  },
  gridBleed: { marginHorizontal: -16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, columnGap: GRID_GAP },
  cardWidth2: { width: '47%' },
  cardWidth3: { width: '30.5%' },
  catalogCard: {
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
  catalogLabel: { fontSize: 11, color: COLORS.textPrimary, textAlign: 'center', paddingHorizontal: 4 },
  catalogPrice: { fontSize: 10, fontWeight: '700', color: COLORS.primary, marginTop: 2, textAlign: 'center', paddingHorizontal: 4 },
  catalogPriceUnset: { color: COLORS.textSecondary, fontWeight: '400' },
  allCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 10,
    position: 'relative',
  },
  allCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  allCardName: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, flexShrink: 1 },
  allPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 4,
  },
  allPriceRowActive: { backgroundColor: `${COLORS.primary}20` },
  allPriceRowLabel: { fontSize: 11, color: COLORS.textSecondary, flexShrink: 1, marginRight: 6 },
  allPriceRowValue: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
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
