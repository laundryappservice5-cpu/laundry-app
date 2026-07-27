import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Chip, MenuItem, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useListPickupsQuery } from '../../api/pickupApi';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { CardGrid } from '../../components/CardGrid';
import { ViewToggle } from '../../components/ViewToggle';
import { useAppSelector } from '../../app/hooks';
import { PickupStatusChip } from '../../components/StatusChip';
import { ExpressBadge } from '../../components/ExpressBadge';
import { formatDate, getName } from '../../utils/formatters';
import type { Pickup, PickupStatus } from '../../types';
import { PickupCard } from './PickupCard';

type StatusFilter = PickupStatus | 'PENDING' | '';

const PENDING_STATUSES: PickupStatus[] = ['CREATED', 'DRIVER_ASSIGNED', 'ACCEPTED'];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending (not picked up)' },
  { value: 'CREATED', label: 'Created' },
  { value: 'DRIVER_ASSIGNED', label: 'Driver Assigned' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'PICKED_UP', label: 'Picked Up' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function PickupListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<StatusFilter>((searchParams.get('status') as StatusFilter) || '');
  const [createdToday, setCreatedToday] = useState(searchParams.get('createdToday') === 'true');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const viewMode = useAppSelector((state) => state.ui.viewMode);

  const { data, isFetching } = useListPickupsQuery({
    status: status === 'PENDING' ? PENDING_STATUSES : status || undefined,
    createdToday: createdToday || undefined,
    page,
    limit,
  });
  const pickups = data?.items ?? [];

  const columns: DataTableColumn<Pickup>[] = [
    { key: 'customer', header: 'Customer', render: (p) => getName(p.customer), sortAccessor: (p) => getName(p.customer).toLowerCase() },
    { key: 'date', header: 'Pickup Date', render: (p) => formatDate(p.pickupDate), sortAccessor: (p) => p.pickupDate },
    { key: 'time', header: 'Time', render: (p) => p.pickupTime },
    { key: 'driver', header: 'Driver', render: (p) => getName(p.assignedDriver, 'Unassigned'), sortAccessor: (p) => getName(p.assignedDriver, 'Unassigned').toLowerCase() },
    { key: 'status', header: 'Status', render: (p) => <PickupStatusChip status={p.status} />, sortAccessor: (p) => p.status },
    { key: 'express', header: '', render: (p) => (p.isExpressPickup ? <ExpressBadge /> : null) },
  ];

  const paginationProps = { page, limit, total: data?.meta.total ?? 0, onPageChange: setPage, onLimitChange: setLimit };

  function clearCreatedToday() {
    setCreatedToday(false);
    searchParams.delete('createdToday');
    setSearchParams(searchParams, { replace: true });
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={700}>
          Pickups
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/pickups/new')}>
          New Pickup
        </Button>
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexGrow={1}>
          <TextField
            select
            label="Filter by status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter);
              setPage(1);
            }}
            sx={{ minWidth: 220, maxWidth: 240, flexShrink: 0 }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
          {createdToday && <Chip label="Created today" onDelete={clearCreatedToday} color="primary" variant="outlined" />}
        </Stack>
        <ViewToggle />
      </Stack>

      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          rows={pickups}
          rowKey={(p) => p._id}
          loading={isFetching}
          onRowClick={(p) => navigate(`/pickups/${p._id}`)}
          pagination={paginationProps}
        />
      ) : (
        <CardGrid
          rows={pickups}
          rowKey={(p) => p._id}
          loading={isFetching}
          pagination={paginationProps}
          renderCard={(p) => <PickupCard pickup={p} onClick={() => navigate(`/pickups/${p._id}`)} />}
        />
      )}
    </Stack>
  );
}
