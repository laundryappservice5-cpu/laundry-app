import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, Stack, Tab, Tabs, Typography } from '@mui/material';
import {
  useGetAdminPerformanceQuery,
  useGetDiscountsReportQuery,
  useGetDriverPerformanceQuery,
  useGetExpressOrdersQuery,
  useGetPaymentsReportQuery,
  useGetRepeatCustomersQuery,
} from '../../api/reportApi';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { OrderStageChip } from '../../components/StatusChip';
import { formatCurrency, formatDateTime, getName } from '../../utils/formatters';
import { useClientPagination } from '../../hooks/useClientPagination';
import type { Bill, Order, Payment } from '../../types';

const TABS = ['Driver Performance', 'Admin Performance', 'Discounts', 'Payments', 'Repeat Customers', 'Express Orders'];

const TAB_SLUGS = ['driver-performance', 'admin-performance', 'discounts', 'payments', 'repeat-customers', 'express-orders'];

export function ReportsPage() {
  const [searchParams] = useSearchParams();
  const initialTab = Math.max(0, TAB_SLUGS.indexOf(searchParams.get('tab') ?? ''));
  const [tab, setTab] = useState(initialTab);

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={700}>
        Reports
      </Typography>
      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          {TABS.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
        <CardContent>
          {tab === 0 && <DriverPerformanceTab />}
          {tab === 1 && <AdminPerformanceTab />}
          {tab === 2 && <DiscountsTab />}
          {tab === 3 && <PaymentsTab />}
          {tab === 4 && <RepeatCustomersTab />}
          {tab === 5 && <ExpressOrdersTab />}
        </CardContent>
      </Card>
    </Stack>
  );
}

function DriverPerformanceTab() {
  const { data = [], isFetching } = useGetDriverPerformanceQuery();
  const { pageItems, page, limit, total, onPageChange, onLimitChange } = useClientPagination(data, 10);
  const columns: DataTableColumn<{ driverName: string; completedOrders: number }>[] = [
    { key: 'name', header: 'Driver', render: (d) => d.driverName, sortAccessor: (d) => d.driverName.toLowerCase() },
    { key: 'count', header: 'Completed Orders', render: (d) => d.completedOrders, align: 'right', sortAccessor: (d) => d.completedOrders },
  ];
  return (
    <DataTable
      columns={columns}
      rows={pageItems}
      rowKey={(d) => d.driverName}
      loading={isFetching}
      pagination={{ page, limit, total, onPageChange, onLimitChange }}
    />
  );
}

function AdminPerformanceTab() {
  const { data = [], isFetching } = useGetAdminPerformanceQuery();
  const { pageItems, page, limit, total, onPageChange, onLimitChange } = useClientPagination(data, 10);
  const columns: DataTableColumn<{ adminName: string; billsGenerated: number; totalRevenue: number }>[] = [
    { key: 'name', header: 'Admin', render: (d) => d.adminName, sortAccessor: (d) => d.adminName.toLowerCase() },
    { key: 'bills', header: 'Bills Generated', render: (d) => d.billsGenerated, align: 'right', sortAccessor: (d) => d.billsGenerated },
    { key: 'revenue', header: 'Total Revenue', render: (d) => formatCurrency(d.totalRevenue), align: 'right', sortAccessor: (d) => d.totalRevenue },
  ];
  return (
    <DataTable
      columns={columns}
      rows={pageItems}
      rowKey={(d) => d.adminName}
      loading={isFetching}
      pagination={{ page, limit, total, onPageChange, onLimitChange }}
    />
  );
}

function DiscountsTab() {
  const { data = [], isFetching } = useGetDiscountsReportQuery();
  const { pageItems, page, limit, total, onPageChange, onLimitChange } = useClientPagination(data, 10);
  const columns: DataTableColumn<Bill>[] = [
    { key: 'invoice', header: 'Invoice', render: (b) => b.invoiceNumber, sortAccessor: (b) => b.invoiceNumber },
    { key: 'original', header: 'Original', render: (b) => formatCurrency(b.discount?.originalAmount ?? 0), align: 'right', sortAccessor: (b) => b.discount?.originalAmount ?? 0 },
    { key: 'discount', header: 'Discount', render: (b) => formatCurrency(b.discount?.discountAmount ?? 0), align: 'right', sortAccessor: (b) => b.discount?.discountAmount ?? 0 },
    { key: 'final', header: 'Final', render: (b) => formatCurrency(b.discount?.finalAmount ?? 0), align: 'right', sortAccessor: (b) => b.discount?.finalAmount ?? 0 },
    { key: 'reason', header: 'Reason', render: (b) => b.discount?.reason ?? '—' },
    { key: 'date', header: 'Date', render: (b) => (b.discount ? formatDateTime(b.discount.timestamp) : '—'), sortAccessor: (b) => b.discount?.timestamp ?? '' },
  ];
  return (
    <DataTable
      columns={columns}
      rows={pageItems}
      rowKey={(b) => b._id}
      loading={isFetching}
      pagination={{ page, limit, total, onPageChange, onLimitChange }}
    />
  );
}

function PaymentsTab() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const { data, isFetching } = useGetPaymentsReportQuery({ page, limit });
  const columns: DataTableColumn<Payment>[] = [
    { key: 'date', header: 'Date', render: (p) => formatDateTime(p.createdAt), sortAccessor: (p) => p.createdAt },
    { key: 'amount', header: 'Amount', render: (p) => formatCurrency(p.amount), align: 'right', sortAccessor: (p) => p.amount },
    { key: 'method', header: 'Method', render: (p) => p.method, sortAccessor: (p) => p.method },
    { key: 'collectedBy', header: 'Collected By', render: (p) => getName(p.collectedBy), sortAccessor: (p) => getName(p.collectedBy).toLowerCase() },
  ];
  return (
    <DataTable
      columns={columns}
      rows={data?.items ?? []}
      rowKey={(p) => p._id}
      loading={isFetching}
      pagination={{ page, limit, total: data?.meta.total ?? 0, onPageChange: setPage, onLimitChange: setLimit }}
    />
  );
}

function RepeatCustomersTab() {
  const { data = [], isFetching } = useGetRepeatCustomersQuery();
  const { pageItems, page, limit, total, onPageChange, onLimitChange } = useClientPagination(data, 10);
  const columns: DataTableColumn<{ name: string; mobileNumber: string; orderCount: number }>[] = [
    { key: 'name', header: 'Customer', render: (c) => c.name, sortAccessor: (c) => c.name.toLowerCase() },
    { key: 'mobile', header: 'Mobile', render: (c) => c.mobileNumber, sortAccessor: (c) => c.mobileNumber },
    { key: 'orders', header: 'Orders', render: (c) => c.orderCount, align: 'right', sortAccessor: (c) => c.orderCount },
  ];
  return (
    <DataTable
      columns={columns}
      rows={pageItems}
      rowKey={(c) => c.mobileNumber}
      loading={isFetching}
      pagination={{ page, limit, total, onPageChange, onLimitChange }}
    />
  );
}

function ExpressOrdersTab() {
  const { data = [], isFetching } = useGetExpressOrdersQuery();
  const { pageItems, page, limit, total, onPageChange, onLimitChange } = useClientPagination(data, 10);
  const columns: DataTableColumn<Order>[] = [
    { key: 'customer', header: 'Customer', render: (o) => getName(o.customer), sortAccessor: (o) => getName(o.customer).toLowerCase() },
    { key: 'driver', header: 'Driver', render: (o) => getName(o.driver, 'Unassigned'), sortAccessor: (o) => getName(o.driver, 'Unassigned').toLowerCase() },
    { key: 'status', header: 'Status', render: (o) => <OrderStageChip stage={o.currentStatus} />, sortAccessor: (o) => o.currentStatus },
    { key: 'created', header: 'Created', render: (o) => formatDateTime(o.createdAt), sortAccessor: (o) => o.createdAt },
  ];
  return (
    <DataTable
      columns={columns}
      rows={pageItems}
      rowKey={(o) => o._id}
      loading={isFetching}
      pagination={{ page, limit, total, onPageChange, onLimitChange }}
    />
  );
}
