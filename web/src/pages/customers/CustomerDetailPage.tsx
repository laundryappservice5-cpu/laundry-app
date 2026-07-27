import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Card, CardContent, Chip, Grid, Skeleton, Stack, Typography } from '@mui/material';
import { useGetCustomerByIdQuery } from '../../api/customerApi';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { OrderStageChip } from '../../components/StatusChip';
import { ExpressBadge } from '../../components/ExpressBadge';
import { formatDate, formatDateTime } from '../../utils/formatters';
import type { Order, Pickup } from '../../types';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useGetCustomerByIdQuery(id!);

  if (isLoading || !data) {
    return <Skeleton variant="rectangular" height={300} />;
  }

  const { customer, pickupHistory, orderHistory } = data;

  const pickupColumns: DataTableColumn<Pickup>[] = [
    { key: 'date', header: 'Date', render: (p) => formatDate(p.pickupDate), sortAccessor: (p) => p.pickupDate },
    { key: 'time', header: 'Time', render: (p) => p.pickupTime },
    { key: 'status', header: 'Status', render: (p) => p.status, sortAccessor: (p) => p.status },
    { key: 'express', header: '', render: (p) => (p.isExpressPickup ? <ExpressBadge /> : null) },
  ];

  const orderColumns: DataTableColumn<Order>[] = [
    { key: 'created', header: 'Created', render: (o) => formatDateTime(o.createdAt), sortAccessor: (o) => o.createdAt },
    { key: 'status', header: 'Status', render: (o) => <OrderStageChip stage={o.currentStatus} />, sortAccessor: (o) => o.currentStatus },
  ];

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {customer.name}
          </Typography>
          <Typography color="text.secondary">{customer.mobileNumber}</Typography>
        </Box>
        <Button variant="contained" onClick={() => navigate(`/pickups/new?customerId=${customer._id}`)}>
          New Pickup
        </Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Details
              </Typography>
              <Typography variant="body2">Alternate: {customer.alternateMobile ?? '—'}</Typography>
              <Typography variant="body2" mt={1}>
                Notes: {customer.notes ?? '—'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Addresses
              </Typography>
              <Stack spacing={1}>
                {customer.addresses.map((addr) => (
                  <Box key={addr._id} display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2">
                      {addr.address}
                      {addr.area ? `, ${addr.area}` : ''}
                      {addr.landmark ? ` (near ${addr.landmark})` : ''}
                    </Typography>
                    {addr.isDefault && <Chip size="small" label="Default" />}
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" fontWeight={700}>
        Pickup History
      </Typography>
      <DataTable columns={pickupColumns} rows={pickupHistory} rowKey={(p) => p._id} onRowClick={(p) => navigate(`/pickups/${p._id}`)} />

      <Typography variant="h6" fontWeight={700}>
        Order History
      </Typography>
      <DataTable columns={orderColumns} rows={orderHistory} rowKey={(o) => o._id} onRowClick={(o) => navigate(`/orders/${o._id}`)} />
    </Stack>
  );
}
