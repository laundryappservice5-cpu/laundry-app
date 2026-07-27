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
import type { ClothType, CollectedItem, Service } from '../types';
import { getId, formatCurrency } from '../utils/formatters';

interface CartEntry {
  clothType: ClothType;
  service: Service;
  quantity: number;
}

interface CollectedItemsEditorProps {
  items: CollectedItem[];
  onSave: (items: { clothType: string; service: string; quantity: number }[]) => void | Promise<void>;
  saving?: boolean;
  onChange?: (items: { clothType: string; service: string; quantity: number }[]) => void;
  hideSaveButton?: boolean;
}

function cartKey(clothTypeId: string, serviceId: string): string {
  return `${clothTypeId}::${serviceId}`;
}

export function CollectedItemsEditor({ items, onSave, saving, onChange, hideSaveButton = false }: CollectedItemsEditorProps) {
  const { data: clothTypes = [] } = useListClothTypesQuery();
  const { data: services = [] } = useListServicesQuery();
  const [createClothType, { isLoading: isCreatingType }] = useCreateClothTypeMutation();

  const [activeService, setActiveService] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState(0);

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
  const [dirty, setDirty] = useState(false);

  const filteredTypes = useMemo(
    () => clothTypes.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [clothTypes, search],
  );

  function priceFor(clothType: ClothType, serviceId: string): number | undefined {
    return clothType.prices?.[serviceId];
  }

  function lineTotal(entry: CartEntry): number {
    return (priceFor(entry.clothType, entry.service._id) ?? 0) * entry.quantity;
  }

  const totalQty = useMemo(() => [...cart.values()].reduce((sum, e) => sum + e.quantity, 0), [cart]);
  const totalAmount = useMemo(() => [...cart.values()].reduce((sum, e) => sum + lineTotal(e), 0), [cart]);
  const totalAfterDiscount = Math.max(0, totalAmount - (discountAmount || 0));

  useEffect(() => {
    onChange?.([...cart.values()].map((e) => ({ clothType: e.clothType._id, service: e.service._id, quantity: e.quantity })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  function addToCart(clothType: ClothType) {
    const service = services.find((s) => s._id === activeService);
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
    await onSave([...cart.values()].map((e) => ({ clothType: e.clothType._id, service: e.service._id, quantity: e.quantity })));
    setDirty(false);
  }

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
              const price = priceFor(entry.clothType, entry.service._id);
              return (
                <Grow in key={key}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: 'action.hover',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <Typography fontSize={24}>{getClothTypeIcon(entry.clothType.name)}</Typography>
                    <Box flexGrow={1}>
                      <Typography fontWeight={600}>{entry.clothType.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {entry.service.name} · {price !== undefined ? formatCurrency(price) : 'Price not set'}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => changeQuantity(key, -1)}>
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography sx={{ minWidth: 24, textAlign: 'center' }} fontWeight={700}>
                      {entry.quantity}
                    </Typography>
                    <IconButton size="small" onClick={() => changeQuantity(key, 1)}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => removeFromCart(key)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                    <Typography sx={{ minWidth: 64, textAlign: 'right' }} fontWeight={700} color="primary.main">
                      {formatCurrency(lineTotal(entry))}
                    </Typography>
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
            <Button variant="contained" fullWidth sx={{ mt: 2 }} disabled={!dirty || saving} onClick={handleSave}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          )}
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 7 }}>
        <Card variant="outlined" sx={{ p: 2 }}>
          <Tabs
            value={services.some((s) => s._id === activeService) ? activeService : false}
            onChange={(_, v) => setActiveService(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider', minHeight: 40 }}
          >
            {services.map((svc) => (
              <Tab key={svc._id} label={svc.name} value={svc._id} sx={{ minHeight: 40 }} />
            ))}
          </Tabs>

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
              const key = activeService ? cartKey(ct._id, activeService) : '';
              const qty = cart.get(key)?.quantity ?? 0;
              const price = activeService ? priceFor(ct, activeService) : undefined;
              return (
                <Grid key={ct._id} size={{ xs: 6, sm: 4, md: 3 }}>
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
                    <Typography fontSize={28}>{getClothTypeIcon(ct.name)}</Typography>
                    <Typography variant="caption" noWrap display="block">
                      {ct.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      noWrap
                      color={price !== undefined ? 'primary.main' : 'text.disabled'}
                      fontWeight={600}
                    >
                      {price !== undefined ? formatCurrency(price) : 'Not set'}
                    </Typography>
                  </Card>
                </Grid>
              );
            })}
            <Grid size={{ xs: 6, sm: 4, md: 3 }}>
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
    </Grid>
  );
}
