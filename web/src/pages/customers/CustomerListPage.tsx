import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useDebounce } from '../../hooks/useDebounce';
import { useSearchCustomersQuery } from '../../api/customerApi';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { CardGrid } from '../../components/CardGrid';
import { ViewToggle } from '../../components/ViewToggle';
import { useAppSelector } from '../../app/hooks';
import type { Customer } from '../../types';
import { CustomerCreateDialog } from './CustomerCreateDialog';
import { CustomerCard } from './CustomerCard';

export function CustomerListPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const debouncedQuery = useDebounce(query, 350);
  const viewMode = useAppSelector((state) => state.ui.viewMode);

  const { data, isFetching } = useSearchCustomersQuery({ q: debouncedQuery, page, limit });
  const customers = data?.items ?? [];

  const columns: DataTableColumn<Customer>[] = [
    { key: 'name', header: 'Name', render: (c) => c.name, sortAccessor: (c) => c.name.toLowerCase() },
    { key: 'mobileNumber', header: 'Mobile', render: (c) => c.mobileNumber, sortAccessor: (c) => c.mobileNumber },
    { key: 'address', header: 'Address', render: (c) => c.addresses[0]?.address ?? '—' },
    { key: 'area', header: 'Area', render: (c) => c.addresses[0]?.area ?? '—', sortAccessor: (c) => c.addresses[0]?.area ?? '' },
  ];

  const paginationProps = { page, limit, total: data?.meta.total ?? 0, onPageChange: setPage, onLimitChange: setLimit };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={700}>
          Customers
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          New Customer
        </Button>
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <TextField
          placeholder="Search by mobile number, name, or address"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          sx={{ maxWidth: 480, flexGrow: 1 }}
        />
        <ViewToggle />
      </Stack>

      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          rows={customers}
          rowKey={(c) => c._id}
          loading={isFetching}
          onRowClick={(c) => navigate(`/customers/${c._id}`)}
          emptyMessage="No customers yet — create one to get started"
          pagination={paginationProps}
        />
      ) : (
        <CardGrid
          rows={customers}
          rowKey={(c) => c._id}
          loading={isFetching}
          emptyMessage="No customers yet — create one to get started"
          pagination={paginationProps}
          renderCard={(c) => <CustomerCard customer={c} onClick={() => navigate(`/customers/${c._id}`)} />}
        />
      )}

      <CustomerCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(customer) => navigate(`/customers/${customer._id}`)}
      />
    </Stack>
  );
}
