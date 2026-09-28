import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge, Button, Chip, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import type { Dayjs } from 'dayjs';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { useListOrdersQuery } from '../../api/orderApi';
import { downloadServerCsv } from '../../utils/csvExport';
import { useListServicesQuery } from '../../api/catalogApi';
import { DataTableV2, type DataTableColumn } from '../../components/DataTableV2';
import { CardGrid } from '../../components/CardGrid';
import { ViewToggle } from '../../components/ViewToggle';
import { useAppSelector } from '../../app/hooks';
import { useDebounce } from '../../hooks/useDebounce';
import { OrderStageChip, PaymentStatusChip } from '../../components/StatusChip';
import { ExpressBadge } from '../../components/ExpressBadge';
import { formatCurrency, formatDateTime, getName } from '../../utils/formatters';
import { ORDER_STAGE_LABELS, ORDER_STAGE_LIST } from '../../utils/constants';
import { DRIVER_LOGISTICS_ENABLED } from '../../utils/featureFlags';
import type { Bill, Order, OrderStage, PaymentStatus } from '../../types';
import { OrderCard } from './OrderCard';

const IN_PROGRESS_EXCLUDE: OrderStage[] = ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED'];

type StatusFilter = OrderStage | 'IN_PROGRESS' | '';

export function OrderListV2Page() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [currentStatus, setCurrentStatus] = useState<StatusFilter>((searchParams.get('status') as StatusFilter) || '');
  const [isExpress, setIsExpress] = useState(searchParams.get('express') === 'true');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>((searchParams.get('paymentStatus') as PaymentStatus) || '');
  const [service, setService] = useState('');
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const viewMode = useAppSelector((state) => state.ui.viewMode);
  const { data: services = [] } = useListServicesQuery();

  const activeFilterCount = [
    currentStatus,
    isExpress,
    paymentStatus,
    service,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    debouncedSearch,
  ].filter(Boolean).length;

  function clearAllFilters() {
    setSearch('');
    setCurrentStatus('');
    setIsExpress(false);
    setPaymentStatus('');
    setService('');
    setDateFrom(null);
    setDateTo(null);
    setMinAmount('');
    setMaxAmount('');
    setPage(1);
  }

  const activeFilters = {
    currentStatus: currentStatus && currentStatus !== 'IN_PROGRESS' ? currentStatus : undefined,
    excludeStatus: currentStatus === 'IN_PROGRESS' ? IN_PROGRESS_EXCLUDE : undefined,
    isExpress: isExpress || undefined,
    paymentStatus: paymentStatus || undefined,
    search: debouncedSearch || undefined,
    service: service || undefined,
    dateFrom: dateFrom ? dateFrom.startOf('day').toISOString() : undefined,
    dateTo: dateTo ? dateTo.endOf('day').toISOString() : undefined,
    minAmount: minAmount ? Number(minAmount) : undefined,
    maxAmount: maxAmount ? Number(maxAmount) : undefined,
  };

  const { data, isFetching, isError, refetch } = useListOrdersQuery({ ...activeFilters, page, limit });
  const orders = useMemo(() => data?.items ?? [], [data]);

  async function handleExport() {
    const { excludeStatus, ...rest } = activeFilters;
    await downloadServerCsv('/orders/export', { ...rest, excludeStatus: excludeStatus?.join(',') }, 'orders.csv');
  }

  function getBill(order: Order): Bill | undefined {
    return typeof order.bill === 'object' ? order.bill : undefined;
  }

  const columns: DataTableColumn<Order>[] = [
    { key: 'customer', header: 'Customer', render: (o) => getName(o.customer), sortAccessor: (o) => getName(o.customer).toLowerCase() },
    {
      key: 'phone',
      header: 'Phone',
      render: (o) => (typeof o.customer === 'object' ? o.customer.mobileNumber : '—'),
    },
    ...(DRIVER_LOGISTICS_ENABLED
      ? [
          {
            key: 'driver',
            header: 'Driver',
            render: (o) => getName(o.driver, 'Unassigned'),
            sortAccessor: (o) => getName(o.driver, 'Unassigned').toLowerCase(),
          } satisfies DataTableColumn<Order>,
        ]
      : []),
    { key: 'created', header: 'Created', render: (o) => formatDateTime(o.createdAt), sortAccessor: (o) => o.createdAt },
    { key: 'status', header: 'Status', render: (o) => <OrderStageChip stage={o.currentStatus} />, sortAccessor: (o) => o.currentStatus },
    {
      key: 'paymentStatus',
      header: 'Paid Status',
      render: (o) => {
        const bill = getBill(o);
        return bill ? <PaymentStatusChip status={bill.paymentStatus} /> : '—';
      },
      sortAccessor: (o) => getBill(o)?.paymentStatus ?? '',
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (o) => {
        const bill = getBill(o);
        return bill ? formatCurrency(bill.finalAmount) : '—';
      },
      sortAccessor: (o) => getBill(o)?.finalAmount ?? 0,
      align: 'right',
    },
    {
      key: 'express',
      header: '',
      render: (o) => (o.isExpressPickup || o.isExpressDelivery ? <ExpressBadge /> : null),
    },
  ];

  const paginationProps = { page, limit, total: data?.meta.total ?? 0, onPageChange: setPage, onLimitChange: setLimit };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={700}>
          Orders
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="contained" onClick={() => navigate('/orders/walk-in')}>
            New Walk-in Order
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={2}>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Search customer or phone"
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
              label="Stage"
              value={currentStatus}
              onChange={(e) => {
                setCurrentStatus(e.target.value as StatusFilter);
                setPage(1);
              }}
            >
              <MenuItem value="">All Stages</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress (not yet delivered)</MenuItem>
              {ORDER_STAGE_LIST.map((stage) => (
                <MenuItem key={stage} value={stage}>
                  {ORDER_STAGE_LABELS[stage]}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Payment Status"
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value as PaymentStatus | '');
                setPage(1);
              }}
            >
              <MenuItem value="">Any Payment Status</MenuItem>
              <MenuItem value="PENDING">Not Paid</MenuItem>
              <MenuItem value="PARTIAL">Partially Paid</MenuItem>
              <MenuItem value="PAID">Paid</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Service"
              value={service}
              onChange={(e) => {
                setService(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">Any Service</MenuItem>
              {services.map((s) => (
                <MenuItem key={s._id} value={s._id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DatePicker
              label="Created from"
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
              label="Created to"
              value={dateTo}
              onChange={(v) => {
                setDateTo(v);
                setPage(1);
              }}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 1.5 }}>
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
          <Grid size={{ xs: 6, sm: 3, md: 1.5 }}>
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

        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" rowGap={1}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={1}>
            {isExpress && (
              <Chip
                size="small"
                label="Express only"
                color="warning"
                variant="outlined"
                onDelete={() => {
                  setIsExpress(false);
                  setPage(1);
                }}
              />
            )}
            {activeFilterCount > 0 && (
              <Badge badgeContent={activeFilterCount} color="primary">
                <Button size="small" startIcon={<ClearAllIcon />} onClick={clearAllFilters}>
                  Clear all filters
                </Button>
              </Badge>
            )}
          </Stack>
          <ViewToggle />
        </Stack>
      </Stack>

      {isError ? (
        <Stack spacing={1.5} alignItems="flex-start">
          <Typography color="error">Could not load orders.</Typography>
          <Button variant="outlined" onClick={() => refetch()}>
            Retry
          </Button>
        </Stack>
      ) : viewMode === 'table' ? (
        <DataTableV2
          columns={columns}
          rows={orders}
          rowKey={(o) => o._id}
          loading={isFetching}
          onRowClick={(o) => navigate(`/orders/${o._id}`)}
          pagination={paginationProps}
          emptyMessage={activeFilterCount > 0 ? 'No orders match these filters.' : 'No orders yet.'}
        />
      ) : (
        <CardGrid
          rows={orders}
          rowKey={(o) => o._id}
          loading={isFetching}
          pagination={paginationProps}
          renderCard={(o) => <OrderCard order={o} onClick={() => navigate(`/orders/${o._id}`)} />}
        />
      )}
    </Stack>
  );
}
