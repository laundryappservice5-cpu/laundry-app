import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Box, Card, CardActionArea, CardContent, Grid, Skeleton, Stack, Tooltip, Typography } from '@mui/material';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import LocalLaundryServiceOutlinedIcon from '@mui/icons-material/LocalLaundryServiceOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useGetDashboardQuery, useGetOrderStatusChartQuery, useGetRevenueChartQuery } from '../api/reportApi';
import { formatCurrency } from '../utils/formatters';
import { ORDER_STAGE_LABELS } from '../utils/constants';
import { DASHBOARD_CARD_LINKS } from '../utils/dashboardLinks';
import type { DashboardStats, OrderStage } from '../types';

type StatCardDef = {
  key: keyof DashboardStats;
  compareKey?: keyof DashboardStats;
  comparePeriodLabel?: string;
  label: string;
  format?: 'currency';
  icon: ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error';
  disabled?: boolean;
  disabledReason?: string;
};

const CARDS: StatCardDef[] = [
  { key: 'todaysOrders', compareKey: 'yesterdaysOrders', comparePeriodLabel: 'yesterday', label: "Today's Orders", icon: <Inventory2OutlinedIcon />, color: 'info' },
  { key: 'pendingOrders', label: 'Pending Orders', icon: <PendingActionsOutlinedIcon />, color: 'warning' },
  { key: 'laundryInProgress', label: 'Orders In Progress', icon: <LocalLaundryServiceOutlinedIcon />, color: 'info' },
  { key: 'readyForDelivery', label: 'Ready for Delivery', icon: <Inventory2OutlinedIcon />, color: 'secondary' },
  { key: 'completedOrders', label: 'Completed Orders', icon: <TaskAltOutlinedIcon />, color: 'success' },
  {
    key: 'cancelledOrders',
    label: 'Cancelled Orders',
    icon: <CancelOutlinedIcon />,
    color: 'error',
    disabled: true,
    disabledReason: "Order cancellation isn't supported yet",
  },
  { key: 'dailyRevenue', compareKey: 'yesterdaysRevenue', comparePeriodLabel: 'yesterday', label: "Today's Revenue", format: 'currency', icon: <TrendingUpOutlinedIcon />, color: 'success' },
  { key: 'monthlyRevenue', compareKey: 'lastMonthRevenue', comparePeriodLabel: 'last month', label: "This Month's Revenue", format: 'currency', icon: <CalendarMonthOutlinedIcon />, color: 'primary' },
  { key: 'pendingPayments', label: 'Pending Payments', icon: <ReceiptLongOutlinedIcon />, color: 'error' },
  { key: 'customerCount', label: 'Total Customers', icon: <PeopleOutlineIcon />, color: 'primary' },
];

const DEFAULT_STATS: DashboardStats = {
  todaysPickups: 0,
  pendingPickups: 0,
  laundryInProgress: 0,
  readyForDelivery: 0,
  expressOrders: 0,
  deliveredOrdersToday: 0,
  pendingPayments: 0,
  dailyRevenue: 0,
  monthlyRevenue: 0,
  customerCount: 0,
  driverCount: 0,
  todaysOrders: 0,
  yesterdaysOrders: 0,
  pendingOrders: 0,
  completedOrders: 0,
  cancelledOrders: 0,
  yesterdaysRevenue: 0,
  lastMonthRevenue: 0,
  pendingPaymentsAmount: 0,
};

function ChangeIndicator({ current, previous, periodLabel }: { current: number; previous: number; periodLabel: string }) {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) {
    return (
      <Typography variant="caption" color="success.main" fontWeight={700}>
        New today
      </Typography>
    );
  }
  const pct = ((current - previous) / previous) * 100;
  const isUp = pct >= 0;
  const color = isUp ? 'success.main' : 'error.main';
  return (
    <Stack direction="row" spacing={0.25} alignItems="center">
      {isUp ? (
        <ArrowUpwardIcon sx={{ fontSize: 14, color }} />
      ) : (
        <ArrowDownwardIcon sx={{ fontSize: 14, color }} />
      )}
      <Typography variant="caption" color={color} fontWeight={700}>
        {Math.abs(pct).toFixed(1)}% vs {periodLabel}
      </Typography>
    </Stack>
  );
}

export function DashboardV2Page() {
  const navigate = useNavigate();
  const { data, isLoading } = useGetDashboardQuery();
  const stats = data ?? DEFAULT_STATS;
  const { data: revenuePoints = [] } = useGetRevenueChartQuery({ days: 30 });
  const { data: statusPoints = [] } = useGetOrderStatusChartQuery();

  const revenueChartData = revenuePoints.map((p) => ({ date: p._id.slice(5), revenue: p.total }));
  const statusChartData = statusPoints.map((p) => ({
    stage: ORDER_STAGE_LABELS[p._id as OrderStage] ?? p._id,
    count: p.count,
  }));

  return (
    <Stack spacing={4}>
      <Typography variant="h5" fontWeight={700}>
        Dashboard
      </Typography>

      <Grid container spacing={2}>
        {CARDS.map((card) => {
          const value = stats[card.key] as number;
          const previous = card.compareKey ? (stats[card.compareKey] as number) : undefined;

          const content = (
            <Card
              sx={{
                opacity: card.disabled ? 0.6 : 1,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                '&:hover': card.disabled ? undefined : { transform: 'translateY(-2px)', boxShadow: 4 },
              }}
            >
              <CardActionArea
                disabled={card.disabled}
                onClick={() => navigate(DASHBOARD_CARD_LINKS[card.key])}
                sx={{ cursor: card.disabled ? 'default' : 'pointer' }}
              >
                <CardContent>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                    <Avatar variant="rounded" sx={{ bgcolor: `${card.color}.main`, width: 36, height: 36, opacity: 0.9 }}>
                      {card.icon}
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      {card.label}
                    </Typography>
                  </Stack>
                  {isLoading ? (
                    <Skeleton width={80} height={36} />
                  ) : (
                    <>
                      <Typography variant="h5" fontWeight={700}>
                        {card.format === 'currency' ? formatCurrency(value) : value}
                      </Typography>
                      <Box sx={{ mt: 0.5, minHeight: 18 }}>
                        {previous !== undefined && card.comparePeriodLabel && (
                          <ChangeIndicator current={value} previous={previous} periodLabel={card.comparePeriodLabel} />
                        )}
                      </Box>
                    </>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          );

          return (
            <Grid key={card.key} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              {card.disabled && card.disabledReason ? <Tooltip title={card.disabledReason}>{content}</Tooltip> : content}
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Revenue (Last 30 Days)
              </Typography>
              <Box height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="revenueGradientV2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2455F0" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2455F0" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <ChartTooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Area type="monotone" dataKey="revenue" stroke="#2455F0" fill="url(#revenueGradientV2)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Orders by Stage
              </Typography>
              <Box height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" fontSize={12} allowDecimals={false} />
                    <YAxis type="category" dataKey="stage" fontSize={11} width={120} />
                    <ChartTooltip />
                    <Bar dataKey="count" fill="#00B8A9" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
