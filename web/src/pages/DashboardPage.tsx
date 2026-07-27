import { useNavigate } from 'react-router-dom';
import { Box, Card, CardActionArea, CardContent, Grid, Skeleton, Stack, Typography } from '@mui/material';
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
import { useGetDashboardQuery, useGetOrderStatusChartQuery, useGetRevenueChartQuery } from '../api/reportApi';
import { formatCurrency } from '../utils/formatters';
import { ORDER_STAGE_LABELS } from '../utils/constants';
import { DASHBOARD_CARD_LINKS } from '../utils/dashboardLinks';
import type { DashboardStats, OrderStage } from '../types';

const STAT_CARDS: { key: keyof DashboardStats; label: string; format?: 'currency' }[] = [
  { key: 'todaysPickups', label: "Today's Pickups" },
  { key: 'pendingPickups', label: 'Pending Pickups' },
  { key: 'laundryInProgress', label: 'Laundry In Progress' },
  { key: 'readyForDelivery', label: 'Ready for Delivery' },
  { key: 'expressOrders', label: 'Express Orders' },
  { key: 'deliveredOrdersToday', label: 'Delivered Today' },
  { key: 'pendingPayments', label: 'Pending Payments' },
  { key: 'dailyRevenue', label: 'Daily Revenue', format: 'currency' },
  { key: 'monthlyRevenue', label: 'Monthly Revenue', format: 'currency' },
  { key: 'customerCount', label: 'Customers' },
  { key: 'driverCount', label: 'Active Drivers' },
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
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={700}>
        Dashboard
      </Typography>

      <Grid container spacing={2}>
        {STAT_CARDS.map((card) => (
          <Grid key={card.key} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Card>
              <CardActionArea onClick={() => navigate(DASHBOARD_CARD_LINKS[card.key])}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {card.label}
                  </Typography>
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
