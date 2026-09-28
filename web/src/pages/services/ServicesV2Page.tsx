import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  useCreateClothTypeMutation,
  useCreateServiceMutation,
  useDeleteClothTypeMutation,
  useDeleteServiceMutation,
  useListAllServicesQuery,
  useListClothTypesQuery,
  useSetClothTypeIconMutation,
  useSetClothTypePriceMutation,
  useUpdateServiceMutation,
} from '../../api/catalogApi';
import { DataTableV2, type DataTableColumn } from '../../components/DataTableV2';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { IconPickerDialog } from '../../components/IconPickerDialog';
import { useClientPagination } from '../../hooks/useClientPagination';
import { getClothTypeIcon } from '../../utils/clothTypeIcons';
import { formatCurrency } from '../../utils/formatters';
import type { ClothType, Service } from '../../types';

interface ServiceFormState {
  name: string;
  category: string;
  unit: string;
  description: string;
  flatPrice: string;
}

const EMPTY_FORM: ServiceFormState = { name: '', category: '', unit: '', description: '', flatPrice: '' };

export function ServicesV2Page() {
  const [section, setSection] = useState<'services' | 'pricing'>('services');
  const { data: services = [], isFetching, isError, refetch } = useListAllServicesQuery();
  const [createService, { isLoading: isCreating, error: createError }] = useCreateServiceMutation();
  const [updateService] = useUpdateServiceMutation();
  const [deleteService, { isLoading: isDeleting }] = useDeleteServiceMutation();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'' | 'active' | 'inactive'>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  // Cloth type pricing
  const { data: clothTypes = [], isLoading: isLoadingClothTypes } = useListClothTypesQuery();
  const [setPrice, { isLoading: isSavingPrice }] = useSetClothTypePriceMutation();
  const [createClothType, { isLoading: isCreatingType, error: createTypeError }] = useCreateClothTypeMutation();
  const [deleteClothType, { isLoading: isDeletingType }] = useDeleteClothTypeMutation();
  const [setClothTypeIcon] = useSetClothTypeIconMutation();
  const itemizedServices = useMemo(() => services.filter((s) => s.flatPrice == null && s.isActive), [services]);

  const [pricingTab, setPricingTab] = useState<'all' | string>('all');
  const [priceEditTarget, setPriceEditTarget] = useState<ClothType | null>(null);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeIcon, setNewTypeIcon] = useState<string | undefined>(undefined);
  const [iconPickerFor, setIconPickerFor] = useState<ClothType | 'new' | null>(null);
  const [deleteClothTypeTarget, setDeleteClothTypeTarget] = useState<ClothType | null>(null);

  const pricingEditServices = pricingTab === 'all' ? itemizedServices : itemizedServices.filter((s) => s._id === pricingTab);

  function openPriceEdit(clothType: ClothType) {
    setPriceEditTarget(clothType);
    const inputs: Record<string, string> = {};
    for (const svc of itemizedServices) {
      inputs[svc._id] = String(clothType.prices?.[svc._id] ?? '');
    }
    setPriceInputs(inputs);
  }

  async function handleSavePrices() {
    if (!priceEditTarget) return;
    const targets = pricingTab === 'all' ? itemizedServices : itemizedServices.filter((s) => s._id === pricingTab);
    for (const svc of targets) {
      await setPrice({ id: priceEditTarget._id, service: svc._id, price: Number(priceInputs[svc._id] || 0) }).unwrap();
    }
    setPriceEditTarget(null);
  }

  async function handleCreateClothType() {
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
      if (priceEditTarget?._id === iconPickerFor._id) setPriceEditTarget({ ...priceEditTarget, icon });
    }
    setIconPickerFor(null);
  }

  async function handleConfirmDeleteClothType() {
    if (!deleteClothTypeTarget) return;
    await deleteClothType(deleteClothTypeTarget._id).unwrap();
    setDeleteClothTypeTarget(null);
    if (priceEditTarget?._id === deleteClothTypeTarget._id) setPriceEditTarget(null);
  }

  const categories = useMemo(
    () => Array.from(new Set(services.map((s) => s.category).filter((c): c is string => Boolean(c)))).sort(),
    [services],
  );

  const filtered = useMemo(() => {
    return services.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (category && s.category !== category) return false;
      if (status === 'active' && !s.isActive) return false;
      if (status === 'inactive' && s.isActive) return false;
      return true;
    });
  }, [services, search, category, status]);

  const { pageItems, page, limit, total, onPageChange, onLimitChange } = useClientPagination(filtered, 10);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(service: Service) {
    setEditTarget(service);
    setForm({
      name: service.name,
      category: service.category ?? '',
      unit: service.unit ?? '',
      description: service.description ?? '',
      flatPrice: service.flatPrice !== undefined ? String(service.flatPrice) : '',
    });
    setFormOpen(true);
  }

  async function handleSubmit() {
    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || undefined,
      unit: form.unit.trim() || undefined,
      description: form.description.trim() || undefined,
      flatPrice: form.flatPrice ? Number(form.flatPrice) : undefined,
    };
    if (editTarget) {
      await updateService({ id: editTarget._id, ...payload });
    } else {
      await createService(payload);
    }
    setFormOpen(false);
  }

  const columns: DataTableColumn<Service>[] = [
    { key: 'name', header: 'Service Name', render: (s) => s.name, sortAccessor: (s) => s.name.toLowerCase() },
    { key: 'category', header: 'Category', render: (s) => s.category ?? '—', sortAccessor: (s) => s.category ?? '' },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      render: (s) => (s.flatPrice !== undefined ? formatCurrency(s.flatPrice) : 'Per cloth type'),
      sortAccessor: (s) => s.flatPrice ?? -1,
    },
    { key: 'unit', header: 'Unit', render: (s) => s.unit ?? '—' },
    { key: 'description', header: 'Description', render: (s) => s.description ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Switch
            size="small"
            checked={s.isActive}
            onClick={(e) => e.stopPropagation()}
            onChange={() => updateService({ id: s._id, isActive: !s.isActive })}
          />
          <Chip size="small" label={s.isActive ? 'Active' : 'Inactive'} color={s.isActive ? 'success' : 'default'} />
        </Stack>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (s) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(s); }}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDeleteTarget(s); }}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={700}>
          Services
        </Typography>
        {section === 'services' ? (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            New Service
          </Button>
        ) : (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddTypeOpen(true)}>
            Add Cloth Type
          </Button>
        )}
      </Stack>

      <Tabs value={section} onChange={(_, v) => setSection(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Services" value="services" />
        <Tab label="Cloth Types & Pricing" value="pricing" />
      </Tabs>

      {section === 'services' && (
        <>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth size="small" label="Search services" value={search} onChange={(e) => setSearch(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField select fullWidth size="small" label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as '' | 'active' | 'inactive')}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          {isError ? (
            <Stack spacing={1.5} alignItems="flex-start">
              <Typography color="error">Could not load services.</Typography>
              <Button variant="outlined" onClick={() => refetch()}>
                Retry
              </Button>
            </Stack>
          ) : (
            <DataTableV2
              columns={columns}
              rows={pageItems}
              rowKey={(s) => s._id}
              loading={isFetching}
              pagination={{ page, limit, total, onPageChange, onLimitChange }}
              emptyMessage="No services match these filters."
            />
          )}
        </>
      )}

      {section === 'pricing' && (
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Set a price for each cloth type under each service. Tap a card to edit its price{pricingTab === 'all' ? 's' : ''} — cards
            show "Not set" wherever a price is still missing.
          </Typography>

          <Tabs value={pricingTab} onChange={(_, v) => setPricingTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="All" value="all" />
            {itemizedServices.map((svc) => (
              <Tab key={svc._id} label={svc.name} value={svc._id} />
            ))}
          </Tabs>

          <Grid container spacing={1.5}>
            {!isLoadingClothTypes &&
              clothTypes.map((ct) => (
                <Grid key={ct._id} size={{ xs: 6, sm: 4, md: 3 }}>
                  <Card
                    variant="outlined"
                    onClick={() => openPriceEdit(ct)}
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
                      {pricingEditServices.map((svc) => {
                        const price = ct.prices?.[svc._id];
                        return (
                          <Typography key={svc._id} variant="caption" color={price !== undefined ? 'primary.main' : 'text.disabled'}>
                            {pricingTab === 'all' ? `${svc.name}: ` : ''}
                            {price !== undefined ? formatCurrency(price) : 'Not set'}
                          </Typography>
                        );
                      })}
                    </Stack>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Stack>
      )}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editTarget ? 'Edit Service' : 'New Service'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {createError && <Typography color="error" variant="body2">Could not save — check the fields and try again.</Typography>}
            <TextField label="Name" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Category" fullWidth value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <TextField label="Unit (e.g. per item, per kg)" fullWidth value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <TextField
              label="Flat Price (leave blank if priced per cloth type)"
              type="number"
              fullWidth
              value={form.flatPrice}
              onChange={(e) => setForm({ ...form, flatPrice: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.name.trim() || isCreating} onClick={handleSubmit}>
            {editTarget ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this service?"
        description={deleteTarget ? `"${deleteTarget.name}" will be permanently removed.` : undefined}
        confirmLabel="Delete"
        confirmColor="error"
        loading={isDeleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await deleteService(deleteTarget._id);
          setDeleteTarget(null);
        }}
      />

      <Dialog open={Boolean(priceEditTarget)} onClose={() => setPriceEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton size="small" onClick={() => priceEditTarget && setIconPickerFor(priceEditTarget)}>
              <Typography fontSize={22}>{priceEditTarget ? getClothTypeIcon(priceEditTarget) : ''}</Typography>
            </IconButton>
            <span>{priceEditTarget?.name} — Pricing</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {pricingEditServices.map((svc) => (
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
          <Button color="error" onClick={() => priceEditTarget && setDeleteClothTypeTarget(priceEditTarget)} disabled={isSavingPrice}>
            Delete
          </Button>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setPriceEditTarget(null)} disabled={isSavingPrice}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSavePrices} disabled={isSavingPrice}>
              {isSavingPrice ? 'Saving…' : 'Save'}
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
            {createTypeError && (
              <Box color="error.main" component={Typography} variant="body2">
                This cloth type already exists.
              </Box>
            )}
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
            disabled={isCreatingType}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateClothType} disabled={isCreatingType || !newTypeName.trim()}>
            {isCreatingType ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteClothTypeTarget)}
        title={`Delete "${deleteClothTypeTarget?.name}"?`}
        description="This removes it from the catalog for new orders. Past orders and bills that already used it are not affected."
        confirmLabel="Delete"
        confirmColor="error"
        loading={isDeletingType}
        onClose={() => setDeleteClothTypeTarget(null)}
        onConfirm={handleConfirmDeleteClothType}
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
