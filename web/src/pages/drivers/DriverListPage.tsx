import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useCreateDriverMutation, useListDriversQuery, useSetDriverActiveMutation } from '../../api/driverApi';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { CardGrid } from '../../components/CardGrid';
import { ViewToggle } from '../../components/ViewToggle';
import { useAppSelector } from '../../app/hooks';
import { useClientPagination } from '../../hooks/useClientPagination';
import type { PublicUser } from '../../types';
import { DriverCard } from './DriverCard';

const driverSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  mobileNumber: z.string().min(10, 'Enter a valid mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  vehicleNumber: z.string().optional(),
});

type DriverForm = z.infer<typeof driverSchema>;

export function DriverListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeParam = searchParams.get('active');
  const active = activeParam === 'true' ? true : activeParam === 'false' ? false : undefined;

  const { data: drivers = [], isFetching } = useListDriversQuery(active === undefined ? undefined : { active });
  const [createDriver, { isLoading, error }] = useCreateDriverMutation();
  const [setDriverActive] = useSetDriverActiveMutation();
  const [createOpen, setCreateOpen] = useState(false);
  const viewMode = useAppSelector((state) => state.ui.viewMode);
  const { pageItems, page, limit, total, onPageChange, onLimitChange } = useClientPagination(drivers, 10);

  function clearActiveFilter() {
    searchParams.delete('active');
    setSearchParams(searchParams, { replace: true });
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DriverForm>({ resolver: zodResolver(driverSchema) });

  async function onSubmit(values: DriverForm) {
    await createDriver(values).unwrap();
    reset();
    setCreateOpen(false);
  }

  const columns: DataTableColumn<PublicUser>[] = [
    { key: 'name', header: 'Name', render: (d) => d.name, sortAccessor: (d) => d.name.toLowerCase() },
    { key: 'mobile', header: 'Mobile', render: (d) => d.mobileNumber, sortAccessor: (d) => d.mobileNumber },
    { key: 'vehicle', header: 'Vehicle', render: (d) => d.vehicleNumber ?? '—', sortAccessor: (d) => d.vehicleNumber ?? '' },
    {
      key: 'active',
      header: 'Active',
      render: (d) => (
        <Switch checked={d.isActive} onChange={(e) => setDriverActive({ id: d.id, isActive: e.target.checked })} />
      ),
    },
  ];

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={700}>
          Drivers
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          New Driver
        </Button>
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={1.5}>
          {active !== undefined && (
            <Chip
              label={active ? 'Active only' : 'Inactive only'}
              color={active ? 'success' : 'default'}
              variant="outlined"
              onDelete={clearActiveFilter}
            />
          )}
        </Stack>
        <ViewToggle />
      </Stack>

      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          rows={pageItems}
          rowKey={(d) => d.id}
          loading={isFetching}
          emptyMessage="No drivers yet"
          pagination={{ page, limit, total, onPageChange, onLimitChange }}
        />
      ) : (
        <CardGrid
          rows={pageItems}
          rowKey={(d) => d.id}
          loading={isFetching}
          emptyMessage="No drivers yet"
          pagination={{ page, limit, total, onPageChange, onLimitChange }}
          renderCard={(d) => <DriverCard driver={d} onToggleActive={(isActive) => setDriverActive({ id: d.id, isActive })} />}
        />
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Driver</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={2} mt={1}>
              {error && <Alert severity="error">Could not create driver — mobile number may already be in use.</Alert>}
              <TextField label="Name" fullWidth {...register('name')} error={Boolean(errors.name)} helperText={errors.name?.message} />
              <TextField
                label="Mobile Number"
                fullWidth
                {...register('mobileNumber')}
                error={Boolean(errors.mobileNumber)}
                helperText={errors.mobileNumber?.message}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                {...register('password')}
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
              />
              <TextField label="Vehicle Number" fullWidth {...register('vehicleNumber')} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isLoading}>
              {isLoading ? 'Creating…' : 'Create Driver'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
