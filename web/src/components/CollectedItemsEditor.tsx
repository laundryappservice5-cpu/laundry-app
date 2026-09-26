import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Grow,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import { useCreateClothTypeMutation, useListClothTypesQuery, useListServicesQuery } from '../api/catalogApi';
import { getClothTypeIcon } from '../utils/clothTypeIcons';
import { ConfirmDialog } from './ConfirmDialog';
import type { ClothType, CollectedItem, Service } from '../types';
import { getId, formatCurrency } from '../utils/formatters';

interface CartEntry {
  clothType: ClothType | null;
  service: Service;
  quantity: number;
}

interface CollectedItemsEditorProps {
  items: CollectedItem[];
  onSave: (items: { clothType?: string; service: string; quantity: number }[]) => void | Promise<void>;
  saving?: boolean;
  onChange?: (items: { clothType?: string; service: string; quantity: number }[]) => void;
  hideSaveButton?: boolean;
}

function cartKey(clothTypeId: string, serviceId: string): string {
  return `${clothTypeId}::${serviceId}`;
}

function flatKey(serviceId: string): string {
  return `flat::${serviceId}`;
}

const ALL_TAB = '__all__';

export function CollectedItemsEditor({ items, onSave, saving, onChange, hideSaveButton = false }: CollectedItemsEditorProps) {
  const { data: clothTypes = [] } = useListClothTypesQuery();
  const { data: services = [] } = useListServicesQuery();
  const [createClothType, { isLoading: isCreatingType }] = useCreateClothTypeMutation();

  const itemizedServices = services.filter((s) => s.flatPrice == null);

  const [activeService, setActiveService] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState(0);

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
  const [dirty, setDirty] = useState(false);
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

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 5 }}>
        <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Typography variant="subtitle1" fontWeight={700}>
              Collected Items
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {totalQty} item{totalQty === 1 ? '' : 's'}
            </Typography>
          </Stack>

          {cart.size === 0 && (
            <Alert severity="info" sx={{ mb: 1 }}>
              No items yet — pick a service tab, then tap a cloth type to add it.
            </Alert>
          )}

          <Stack spacing={1}>
            {[...cart.entries()].map(([key, entry]) => {
              if (!entry.clothType) {
                return (
                  <Grow in key={key}>
                    <Stack
                      spacing={0.5}
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: 'action.hover',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography fontSize={22}>🏠</Typography>
                        <Typography fontWeight={600} sx={{ flexGrow: 1, minWidth: 0 }} noWrap>
                          {entry.service.name}
                        </Typography>
                        <IconButton size="small" onClick={() => setRemoveKey(key)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                        <Typography variant="caption" color="text.secondary">
                          Add-on — flat fee
                        </Typography>
                        <Typography fontWeight={700} color="primary.main">
                          {formatCurrency(lineTotal(entry))}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Grow>
                );
              }
              const price = priceFor(entry.clothType, entry.service._id);
              return (
                <Grow in key={key}>
                  <Stack
                    spacing={0.5}
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: 'action.hover',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography fontSize={22}>{getClothTypeIcon(entry.clothType)}</Typography>
                      <Typography fontWeight={600} sx={{ flexGrow: 1, minWidth: 0 }} noWrap>
                        {entry.clothType.name}
                      </Typography>
                      <IconButton size="small" onClick={() => setRemoveKey(key)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {entry.service.name} · {price !== undefined ? formatCurrency(price) : 'Price not set'}
                    </Typography>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <IconButton size="small" onClick={() => changeQuantity(key, -1)}>
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography sx={{ minWidth: 20, textAlign: 'center' }} fontWeight={700}>
                          {entry.quantity}
                        </Typography>
                        <IconButton size="small" onClick={() => changeQuantity(key, 1)}>
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      <Typography fontWeight={700} color="primary.main">
                        {formatCurrency(lineTotal(entry))}
                      </Typography>
                    </Stack>
                  </Stack>
                </Grow>
              );
            })}
          </Stack>

          {totalAmount > 0 && (
            <Stack spacing={1} mt={2} pt={2} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Total Amount</Typography>
                <Typography variant="body2" fontWeight={700}>
                  {formatCurrency(totalAmount)}
                </Typography>
              </Stack>
              <TextField
                label="Discount"
                type="number"
                size="small"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
              />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="subtitle2" fontWeight={700}>
                  Total After Discount
                </Typography>
                <Typography variant="subtitle2" fontWeight={700}>
                  {formatCurrency(totalAfterDiscount)}
                </Typography>
              </Stack>
            </Stack>
          )}

          {!hideSaveButton && (
            <Button variant="contained" fullWidth sx={{ mt: 2 }} disabled={!dirty || saving} onClick={() => setConfirmOpen(true)}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          )}
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 7 }}>
        <Card variant="outlined" sx={{ p: 2 }}>
          <Tabs
            value={activeService === ALL_TAB || services.some((s) => s._id === activeService) ? activeService : false}
            onChange={(_, v) => setActiveService(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider', minHeight: 40 }}
          >
            {services.map((svc) => {
              const isFlat = svc.flatPrice != null;
              return (
                <Tab
                  key={svc._id}
                  label={isFlat ? `🏠 ${svc.name}` : svc.name}
                  value={svc._id}
                  sx={{ minHeight: 40 }}
                />
              );
            })}
            <Tab key={ALL_TAB} label="All" value={ALL_TAB} sx={{ minHeight: 40 }} />
          </Tabs>

          {isFlatFeeActive && activeServiceDoc ? (
            <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
              <Typography fontSize={40}>🏠</Typography>
              <Typography variant="subtitle1" fontWeight={700}>
                {activeServiceDoc.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                An addon — no items needed. Adding it charges one flat amount alongside anything else already in the cart.
              </Typography>
              <Typography variant="h5" fontWeight={800} color="primary.main">
                {formatCurrency(activeServiceDoc.flatPrice ?? 0)}
              </Typography>
              <Button variant="contained" onClick={() => addFlatFeeToCart(activeServiceDoc)}>
                {cart.has(flatKey(activeServiceDoc._id)) ? 'Added' : `Add ${activeServiceDoc.name}`}
              </Button>
            </Stack>
          ) : (
            <>
              <TextField
                placeholder="Search cloth types…"
                size="small"
                fullWidth
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Grid container spacing={1.5}>
                {filteredTypes.map((ct) => {
                  const isAll = activeService === ALL_TAB;

                  if (isAll) {
                    const pricedServices = itemizedServices.filter((svc) => priceFor(ct, svc._id) !== undefined);
                    const totalQtyForType = [...cart.values()]
                      .filter((e) => e.clothType?._id === ct._id)
                      .reduce((sum, e) => sum + e.quantity, 0);
                    return (
                      <Grid key={ct._id} size={{ xs: 6, sm: 6, md: 6, lg: 4 }}>
                        <Card variant="outlined" sx={{ p: 1.5, position: 'relative' }}>
                          {totalQtyForType > 0 && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                borderRadius: '50%',
                                width: 20,
                                height: 20,
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                              }}
                            >
                              {totalQtyForType}
                            </Box>
                          )}
                          <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                            <Typography fontSize={24}>{getClothTypeIcon(ct)}</Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {ct.name}
                            </Typography>
                          </Stack>
                          {pricedServices.length === 0 ? (
                            <Typography variant="caption" color="text.disabled">
                              No prices set
                            </Typography>
                          ) : (
                            <Stack spacing={0.5}>
                              {pricedServices.map((svc) => {
                                const price = priceFor(ct, svc._id)!;
                                const qty = cart.get(cartKey(ct._id, svc._id))?.quantity ?? 0;
                                return (
                                  <Stack
                                    key={svc._id}
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    onClick={() => addToCart(ct, svc)}
                                    sx={{
                                      px: 1,
                                      py: 0.5,
                                      borderRadius: 1,
                                      cursor: 'pointer',
                                      bgcolor: qty > 0 ? 'action.selected' : 'action.hover',
                                      '&:hover': { bgcolor: 'action.selected' },
                                    }}
                                  >
                                    <Typography variant="caption">{svc.name}</Typography>
                                    <Typography variant="caption" fontWeight={700} color="primary.main">
                                      {formatCurrency(price)}
                                      {qty > 0 ? ` ×${qty}` : ''}
                                    </Typography>
                                  </Stack>
                                );
                              })}
                            </Stack>
                          )}
                        </Card>
                      </Grid>
                    );
                  }

                  const key = activeService ? cartKey(ct._id, activeService) : '';
                  const qty = cart.get(key)?.quantity ?? 0;
                  const price = activeService ? priceFor(ct, activeService) : undefined;
                  return (
                    <Grid key={ct._id} size={{ xs: 6, sm: 6, md: 6, lg: 4 }}>
                      <Card
                        variant="outlined"
                        onClick={() => addToCart(ct)}
                        sx={{
                          p: 1.5,
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                          '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                          '&:active': { transform: 'scale(0.96)' },
                          position: 'relative',
                        }}
                      >
                        {qty > 0 && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              bgcolor: 'primary.main',
                              color: 'primary.contrastText',
                              borderRadius: '50%',
                              width: 20,
                              height: 20,
                              fontSize: 12,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                            }}
                          >
                            {qty}
                          </Box>
                        )}
                        <Typography fontSize={28}>{getClothTypeIcon(ct)}</Typography>
                        <Typography variant="caption" noWrap display="block">
                          {ct.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ overflowWrap: 'break-word' }}
                          color={price !== undefined ? 'primary.main' : 'text.disabled'}
                          fontWeight={600}
                        >
                          {price !== undefined ? formatCurrency(price) : 'Not set'}
                        </Typography>
                      </Card>
                    </Grid>
                  );
                })}
                <Grid size={{ xs: 6, sm: 6, md: 6, lg: 4 }}>
                  <Card
                    variant="outlined"
                    onClick={() => setAddTypeOpen(true)}
                    sx={{
                      p: 1.5,
                      textAlign: 'center',
                      cursor: 'pointer',
                      borderStyle: 'dashed',
                      transition: 'transform 0.15s ease',
                      '&:hover': { transform: 'translateY(-2px)' },
                    }}
                  >
                    <Typography fontSize={28}>➕</Typography>
                    <Typography variant="caption" noWrap display="block">
                      New Type
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}
        </Card>
      </Grid>

      <Dialog open={addTypeOpen} onClose={() => setAddTypeOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add New Cloth Type</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            autoFocus
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTypeOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!newTypeName.trim() || isCreatingType} onClick={handleCreateType}>
            {isCreatingType ? 'Adding…' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => !saving && setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Confirm {totalQty} item{totalQty === 1 ? '' : 's'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            {[...cart.values()].map((e) => (
              <Stack
                key={e.clothType ? cartKey(e.clothType._id, e.service._id) : flatKey(e.service._id)}
                direction="row"
                justifyContent="space-between"
                spacing={2}
                sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}
              >
                <Typography variant="body2">
                  {e.clothType ? `${e.clothType.name} · ${e.service.name} × ${e.quantity}` : e.service.name}
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
                  {formatCurrency(lineTotal(e))}
                </Typography>
              </Stack>
            ))}
          </Stack>
          <Stack direction="row" justifyContent="space-between" mt={2} pt={1} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography fontWeight={700}>Total</Typography>
            <Typography fontWeight={700}>{formatCurrency(totalAmount)}</Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleConfirmSave} disabled={saving}>
            {saving ? 'Saving…' : 'Confirm & Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(removeKey)}
        title="Remove this item?"
        description={
          removeEntry
            ? removeEntry.clothType
              ? `${removeEntry.clothType.name} · ${removeEntry.service.name} × ${removeEntry.quantity} will be removed from the list.`
              : `${removeEntry.service.name} will be removed from the list.`
            : undefined
        }
        confirmLabel="Remove"
        confirmColor="error"
        onConfirm={() => {
          if (removeKey) removeFromCart(removeKey);
          setRemoveKey(null);
        }}
        onClose={() => setRemoveKey(null)}
      />
    </Grid>
  );
}
