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
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import { useCreateClothTypeMutation, useListClothTypesQuery } from '../api/catalogApi';
import { getClothTypeIcon } from '../utils/clothTypeIcons';
import type { ClothType, CollectedItem, Service } from '../types';
import { getId, getName, formatCurrency } from '../utils/formatters';

interface CartEntry {
  clothType: ClothType;
  quantity: number;
}

interface CollectedItemsEditorProps {
  items: CollectedItem[];
  onSave: (items: { clothType: string; quantity: number }[]) => void | Promise<void>;
  saving?: boolean;
  orderServices?: (Service | string)[];
  onChange?: (items: { clothType: string; quantity: number }[]) => void;
  hideSaveButton?: boolean;
}

export function CollectedItemsEditor({
  items,
  onSave,
  saving,
  orderServices = [],
  onChange,
  hideSaveButton = false,
}: CollectedItemsEditorProps) {
  const { data: clothTypes = [] } = useListClothTypesQuery();
  const [createClothType, { isLoading: isCreatingType }] = useCreateClothTypeMutation();

  const [discountAmount, setDiscountAmount] = useState(0);

  function priceChips(clothType: ClothType) {
    return orderServices
      .map((svc) => {
        const serviceId = getId(svc) ?? '';
        const price = clothType.prices?.[serviceId];
        if (price === undefined) return null;
        return { id: serviceId, label: getName(svc), price };
      })
      .filter((c): c is { id: string; label: string; price: number } => c !== null);
  }

  function lineTotal(clothType: ClothType, quantity: number): number {
    return priceChips(clothType).reduce((sum, c) => sum + c.price, 0) * quantity;
  }

  const [cart, setCart] = useState<Map<string, CartEntry>>(() => {
    const map = new Map<string, CartEntry>();
    for (const item of items) {
      const ct = typeof item.clothType === 'string' ? clothTypes.find((c) => c._id === item.clothType) : item.clothType;
      const id = getId(item.clothType);
      if (id && ct) map.set(id, { clothType: ct, quantity: item.quantity });
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

  const totalQty = useMemo(() => [...cart.values()].reduce((sum, e) => sum + e.quantity, 0), [cart]);
  const totalAmount = useMemo(
    () => [...cart.values()].reduce((sum, e) => sum + lineTotal(e.clothType, e.quantity), 0),
    [cart, orderServices],
  );
  const totalAfterDiscount = Math.max(0, totalAmount - (discountAmount || 0));

  useEffect(() => {
    onChange?.([...cart.values()].map((e) => ({ clothType: e.clothType._id, quantity: e.quantity })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  function addToCart(clothType: ClothType) {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(clothType._id);
      next.set(clothType._id, { clothType, quantity: (existing?.quantity ?? 0) + 1 });
      return next;
    });
    setDirty(true);
  }

  function changeQuantity(clothTypeId: string, delta: number) {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(clothTypeId);
      if (!existing) return prev;
      const quantity = existing.quantity + delta;
      if (quantity <= 0) {
        next.delete(clothTypeId);
      } else {
        next.set(clothTypeId, { ...existing, quantity });
      }
      return next;
    });
    setDirty(true);
  }

  function removeFromCart(clothTypeId: string) {
    setCart((prev) => {
      const next = new Map(prev);
      next.delete(clothTypeId);
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
    await onSave([...cart.values()].map((e) => ({ clothType: e.clothType._id, quantity: e.quantity })));
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
              No items yet — tap a cloth type on the right to add it.
            </Alert>
          )}

          <Stack spacing={1}>
            {[...cart.values()].map((entry) => (
              <Grow in key={entry.clothType._id}>
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
                    {priceChips(entry.clothType).length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {priceChips(entry.clothType)
                          .map((c) => `${c.label}: ${formatCurrency(c.price)}`)
                          .join(' · ')}
                      </Typography>
                    )}
                  </Box>
                  <IconButton size="small" onClick={() => changeQuantity(entry.clothType._id, -1)}>
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography sx={{ minWidth: 24, textAlign: 'center' }} fontWeight={700}>
                    {entry.quantity}
                  </Typography>
                  <IconButton size="small" onClick={() => changeQuantity(entry.clothType._id, 1)}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => removeFromCart(entry.clothType._id)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                  {priceChips(entry.clothType).length > 0 && (
                    <Typography sx={{ minWidth: 64, textAlign: 'right' }} fontWeight={700} color="primary.main">
                      {formatCurrency(lineTotal(entry.clothType, entry.quantity))}
                    </Typography>
                  )}
                </Stack>
              </Grow>
            ))}
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
          <TextField
            placeholder="Search cloth types…"
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={1.5}>
            {filteredTypes.map((ct) => (
              <Grid key={ct._id} size={{ xs: 4, sm: 3, md: 3 }}>
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
                  {cart.has(ct._id) && (
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
                      {cart.get(ct._id)!.quantity}
                    </Box>
                  )}
                  <Typography fontSize={28}>{getClothTypeIcon(ct.name)}</Typography>
                  <Typography variant="caption" noWrap display="block">
                    {ct.name}
                  </Typography>
                  {priceChips(ct).map((c) => (
                    <Typography key={c.id} variant="caption" color="primary.main" display="block" noWrap>
                      {formatCurrency(c.price)}
                    </Typography>
                  ))}
                </Card>
              </Grid>
            ))}
            <Grid size={{ xs: 4, sm: 3, md: 3 }}>
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
