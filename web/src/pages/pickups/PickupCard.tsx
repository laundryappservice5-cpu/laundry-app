import { Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import LocalShippingIcon from '@mui/icons-material/LocalShippingOutlined';
import { PickupStatusChip } from '../../components/StatusChip';
import { ExpressBadge } from '../../components/ExpressBadge';
import { formatDate, getName } from '../../utils/formatters';
import type { Pickup } from '../../types';

export function PickupCard({ pickup, onClick }: { pickup: Pickup; onClick: () => void }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardActionArea onClick={onClick} sx={{ height: '100%', p: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {getName(pickup.customer)}
            </Typography>
            <PickupStatusChip status={pickup.status} />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" color="text.secondary" mb={0.5}>
            <EventIcon fontSize="small" />
            <Typography variant="body2">
              {formatDate(pickup.pickupDate)} — {pickup.pickupTime}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" color="text.secondary" mb={1}>
            <LocalShippingIcon fontSize="small" />
            <Typography variant="body2" noWrap>
              {getName(pickup.assignedDriver, 'Unassigned')}
            </Typography>
          </Stack>
          {(pickup.isExpressPickup || pickup.isExpressDelivery) && <ExpressBadge />}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
