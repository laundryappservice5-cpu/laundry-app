import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  useCreateClothTypeMutation,
  useDeleteClothTypeMutation,
  useDeleteServiceMutation,
  useListClothTypesQuery,
  useListServicesQuery,
  useSetClothTypeIconMutation,
  useSetClothTypePriceMutation,
  useUpdateServiceMutation,
} from '../../api/catalogApi';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { IconPickerDialog } from '../../components/IconPickerDialog';
import { getClothTypeIcon } from '../../utils/clothTypeIcons';
import { formatCurrency } from '../../utils/formatters';
import type { ClothType, Service } from '../../types';

export function ServicesPage() {
  const { data: allServices = [] } = useListServicesQuery();
  const { data: clothTypes = [], isLoading } = useListClothTypesQuery();
  const [setPrice, { isLoading: isSaving }] = useSetClothTypePriceMutation();
  const [createClothType, { isLoading: isCreating, error: createError }] = useCreateClothTypeMutation();
  const [updateService, { isLoading: isSavingFlatPrice }] = useUpdateServiceMutation();
  const [deleteClothType, { isLoading: isDeletingClothType }] = useDeleteClothTypeMutation();
  const [deleteService, { isLoading: isDeletingService }] = useDeleteServiceMutation();
  const [setClothTypeIcon] = useSetClothTypeIconMutation();

  const [deleteClothTypeTarget, setDeleteClothTypeTarget] = useState<ClothType | null>(null);
  const [deleteServiceTarget, setDeleteServiceTarget] = useState<Service | null>(null);
  const [iconPickerFor, setIconPickerFor] = useState<ClothType | 'new' | null>(null);
  const [newTypeIcon, setNewTypeIcon] = useState<string | undefined>(undefined);

  const services = allServices.filter((s) => s.flatPrice == null);
  const [flatPriceInputs, setFlatPriceInputs] = useState<Record<string, string>>({});

  const [activeTab, setActiveTab] = useState<'all' | string>('all');
  const [editTarget, setEditTarget] = useState<ClothType | null>(null);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});

  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  function flatPriceValue(service: Service): string {
    return flatPriceInputs[service._id] ?? (service.flatPrice != null ? String(service.flatPrice) : '');
  }

  async function handleSaveFlatPrice(service: Service) {
    const raw = flatPriceValue(service).trim();
    await updateService({ id: service._id, flatPrice: raw ? Number(raw) : null }).unwrap();
  }

  function openEdit(clothType: ClothType) {
    setEditTarget(clothType);
    const inputs: Record<string, string> = {};
    for (const svc of services) {
      inputs[svc._id] = String(clothType.prices?.[svc._id] ?? '');
    }
    setPriceInputs(inputs);
  }

  async function handleSavePrices() {
    if (!editTarget) return;
    const targetServices = activeTab === 'all' ? services : services.filter((s) => s._id === activeTab);
    for (const svc of targetServices) {
      await setPrice({ id: editTarget._id, service: svc._id, price: Number(priceInputs[svc._id] || 0) }).unwrap();
    }
    setEditTarget(null);
  }

  async function handleCreateType() {
    if (!newTypeName.trim()) return;
    await createClothType({ name: newTypeName.trim(), icon: newTypeIcon }).unwrap();
    setNewTypeName('');
    setNewTypeIcon(undefined);
    setAddTypeOpen(false);
  }

  async function handleSelectIcon(icon: string) {
    if (iconPickerFor === 'new') {
      setNewTypeIcon(icon);
    } else if (iconPickerFor) {
      await setClothTypeIcon({ id: iconPickerFor._id, icon }).unwrap();
      if (editTarget?._id === iconPickerFor._id) setEditTarget({ ...editTarget, icon });
    }
    setIconPickerFor(null);
  }

  async function handleConfirmDeleteClothType() {
    if (!deleteClothTypeTarget) return;
    await deleteClothType(deleteClothTypeTarget._id).unwrap();
    setDeleteClothTypeTarget(null);
    if (editTarget?._id === deleteClothTypeTarget._id) setEditTarget(null);
  }

  async function handleConfirmDeleteService() {
    if (!deleteServiceTarget) return;
    await deleteService(deleteServiceTarget._id).unwrap();
    setDeleteServiceTarget(null);
  }

  const editServices: Service[] = activeTab === 'all' ? services : services.filter((s) => s._id === activeTab);

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={700}>
          Services & Pricing
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddTypeOpen(true)}>
          Add Cloth Type
        </Button>
      </Stack>

      <Card variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Direct / Flat-Fee Services
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Give a service a flat price to make it a standalone service (like House Cleaning) — it charges one fixed amount
          instead of per cloth item, can't be combined with other services on the same order, and won't show up in the
          per-item pricing grid below. Clear the price to turn it back into a regular itemized service.
        </Typography>
        <Grid container spacing={2}>
          {allServices.map((svc) => (
            <Grid key={svc._id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  label={svc.name}
                  type="number"
                  size="small"
                  fullWidth
                  placeholder="Itemized (no flat price)"
                  value={flatPriceValue(svc)}
                  onChange={(e) => setFlatPriceInputs({ ...flatPriceInputs, [svc._id]: e.target.value })}
                />
                <Button
                  size="small"
                  variant="outlined"
                  disabled={isSavingFlatPrice || flatPriceValue(svc) === String(svc.flatPrice ?? '')}
                  onClick={() => handleSaveFlatPrice(svc)}
                >
                  Save
                </Button>
                <IconButton size="small" color="error" onClick={() => setDeleteServiceTarget(svc)}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Card>

      <Typography variant="body2" color="text.secondary">
        Set a price for each item under each service. Tap an item card to edit its price{activeTab === 'all' ? 's' : ''}.
      </Typography>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="All" value="all" />
        {services.map((svc) => (
          <Tab key={svc._id} label={svc.name} value={svc._id} />
        ))}
      </Tabs>

      <Grid container spacing={1.5}>
        {!isLoading &&
          clothTypes.map((ct) => (
            <Grid key={ct._id} size={{ xs: 6, sm: 4, md: 3 }}>
              <Card
                variant="outlined"
                onClick={() => openEdit(ct)}
                sx={{
                  p: 1.5,
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                  '&:active': { transform: 'scale(0.96)' },
                }}
              >
                <IconButton
                  size="small"
                  color="error"
                  sx={{ position: 'absolute', top: 2, right: 2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteClothTypeTarget(ct);
                  }}
                >
                  <DeleteOutlineIcon fontSize="inherit" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIconPickerFor(ct);
                  }}
                >
                  <Typography fontSize={28}>{getClothTypeIcon(ct)}</Typography>
                </IconButton>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {ct.name}
                </Typography>
                <Stack spacing={0.25} mt={0.5}>
                  {(activeTab === 'all' ? services : services.filter((s) => s._id === activeTab)).map((svc) => {
                    const price = ct.prices?.[svc._id];
                    return (
                      <Typography key={svc._id} variant="caption" color={price !== undefined ? 'primary.main' : 'text.disabled'}>
                        {activeTab === 'all' ? `${svc.name}: ` : ''}
                        {price !== undefined ? formatCurrency(price) : 'Not set'}
                      </Typography>
                    );
                  })}
                </Stack>
              </Card>
            </Grid>
          ))}
      </Grid>

      <Dialog open={Boolean(editTarget)} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton size="small" onClick={() => editTarget && setIconPickerFor(editTarget)}>
              <Typography fontSize={22}>{editTarget ? getClothTypeIcon(editTarget) : ''}</Typography>
            </IconButton>
            <span>{editTarget?.name} — Pricing</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {editServices.map((svc) => (
              <TextField
                key={svc._id}
                type="number"
                label={`${svc.name} price`}
                fullWidth
                value={priceInputs[svc._id] ?? ''}
                onChange={(e) => setPriceInputs({ ...priceInputs, [svc._id]: e.target.value })}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
          <Button color="error" onClick={() => editTarget && setDeleteClothTypeTarget(editTarget)} disabled={isSaving}>
            Delete
          </Button>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setEditTarget(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSavePrices} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      <Dialog
        open={addTypeOpen}
        onClose={() => {
          setAddTypeOpen(false);
          setNewTypeIcon(undefined);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add Cloth Type</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {createError && <Box color="error.main" component={Typography} variant="body2">This cloth type already exists.</Box>}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconButton
                onClick={() => setIconPickerFor('new')}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
              >
                <Typography fontSize={26}>{newTypeIcon ?? '🧺'}</Typography>
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                Tap to choose an icon (optional — defaults to a basket if skipped)
              </Typography>
            </Stack>
            <TextField label="Name" fullWidth value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddTypeOpen(false);
              setNewTypeIcon(undefined);
            }}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateType} disabled={isCreating || !newTypeName.trim()}>
            {isCreating ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteClothTypeTarget)}
        title={`Delete "${deleteClothTypeTarget?.name}"?`}
        description="This removes it from the catalog for new orders. Past orders and bills that already used it are not affected."
        confirmLabel="Delete"
        confirmColor="error"
        loading={isDeletingClothType}
        onClose={() => setDeleteClothTypeTarget(null)}
        onConfirm={handleConfirmDeleteClothType}
      />

      <ConfirmDialog
        open={Boolean(deleteServiceTarget)}
        title={`Delete "${deleteServiceTarget?.name}"?`}
        description="This removes it from the catalog for new orders. Past orders and bills that already used it are not affected."
        confirmLabel="Delete"
        confirmColor="error"
        loading={isDeletingService}
        onClose={() => setDeleteServiceTarget(null)}
        onConfirm={handleConfirmDeleteService}
      />

      <IconPickerDialog
        open={Boolean(iconPickerFor)}
        value={iconPickerFor === 'new' ? newTypeIcon : iconPickerFor?.icon}
        onSelect={handleSelectIcon}
        onClose={() => setIconPickerFor(null)}
      />
    </Stack>
  );
}
