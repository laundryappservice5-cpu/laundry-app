import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Box, Card, CardActionArea, CardContent, Grid, Skeleton, Stack, Typography } from '@mui/material';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import LocalLaundryServiceOutlinedIcon from '@mui/icons-material/LocalLaundryServiceOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import { useGetDashboardQuery, useGetOrderStatusChartQuery, useGetRevenueChartQuery } from '../api/reportApi';
import { formatCurrency } from '../utils/formatters';
import { ORDER_STAGE_LABELS } from '../utils/constants';
import { DASHBOARD_CARD_LINKS } from '../utils/dashboardLinks';
import { DRIVER_LOGISTICS_ENABLED } from '../utils/featureFlags';
import type { DashboardStats, OrderStage } from '../types';

type StatCardDef = {
  key: keyof DashboardStats;
  label: string;
  format?: 'currency';
  icon: ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error';
  driverFeature?: boolean;
};

type StatSection = {
  title: string;
  cards: StatCardDef[];
};

const SECTIONS: StatSection[] = [
  {
    title: 'Orders Today',
    cards: [
      { key: 'todaysPickups', label: "Today's Pickups", icon: <Inventory2OutlinedIcon />, color: 'info', driverFeature: true },
      { key: 'pendingPickups', label: 'Pending Pickups', icon: <PendingActionsOutlinedIcon />, color: 'warning', driverFeature: true },
      { key: 'laundryInProgress', label: 'Laundry In Progress', icon: <LocalLaundryServiceOutlinedIcon />, color: 'info' },
      { key: 'readyForDelivery', label: 'Ready for Delivery', icon: <Inventory2OutlinedIcon />, color: 'secondary' },
      { key: 'expressOrders', label: 'Express Orders', icon: <BoltOutlinedIcon />, color: 'warning' },
      { key: 'deliveredOrdersToday', label: 'Delivered Today', icon: <LocalShippingOutlinedIcon />, color: 'success' },
    ],
  },
  {
    title: 'Revenue & Payments',
    cards: [
      { key: 'pendingPayments', label: 'Pending Payments', icon: <ReceiptLongOutlinedIcon />, color: 'error' },
      { key: 'dailyRevenue', label: 'Daily Revenue', format: 'currency', icon: <TrendingUpOutlinedIcon />, color: 'success' },
      { key: 'monthlyRevenue', label: 'Monthly Revenue', format: 'currency', icon: <CalendarMonthOutlinedIcon />, color: 'primary' },
    ],
  },
  {
    title: 'People',
    cards: [
      { key: 'customerCount', label: 'Customers', icon: <PeopleOutlineIcon />, color: 'primary' },
      { key: 'driverCount', label: 'Active Drivers', icon: <BadgeOutlinedIcon />, color: 'secondary', driverFeature: true },
    ],
  },
];

function useStatsOrDefault() {
  const { data } = useGetDashboardQuery();
  return (
    data ?? {
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
    }
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { isLoading } = useGetDashboardQuery();
  const stats = useStatsOrDefault();
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

      {SECTIONS.map((section) => {
        const cards = section.cards.filter((card) => !card.driverFeature || DRIVER_LOGISTICS_ENABLED);
        if (cards.length === 0) return null;

        return (
          <Box key={section.title}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={700} sx={{ mb: 1.5, letterSpacing: 0.4, textTransform: 'uppercase' }}>
              {section.title}
            </Typography>
            <Grid container spacing={2}>
              {cards.map((card) => (
                <Grid key={card.key} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <Card>
                    <CardActionArea onClick={() => navigate(DASHBOARD_CARD_LINKS[card.key])}>
                      <CardContent>
                        <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                          <Avatar
                            variant="rounded"
                            sx={{ bgcolor: `${card.color}.main`, width: 36, height: 36, opacity: 0.9 }}
                          >
                            {card.icon}
                          </Avatar>
                          <Typography variant="body2" color="text.secondary">
                            {card.label}
                          </Typography>
                        </Stack>
                        {isLoading ? (
                          <Skeleton width={80} height={36} />
                        ) : (
                          <Typography variant="h5" fontWeight={700}>
                            {card.format === 'currency' ? formatCurrency(stats[card.key] as number) : (stats[card.key] as number)}
                          </Typography>
                        )}
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      })}

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
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2455F0" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2455F0" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Area type="monotone" dataKey="revenue" stroke="#2455F0" fill="url(#revenueGradient)" strokeWidth={2} />
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
                    <Tooltip />
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
