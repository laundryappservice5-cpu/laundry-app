import { useMemo, useState } from 'react';
import {
  Button,
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
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  useCreateServiceMutation,
  useDeleteServiceMutation,
  useListAllServicesQuery,
  useUpdateServiceMutation,
} from '../../api/catalogApi';
import { DataTableV2, type DataTableColumn } from '../../components/DataTableV2';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useClientPagination } from '../../hooks/useClientPagination';
import { formatCurrency } from '../../utils/formatters';
import type { Service } from '../../types';

interface ServiceFormState {
  name: string;
  category: string;
  unit: string;
  description: string;
  flatPrice: string;
}

const EMPTY_FORM: ServiceFormState = { name: '', category: '', unit: '', description: '', flatPrice: '' };

export function ServicesV2Page() {
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
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          New Service
        </Button>
      </Stack>

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
    </Stack>
  );
}
