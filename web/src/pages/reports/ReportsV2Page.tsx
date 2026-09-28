import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Button, Card, CardContent, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import {
  useGetMonthlyEarningsQuery,
  useGetDiscountsReportQuery,
  useGetRepeatCustomersQuery,
  useGetExpressOrdersQuery,
} from '../../api/reportApi';
import { DataTableV2, type DataTableColumn } from '../../components/DataTableV2';
import { formatCurrency, formatDateTime, getName } from '../../utils/formatters';
import { downloadCsv } from '../../utils/csvExport';
import { DRIVER_LOGISTICS_ENABLED } from '../../utils/featureFlags';
import {
  DriverPerformanceTab,
  AdminPerformanceTab,
  DiscountsTab,
  PaymentsTab,
  RepeatCustomersTab,
  ExpressOrdersTab,
} from './ReportsPage';
import type { Bill, Order } from '../../types';

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function MonthlyEarningsTab() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { data = [], isFetching } = useGetMonthlyEarningsQuery({ year });

  const chartData = data.map((row) => ({ month: MONTH_LABELS[row.month - 1].slice(0, 3), Revenue: row.revenue, Paid: row.paid }));

  function handleExport() {
    downloadCsv(
      `monthly-earnings-${year}`,
      [
        { header: 'Month', accessor: (r: (typeof data)[number]) => MONTH_LABELS[r.month - 1] },
        { header: 'Orders', accessor: (r) => r.orders },
        { header: 'Revenue', accessor: (r) => r.revenue },
        { header: 'Paid', accessor: (r) => r.paid },
        { header: 'Pending', accessor: (r) => r.pending },
        { header: 'Refunds', accessor: (r) => r.refunds },
        { header: 'Net Earnings', accessor: (r) => r.netEarnings },
      ],
      data,
    );
  }

  const tableColumns: DataTableColumn<(typeof data)[number]>[] = [
    { key: 'month', header: 'Month', render: (r) => MONTH_LABELS[r.month - 1] },
    { key: 'orders', header: 'Orders', align: 'right', render: (r) => r.orders },
    { key: 'revenue', header: 'Revenue', align: 'right', render: (r) => formatCurrency(r.revenue) },
    { key: 'paid', header: 'Paid', align: 'right', render: (r) => formatCurrency(r.paid) },
    { key: 'pending', header: 'Pending', align: 'right', render: (r) => formatCurrency(r.pending) },
    { key: 'refunds', header: 'Refunds', align: 'right', render: (r) => formatCurrency(r.refunds) },
    { key: 'net', header: 'Net Earnings', align: 'right', render: (r) => formatCurrency(r.netEarnings) },
  ];

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" rowGap={1}>
        <TextField
          select
          size="small"
          label="Year"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          sx={{ minWidth: 140 }}
        >
          {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
            <MenuItem key={y} value={y}>
              {y}
            </MenuItem>
          ))}
        </TextField>
        <Button variant="outlined" size="small" startIcon={<DownloadOutlinedIcon />} onClick={handleExport}>
          Export CSV
        </Button>
      </Stack>

      <Card>
        <CardContent>
          <Box height={280}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="Revenue" fill="#2455F0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Paid" fill="#00B8A9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      <DataTableV2 columns={tableColumns} rows={data} rowKey={(r) => String(r.month)} loading={isFetching} />
    </Stack>
  );
}

function DiscountsExportableTab() {
  const { data = [] } = useGetDiscountsReportQuery();
  return (
    <Stack spacing={1.5}>
      <Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadOutlinedIcon />}
          onClick={() =>
            downloadCsv(
              'discounts',
              [
                { header: 'Invoice', accessor: (b: Bill) => b.invoiceNumber },
                { header: 'Original', accessor: (b) => b.discount?.originalAmount ?? 0 },
                { header: 'Discount', accessor: (b) => b.discount?.discountAmount ?? 0 },
                { header: 'Final', accessor: (b) => b.discount?.finalAmount ?? 0 },
                { header: 'Reason', accessor: (b) => b.discount?.reason ?? '' },
              ],
              data,
            )
          }
        >
          Export CSV
        </Button>
      </Box>
      <DiscountsTab />
    </Stack>
  );
}

function ExpressOrdersExportableTab() {
  const { data = [] } = useGetExpressOrdersQuery();
  return (
    <Stack spacing={1.5}>
      <Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadOutlinedIcon />}
          onClick={() =>
            downloadCsv(
              'express-orders',
              [
                { header: 'Customer', accessor: (o: Order) => getName(o.customer) },
                { header: 'Status', accessor: (o) => o.currentStatus },
                { header: 'Created', accessor: (o) => formatDateTime(o.createdAt) },
              ],
              data,
            )
          }
        >
          Export CSV
        </Button>
      </Box>
      <ExpressOrdersTab />
    </Stack>
  );
}

function RepeatCustomersExportableTab() {
  const { data = [] } = useGetRepeatCustomersQuery();
  return (
    <Stack spacing={1.5}>
      <Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadOutlinedIcon />}
          onClick={() =>
            downloadCsv(
              'repeat-customers',
              [
                { header: 'Name', accessor: (c: (typeof data)[number]) => c.name },
                { header: 'Mobile', accessor: (c) => c.mobileNumber },
                { header: 'Orders', accessor: (c) => c.orderCount },
              ],
              data,
            )
          }
        >
          Export CSV
        </Button>
      </Box>
      <RepeatCustomersTab />
    </Stack>
  );
}

const ALL_TABS = [
  { label: 'Monthly Earnings', slug: 'monthly-earnings', Component: MonthlyEarningsTab },
  { label: 'Driver Performance', slug: 'driver-performance', driverFeature: true, Component: DriverPerformanceTab },
  { label: 'Admin Performance', slug: 'admin-performance', Component: AdminPerformanceTab },
  { label: 'Discounts', slug: 'discounts', Component: DiscountsExportableTab },
  { label: 'Payments', slug: 'payments', Component: PaymentsTab },
  { label: 'Repeat Customers', slug: 'repeat-customers', Component: RepeatCustomersExportableTab },
  { label: 'Express Orders', slug: 'express-orders', Component: ExpressOrdersExportableTab },
];

const TABS = ALL_TABS.filter((t) => !t.driverFeature || DRIVER_LOGISTICS_ENABLED);

export function ReportsV2Page() {
  const [searchParams] = useSearchParams();
  const initialTab = Math.max(0, TABS.findIndex((t) => t.slug === searchParams.get('tab')));
  const [tab, setTab] = useState(initialTab);
  const ActiveTab = TABS[tab]?.Component;

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={700}>
        Reports
      </Typography>
      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          {TABS.map((t) => (
            <Tab key={t.slug} label={t.label} />
          ))}
        </Tabs>
        <CardContent>{ActiveTab && <ActiveTab />}</CardContent>
      </Card>
    </Stack>
  );
}
