import { Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShippingOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { OrderStageChip } from '../../components/StatusChip';
import { ExpressBadge } from '../../components/ExpressBadge';
import { formatDateTime, getName } from '../../utils/formatters';
import type { Order } from '../../types';

export function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardActionArea onClick={onClick} sx={{ height: '100%', p: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {getName(order.customer)}
            </Typography>
            <OrderStageChip stage={order.currentStatus} />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" color="text.secondary" mb={0.5}>
            <LocalShippingIcon fontSize="small" />
            <Typography variant="body2" noWrap>
              {getName(order.driver, 'Unassigned')}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" color="text.secondary" mb={1}>
            <ScheduleIcon fontSize="small" />
            <Typography variant="body2">{formatDateTime(order.createdAt)}</Typography>
          </Stack>
          {(order.isExpressPickup || order.isExpressDelivery) && <ExpressBadge />}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
