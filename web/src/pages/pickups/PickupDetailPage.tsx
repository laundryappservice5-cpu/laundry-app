import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  ImageList,
  ImageListItem,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useGetPickupByIdQuery, useAssignDriverMutation, useCancelPickupMutation } from '../../api/pickupApi';
import { useListDriversQuery } from '../../api/driverApi';
import { PickupStatusChip } from '../../components/StatusChip';
import { ExpressBadge } from '../../components/ExpressBadge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { formatDate, getId, getName } from '../../utils/formatters';

export function PickupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: pickup, isLoading } = useGetPickupByIdQuery(id!);
  const { data: drivers = [] } = useListDriversQuery();
  const [assignDriver, { isLoading: isAssigning }] = useAssignDriverMutation();
  const [cancelPickup, { isLoading: isCancelling }] = useCancelPickupMutation();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [pendingDriverId, setPendingDriverId] = useState<string | null>(null);

  if (isLoading || !pickup) {
    return <Skeleton variant="rectangular" height={300} />;
  }

  const driverId = getId(pickup.assignedDriver);
  const pendingDriver = drivers.find((d) => d.id === pendingDriverId);

  return (
    <Stack spacing={3} maxWidth={900}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Pickup — {getName(pickup.customer)}
          </Typography>
          <Stack direction="row" spacing={1} mt={1} alignItems="center">
            <PickupStatusChip status={pickup.status} />
            {pickup.isExpressPickup && <ExpressBadge label="Express Pickup" />}
            {pickup.isExpressDelivery && <ExpressBadge label="Express Delivery" />}
          </Stack>
        </Box>
        {pickup.status !== 'CANCELLED' && pickup.status !== 'PICKED_UP' && (
          <Button color="error" onClick={() => setCancelOpen(true)}>
            Cancel Pickup
          </Button>
        )}
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Pickup Details
              </Typography>
              <Typography variant="body2">Date: {formatDate(pickup.pickupDate)}</Typography>
              <Typography variant="body2">Time: {pickup.pickupTime}</Typography>
              <Typography variant="body2">Address: {pickup.pickupAddress.address}</Typography>
              {pickup.pickupAddress.area && <Typography variant="body2">Area: {pickup.pickupAddress.area}</Typography>}
              {pickup.specialInstructions && (
                <Typography variant="body2" mt={1}>
                  Instructions: {pickup.specialInstructions}
                </Typography>
              )}
              {pickup.notes && <Typography variant="body2">Notes: {pickup.notes}</Typography>}
              {pickup.cancelledReason && (
                <Typography variant="body2" color="error" mt={1}>
                  Cancelled: {pickup.cancelledReason}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Driver
              </Typography>
              {pickup.status === 'CANCELLED' || pickup.status === 'PICKED_UP' ? (
                <Typography variant="body2">{getName(pickup.assignedDriver, 'Unassigned')}</Typography>
              ) : (
                <TextField
                  select
                  fullWidth
                  label="Assigned Driver"
                  value={driverId ?? ''}
                  onChange={(e) => setPendingDriverId(e.target.value)}
                >
                  <MenuItem value="" disabled>
                    Select a driver
                  </MenuItem>
                  {drivers.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name} {d.vehicleNumber ? `(${d.vehicleNumber})` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </CardContent>
          </Card>
        </Grid>

        {pickup.status === 'PICKED_UP' && (
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Collected Items
                </Typography>
                <Stack spacing={0.5} mb={2}>
                  {pickup.collectedItems.map((item, idx) => (
                    <Typography key={idx} variant="body2">
                      {getName(item.clothType)} · {getName(item.service)} — {item.quantity}
                    </Typography>
                  ))}
                </Stack>
                {pickup.pickupRemarks && <Typography variant="body2">Remarks: {pickup.pickupRemarks}</Typography>}
                {pickup.damagedItemNotes && (
                  <Typography variant="body2" color="warning.main">
                    Damaged/Care notes: {pickup.damagedItemNotes}
                  </Typography>
                )}
                {pickup.images.length > 0 && (
                  <ImageList cols={4} gap={8} sx={{ mt: 2 }}>
                    {pickup.images.map((url) => (
                      <ImageListItem key={url}>
                        <img src={url} alt="Pickup item" loading="lazy" style={{ borderRadius: 8 }} />
                      </ImageListItem>
                    ))}
                  </ImageList>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <ConfirmDialog
        open={Boolean(pendingDriverId)}
        title={driverId ? 'Reassign this pickup?' : 'Assign this pickup?'}
        description={`${getName(pickup.customer)}'s pickup will be assigned to ${pendingDriver?.name ?? 'this driver'}.`}
        confirmLabel={driverId ? 'Reassign' : 'Assign'}
        loading={isAssigning}
        onClose={() => setPendingDriverId(null)}
        onConfirm={async () => {
          if (!pendingDriverId) return;
          await assignDriver({ id: pickup._id, driverId: pendingDriverId });
          setPendingDriverId(null);
        }}
      />

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel this pickup?"
        description="The assigned driver will be notified. This cannot be undone."
        confirmLabel="Cancel Pickup"
        confirmColor="error"
        loading={isCancelling}
        onClose={() => setCancelOpen(false)}
        onConfirm={async () => {
          await cancelPickup({ id: pickup._id, reason: 'Cancelled by admin' });
          setCancelOpen(false);
          navigate('/pickups');
        }}
      />
    </Stack>
  );
}
