import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Chip, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useListOrdersQuery } from '../../api/orderApi';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { CardGrid } from '../../components/CardGrid';
import { ViewToggle } from '../../components/ViewToggle';
import { useAppSelector } from '../../app/hooks';
import { OrderStageChip, PaymentStatusChip } from '../../components/StatusChip';
import { ExpressBadge } from '../../components/ExpressBadge';
import { formatCurrency, formatDateTime, getName } from '../../utils/formatters';
import { ORDER_STAGE_LABELS, ORDER_STAGE_LIST } from '../../utils/constants';
import { DRIVER_LOGISTICS_ENABLED } from '../../utils/featureFlags';
import type { Bill, Order, OrderStage, PaymentStatus } from '../../types';
import { OrderCard } from './OrderCard';

const IN_PROGRESS_EXCLUDE: OrderStage[] = ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED'];

type StatusFilter = OrderStage | 'IN_PROGRESS' | '';

export function OrderListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentStatus, setCurrentStatus] = useState<StatusFilter>((searchParams.get('status') as StatusFilter) || '');
  const [isExpress, setIsExpress] = useState(searchParams.get('express') === 'true');
  const [updatedToday, setUpdatedToday] = useState(searchParams.get('updatedToday') === 'true');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>((searchParams.get('paymentStatus') as PaymentStatus) || '');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const viewMode = useAppSelector((state) => state.ui.viewMode);

  const { data, isFetching } = useListOrdersQuery({
    currentStatus: currentStatus && currentStatus !== 'IN_PROGRESS' ? currentStatus : undefined,
    excludeStatus: currentStatus === 'IN_PROGRESS' ? IN_PROGRESS_EXCLUDE : undefined,
    isExpress: isExpress || undefined,
    updatedToday: updatedToday || undefined,
    paymentStatus: paymentStatus || undefined,
    page,
    limit,
  });
  const orders = data?.items ?? [];

  function getBill(order: Order): Bill | undefined {
    return typeof order.bill === 'object' ? order.bill : undefined;
  }

  const columns: DataTableColumn<Order>[] = [
    { key: 'customer', header: 'Customer', render: (o) => getName(o.customer), sortAccessor: (o) => getName(o.customer).toLowerCase() },
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
    },
    {
      key: 'express',
      header: '',
      render: (o) => (o.isExpressPickup || o.isExpressDelivery ? <ExpressBadge /> : null),
    },
  ];

  const paginationProps = { page, limit, total: data?.meta.total ?? 0, onPageChange: setPage, onLimitChange: setLimit };

  function clearParam(key: string) {
    searchParams.delete(key);
    setSearchParams(searchParams, { replace: true });
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={700}>
          Orders
        </Typography>
        <Button variant="contained" onClick={() => navigate('/orders/walk-in')}>
          New Walk-in Order
        </Button>
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexGrow={1} flexWrap="wrap">
          <TextField
            select
            label="Filter by stage"
            value={currentStatus}
            onChange={(e) => {
              setCurrentStatus(e.target.value as StatusFilter);
              setPage(1);
            }}
            sx={{ minWidth: 220, maxWidth: 260, flexShrink: 0 }}
          >
            <MenuItem value="">All Stages</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress (not yet delivered)</MenuItem>
            {ORDER_STAGE_LIST.map((stage) => (
              <MenuItem key={stage} value={stage}>
                {ORDER_STAGE_LABELS[stage]}
              </MenuItem>
            ))}
          </TextField>
          {isExpress && (
            <Chip
              label="Express only"
              color="warning"
              variant="outlined"
              onDelete={() => {
                setIsExpress(false);
                clearParam('express');
              }}
            />
          )}
          {updatedToday && (
            <Chip
              label="Updated today"
              color="primary"
              variant="outlined"
              onDelete={() => {
                setUpdatedToday(false);
                clearParam('updatedToday');
              }}
            />
          )}
          {paymentStatus && (
            <Chip
              label={`Payment: ${paymentStatus}`}
              color={paymentStatus === 'PENDING' ? 'error' : 'success'}
              variant="outlined"
              onDelete={() => {
                setPaymentStatus('');
                clearParam('paymentStatus');
              }}
            />
          )}
        </Stack>
        <ViewToggle />
      </Stack>

      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          rows={orders}
          rowKey={(o) => o._id}
          loading={isFetching}
          onRowClick={(o) => navigate(`/orders/${o._id}`)}
          pagination={paginationProps}
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
