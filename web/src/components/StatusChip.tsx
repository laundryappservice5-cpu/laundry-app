import { Chip } from '@mui/material';
import type { OrderStage, PickupStatus } from '../types';
import {
  ORDER_STAGE_COLORS,
  ORDER_STAGE_LABELS,
  PICKUP_STATUS_COLORS,
  PICKUP_STATUS_LABELS,
} from '../utils/constants';

export function PickupStatusChip({ status }: { status: PickupStatus }) {
  return <Chip size="small" label={PICKUP_STATUS_LABELS[status]} color={PICKUP_STATUS_COLORS[status]} />;
}

export function OrderStageChip({ stage }: { stage: OrderStage }) {
  return <Chip size="small" label={ORDER_STAGE_LABELS[stage]} color={ORDER_STAGE_COLORS[stage]} />;
}
