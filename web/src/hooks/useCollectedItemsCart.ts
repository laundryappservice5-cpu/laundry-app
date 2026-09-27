import { useEffect, useMemo, useState } from 'react';
import { useCreateClothTypeMutation, useListClothTypesQuery, useListServicesQuery } from '../api/catalogApi';
import type { ClothType, CollectedItem, Service } from '../types';
import { getId } from '../utils/formatters';

export interface CartEntry {
  clothType: ClothType | null;
  service: Service;
  quantity: number;
}

export const ALL_TAB = '__all__';

export function cartKey(clothTypeId: string, serviceId: string): string {
  return `${clothTypeId}::${serviceId}`;
}

export function flatKey(serviceId: string): string {
  return `flat::${serviceId}`;
}

// Stable references so a still-loading query (data undefined) doesn't hand out a fresh
// `[]` on every render — that would retrigger any effect keyed on these arrays forever.
const EMPTY_SERVICES: Service[] = [];
const EMPTY_CLOTH_TYPES: ClothType[] = [];

function buildCart(items: CollectedItem[], services: Service[], clothTypes: ClothType[]): Map<string, CartEntry> {
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
}

interface UseCollectedItemsCartArgs {
  items: CollectedItem[];
  onSave: (items: { clothType?: string; service: string; quantity: number }[]) => void | Promise<void>;
  onChange?: (items: { clothType?: string; service: string; quantity: number }[]) => void;
}

export function useCollectedItemsCart({ items, onSave, onChange }: UseCollectedItemsCartArgs) {
  const { data: clothTypes = EMPTY_CLOTH_TYPES } = useListClothTypesQuery();
  const { data: services = EMPTY_SERVICES } = useListServicesQuery();
  const [createClothType, { isLoading: isCreatingType }] = useCreateClothTypeMutation();

  const itemizedServices = services.filter((s) => s.flatPrice == null);

  const [activeService, setActiveService] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    if (!activeService && services.length > 0) setActiveService(services[0]._id);
  }, [services, activeService]);

  const [cart, setCart] = useState<Map<string, CartEntry>>(() => buildCart(items, services, clothTypes));
  const [dirty, setDirty] = useState(false);

  // `items` often isn't known yet on first render (e.g. the order is still loading), so the
  // lazy initializer above can capture an empty cart. Re-sync once the real items arrive —
  // but only while the user hasn't started editing, so we never clobber in-progress changes.
  useEffect(() => {
    if (dirty) return;
    setCart(buildCart(items, services, clothTypes));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, services, clothTypes]);

  const [search, setSearch] = useState('');
  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removeKey, setRemoveKey] = useState<string | null>(null);

  const filteredTypes = useMemo(
    () => clothTypes.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [clothTypes, search],
  );

  function priceFor(clothType: ClothType, serviceId: string): number | undefined {
    return clothType.prices?.[serviceId];
  }

  function lineTotal(entry: CartEntry): number {
    if (!entry.clothType) return entry.service.flatPrice ?? 0;
    return (priceFor(entry.clothType, entry.service._id) ?? 0) * entry.quantity;
  }

  const itemizedEntries = useMemo(() => [...cart.entries()].filter(([, e]) => e.clothType), [cart]);
  const addonEntries = useMemo(() => [...cart.entries()].filter(([, e]) => !e.clothType), [cart]);

  const totalQty = useMemo(() => [...cart.values()].reduce((sum, e) => sum + e.quantity, 0), [cart]);
  const totalAmount = useMemo(() => [...cart.values()].reduce((sum, e) => sum + lineTotal(e), 0), [cart]);
  const totalAfterDiscount = Math.max(0, totalAmount - (discountAmount || 0));

  useEffect(() => {
    onChange?.(
      [...cart.values()].map((e) => ({
        clothType: e.clothType?._id,
        service: e.service._id,
        quantity: e.quantity,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  function addToCart(clothType: ClothType, explicitService?: Service) {
    const service = explicitService ?? services.find((s) => s._id === activeService);
    if (!service) return;
    const key = cartKey(clothType._id, service._id);
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(key);
      next.set(key, { clothType, service, quantity: (existing?.quantity ?? 0) + 1 });
      return next;
    });
    setDirty(true);
  }

  function addFlatFeeToCart(service: Service) {
    // A flat-fee service (e.g. House Cleaning) is an addon — it adds its own flat
    // charge alongside whatever itemized entries are already in the cart.
    setCart((prev) => {
      const next = new Map(prev);
      next.set(flatKey(service._id), { clothType: null, service, quantity: 1 });
      return next;
    });
    setDirty(true);
  }

  function changeQuantity(key: string, delta: number) {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(key);
      if (!existing) return prev;
      const quantity = existing.quantity + delta;
      if (quantity <= 0) {
        next.delete(key);
      } else {
        next.set(key, { ...existing, quantity });
      }
      return next;
    });
    setDirty(true);
  }

  function removeFromCart(key: string) {
    setCart((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
    setDirty(true);
  }

  async function handleCreateType() {
    if (!newTypeName.trim()) return;
    const created = await createClothType({ name: newTypeName.trim() }).unwrap();
    addToCart(created);
    setNewTypeName('');
    setAddTypeOpen(false);
  }

  async function handleSave() {
    await onSave(
      [...cart.values()].map((e) => ({ clothType: e.clothType?._id, service: e.service._id, quantity: e.quantity })),
    );
    setDirty(false);
  }

  async function handleConfirmSave() {
    await handleSave();
    setConfirmOpen(false);
  }

  const activeServiceDoc = services.find((s) => s._id === activeService);
  const isFlatFeeActive = activeServiceDoc?.flatPrice != null;
  const removeEntry = removeKey ? cart.get(removeKey) : undefined;

  return {
    clothTypes,
    services,
    itemizedServices,
    isCreatingType,
    activeService,
    setActiveService,
    discountAmount,
    setDiscountAmount,
    cart,
    search,
    setSearch,
    addTypeOpen,
    setAddTypeOpen,
    newTypeName,
    setNewTypeName,
    dirty,
    confirmOpen,
    setConfirmOpen,
    removeKey,
    setRemoveKey,
    filteredTypes,
    priceFor,
    lineTotal,
    itemizedEntries,
    addonEntries,
    totalQty,
    totalAmount,
    totalAfterDiscount,
    addToCart,
    addFlatFeeToCart,
    changeQuantity,
    removeFromCart,
    handleCreateType,
    handleConfirmSave,
    activeServiceDoc,
    isFlatFeeActive,
    removeEntry,
  };
}

export type CollectedItemsCart = ReturnType<typeof useCollectedItemsCart>;
