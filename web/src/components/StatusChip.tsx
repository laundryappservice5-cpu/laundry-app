import { Chip } from '@mui/material';
import type { OrderStage, PaymentStatus, PickupStatus } from '../types';
import {
  ORDER_STAGE_COLORS,
  ORDER_STAGE_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PICKUP_STATUS_COLORS,
  PICKUP_STATUS_LABELS,
} from '../utils/constants';

export function PickupStatusChip({ status }: { status: PickupStatus }) {
  return <Chip size="small" label={PICKUP_STATUS_LABELS[status]} color={PICKUP_STATUS_COLORS[status]} />;
}

export function OrderStageChip({ stage }: { stage: OrderStage }) {
  return <Chip size="small" label={ORDER_STAGE_LABELS[stage]} color={ORDER_STAGE_COLORS[stage]} />;
}

export function PaymentStatusChip({ status }: { status: PaymentStatus }) {
  return <Chip size="small" label={PAYMENT_STATUS_LABELS[status]} color={PAYMENT_STATUS_COLORS[status]} />;
}
