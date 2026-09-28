import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Card, CardContent, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import type { Dayjs } from 'dayjs';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { useListPaymentsQuery, useGetPaymentSummaryQuery } from '../../api/paymentApi';
import { DataTableV2, type DataTableColumn } from '../../components/DataTableV2';
import { formatCurrency, formatDateTime, getName } from '../../utils/formatters';
import { downloadServerCsv } from '../../utils/csvExport';
import type { PaymentListRow } from '../../types';

function SummaryCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
          <Avatar variant="rounded" sx={{ bgcolor: color, width: 36, height: 36 }}>
            {icon}
          </Avatar>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Stack>
        <Typography variant="h5" fontWeight={700}>
          {formatCurrency(value)}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function PaymentsPage() {
  const navigate = useNavigate();
  const [method, setMethod] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data: summary } = useGetPaymentSummaryQuery();
  const activeFilters = {
    method: method || undefined,
    search: search || undefined,
    dateFrom: dateFrom ? dateFrom.startOf('day').toISOString() : undefined,
    dateTo: dateTo ? dateTo.endOf('day').toISOString() : undefined,
    minAmount: minAmount ? Number(minAmount) : undefined,
    maxAmount: maxAmount ? Number(maxAmount) : undefined,
  };
  const { data, isFetching, isError, refetch } = useListPaymentsQuery({ ...activeFilters, page, limit });

  async function handleExport() {
    await downloadServerCsv('/payments/export', activeFilters, 'payments.csv');
  }

  const columns: DataTableColumn<PaymentListRow>[] = [
    { key: 'date', header: 'Date', render: (p) => formatDateTime(p.createdAt), sortAccessor: (p) => p.createdAt },
    { key: 'orderId', header: 'Order ID', render: (p) => p.order._id.slice(-8).toUpperCase() },
    { key: 'customer', header: 'Customer', render: (p) => getName(p.customer) },
    { key: 'amount', header: 'Amount', align: 'right', render: (p) => formatCurrency(p.amount), sortAccessor: (p) => p.amount },
    { key: 'method', header: 'Method', render: (p) => p.method },
    { key: 'reference', header: 'Reference', render: (p) => p.referenceId ?? '—' },
    { key: 'collectedBy', header: 'Created By', render: (p) => getName(p.collectedBy) },
  ];

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={700}>
          Payments
        </Typography>
        <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={handleExport}>
          Export CSV
        </Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard label="Total Collected" value={summary?.totalCollected ?? 0} icon={<PaymentsOutlinedIcon />} color="success.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard label="Today's Collection" value={summary?.todaysCollection ?? 0} icon={<TodayOutlinedIcon />} color="info.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard label="This Month's Collection" value={summary?.monthsCollection ?? 0} icon={<CalendarMonthOutlinedIcon />} color="primary.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard label="Pending Payments" value={summary?.pendingAmount ?? 0} icon={<PendingActionsOutlinedIcon />} color="error.main" />
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            size="small"
            label="Search customer"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Method"
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="">Any Method</MenuItem>
            <MenuItem value="CASH">Cash</MenuItem>
            <MenuItem value="UPI">UPI</MenuItem>
            <MenuItem value="CARD">Card</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DatePicker
            label="From"
            value={dateFrom}
            onChange={(v) => {
              setDateFrom(v);
              setPage(1);
            }}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DatePicker
            label="To"
            value={dateTo}
            onChange={(v) => {
              setDateTo(v);
              setPage(1);
            }}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            label="Min ₹"
            type="number"
            value={minAmount}
            onChange={(e) => {
              setMinAmount(e.target.value);
              setPage(1);
            }}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            label="Max ₹"
            type="number"
            value={maxAmount}
            onChange={(e) => {
              setMaxAmount(e.target.value);
              setPage(1);
            }}
          />
        </Grid>
      </Grid>

      {isError ? (
        <Stack spacing={1.5} alignItems="flex-start">
          <Typography color="error">Could not load payments.</Typography>
          <Button variant="outlined" onClick={() => refetch()}>
            Retry
          </Button>
        </Stack>
      ) : (
        <DataTableV2
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(p) => p._id}
          loading={isFetching}
          onRowClick={(p) => navigate(`/orders/${p.order._id}`)}
          pagination={{ page, limit, total: data?.meta.total ?? 0, onPageChange: setPage, onLimitChange: setLimit }}
          emptyMessage="No payments match these filters."
        />
      )}
    </Stack>
  );
}
