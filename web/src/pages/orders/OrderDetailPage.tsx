import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  useGetOrderByIdQuery,
  useAssignDeliveryDriverMutation,
  useUpdateOrderItemsMutation,
} from '../../api/orderApi';
import { useGenerateBillMutation, useGetBillByIdQuery } from '../../api/billApi';
import { useGetPickupByIdQuery, useUpdatePickupItemsMutation } from '../../api/pickupApi';
import { useListDriversQuery } from '../../api/driverApi';
import { OrderStageTimeline } from '../../components/OrderStageTimeline';
import { ExpressBadge } from '../../components/ExpressBadge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { OrderStageChip } from '../../components/StatusChip';
import { CollectedItemsEditor } from '../../components/CollectedItemsEditor';
import { BillPdfDialog } from '../../components/BillPdfDialog';
import { ORDER_STAGE_LABELS, ORDER_STAGE_LIST } from '../../utils/constants';
import { formatCurrency, getId, getName } from '../../utils/formatters';
import { printThermalReceipt } from '../../utils/thermalReceipt';
import { useGetSettingsQuery } from '../../api/settingsApi';
import { DRIVER_LOGISTICS_ENABLED } from '../../utils/featureFlags';
import { DiscountDialog } from './DiscountDialog';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import { AdvanceStageDialog } from './AdvanceStageDialog';
import type { Bill, OrderStage } from '../../types';

const SIMPLE_PROGRESS_STAGES: { stage: OrderStage; label: string }[] = [
  { stage: 'READY_FOR_DELIVERY', label: 'Washing Done' },
  { stage: 'DELIVERED', label: 'Delivered' },
];

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useGetOrderByIdQuery(id!);
  const [assignDeliveryDriver, { isLoading: isAssigningDriver }] = useAssignDeliveryDriverMutation();
  const { data: drivers = [] } = useListDriversQuery();
  const [pendingDriverId, setPendingDriverId] = useState<string | null>(null);

  const billId = order ? getId(order.bill) : undefined;
  const { data: bill } = useGetBillByIdQuery(billId!, { skip: !billId });
  const { data: settings } = useGetSettingsQuery();
  const [generateBill, { isLoading: isGeneratingBill }] = useGenerateBillMutation();
  const generateAttemptedRef = useRef<string | null>(null);

  const pickupId = order ? getId(order.pickup) : undefined;
  const { data: pickup } = useGetPickupByIdQuery(pickupId!, { skip: !pickupId });
  const [updatePickupItems, { isLoading: isSavingItems }] = useUpdatePickupItemsMutation();
  const [updateOrderItems, { isLoading: isSavingOrderItems }] = useUpdateOrderItemsMutation();

  const [discountOpen, setDiscountOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [advanceConfirmOpen, setAdvanceConfirmOpen] = useState(false);
  const [pdfBill, setPdfBill] = useState<Bill | null>(null);

  useEffect(() => {
    if (!order || bill) return;
    const idx = ORDER_STAGE_LIST.indexOf(order.currentStatus);
    const eligible = idx >= ORDER_STAGE_LIST.indexOf('READY_FOR_DELIVERY');
    if (!eligible) return;
    if (generateAttemptedRef.current === order._id) return;
    generateAttemptedRef.current = order._id;
    generateBill({ orderId: order._id })
      .unwrap()
      .catch(() => {
        generateAttemptedRef.current = null;
      });
  }, [order, bill, generateBill]);

  if (isLoading || !order) {
    return <Skeleton variant="rectangular" height={400} />;
  }

  const currentIndex = ORDER_STAGE_LIST.indexOf(order.currentStatus);
  let nextStage: typeof order.currentStatus | undefined;
  if (DRIVER_LOGISTICS_ENABLED) {
    nextStage = ORDER_STAGE_LIST[currentIndex + 1];
    if (order.isInStoreDelivery && nextStage === 'OUT_FOR_DELIVERY') {
      nextStage = 'DELIVERED';
    }
  } else {
    nextStage = SIMPLE_PROGRESS_STAGES.map((s) => s.stage).find((stage) => ORDER_STAGE_LIST.indexOf(stage) > currentIndex);
  }
  const canGenerateBill = currentIndex >= ORDER_STAGE_LIST.indexOf('READY_FOR_DELIVERY');
  const driverId = getId(order.driver);
  const pendingDriver = drivers.find((d) => d.id === pendingDriverId);

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 7 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Order — {getName(order.customer)}
            </Typography>
            <Stack direction="row" spacing={1} mt={1} alignItems="center">
              <OrderStageChip stage={order.currentStatus} />
              {order.isExpressPickup && <ExpressBadge label="Express Pickup" />}
              {order.isExpressDelivery && <ExpressBadge label="Express Delivery" />}
              {order.isInStorePickup && <Chip size="small" label="In-Store Pickup" color="info" />}
              {order.isInStoreDelivery && <Chip size="small" label="In-Store Delivery" color="info" />}
            </Stack>
          </Box>

          <Card>
            <CardContent>
              {DRIVER_LOGISTICS_ENABLED ? (
                <>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Processing Pipeline
                    </Typography>
                    {nextStage && (
                      <Button variant="contained" size="small" onClick={() => setAdvanceConfirmOpen(true)}>
                        Advance to {ORDER_STAGE_LABELS[nextStage]}
                      </Button>
                    )}
                  </Stack>
                  <OrderStageTimeline orderId={order._id} currentStatus={order.currentStatus} statusHistory={order.statusHistory} />
                </>
              ) : (
                <>
                  <Typography variant="subtitle1" fontWeight={700} mb={1}>
                    Order Progress
                  </Typography>
                  <Stack>
                    {SIMPLE_PROGRESS_STAGES.map(({ stage, label }) => {
                      const stageIndex = ORDER_STAGE_LIST.indexOf(stage);
                      const done = currentIndex >= stageIndex;
                      const isNext = stage === nextStage;
                      return (
                        <FormControlLabel
                          key={stage}
                          control={
                            <Checkbox
                              checked={done}
                              disabled={!isNext}
                              onChange={() => isNext && setAdvanceConfirmOpen(true)}
                            />
                          }
                          label={label}
                          sx={{ opacity: done || isNext ? 1 : 0.5 }}
                        />
                      );
                    })}
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Stack spacing={3}>
          {DRIVER_LOGISTICS_ENABLED && (
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Delivery Driver
                </Typography>
                {order.isInStoreDelivery ? (
                  <Alert severity="info">Customer will collect this order in-store — no delivery driver needed.</Alert>
                ) : (
                  <TextField
                    select
                    fullWidth
                    size="small"
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
          )}

        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Billing
            </Typography>

            {!bill && !canGenerateBill && (
              <Alert severity="info">A bill will be generated automatically once the order reaches Ready for Delivery.</Alert>
            )}
            {!bill && canGenerateBill && (
              <Stack direction="row" spacing={1.5} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  {isGeneratingBill ? 'Generating bill…' : 'Loading bill…'}
                </Typography>
              </Stack>
            )}

            {bill && (
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Invoice {bill.invoiceNumber}
                  </Typography>
                  <Chip
                    size="small"
                    label={
                      bill.paymentStatus === 'PAID'
                        ? `Paid via ${bill.paymentMethod}`
                        : bill.paymentStatus === 'PARTIAL'
                          ? `Partially Paid — ${formatCurrency(bill.finalAmount - bill.amountPaid)} due`
                          : 'Payment Pending'
                    }
                    color={bill.paymentStatus === 'PAID' ? 'success' : bill.paymentStatus === 'PARTIAL' ? 'info' : 'warning'}
                  />
                </Stack>
                <Divider />
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Subtotal
                    </Typography>
                    <Typography variant="body2">{formatCurrency(bill.subtotal)}</Typography>
                  </Stack>
                  {bill.pickupCharge > 0 && (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Pickup Charge
                      </Typography>
                      <Typography variant="body2">{formatCurrency(bill.pickupCharge)}</Typography>
                    </Stack>
                  )}
                  {bill.deliveryCharge > 0 && (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Delivery Charge
                      </Typography>
                      <Typography variant="body2">{formatCurrency(bill.deliveryCharge)}</Typography>
                    </Stack>
                  )}
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Extra Charges
                    </Typography>
                    <Typography variant="body2">{formatCurrency(bill.extraCharges)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Taxes
                    </Typography>
                    <Typography variant="body2">{formatCurrency(bill.taxes)}</Typography>
                  </Stack>
                  {bill.discount && (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="success.main">
                        Discount ({bill.discount.reason})
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        −{formatCurrency(bill.discount.discountAmount)}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
                <Divider />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight={700}>
                    Final Amount
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="primary.main">
                    {formatCurrency(bill.finalAmount)}
                  </Typography>
                </Stack>

                <Grid container spacing={1.5}>
                  <Grid size={6}>
                    <Button fullWidth variant="outlined" onClick={() => setPdfBill(bill)}>
                      View Invoice
                    </Button>
                  </Grid>
                  <Grid size={6}>
                    <Button fullWidth variant="outlined" onClick={() => printThermalReceipt(bill, order, settings)}>
                      Print Receipt
                    </Button>
                  </Grid>
                  {bill.paymentStatus === 'PENDING' && (
                    <Grid size={6}>
                      <Button fullWidth variant="outlined" onClick={() => setDiscountOpen(true)}>
                        Apply Discount
                      </Button>
                    </Grid>
                  )}
                </Grid>
                {bill.paymentStatus !== 'PAID' && (
                  <Button fullWidth variant="contained" size="large" onClick={() => setPaymentOpen(true)}>
                    {bill.paymentStatus === 'PARTIAL' ? 'Collect Balance' : 'Record Payment'}
                  </Button>
                )}
              </Stack>
            )}
          </CardContent>
        </Card>
        </Stack>
      </Grid>

      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Items
            </Typography>
            {order.isInStorePickup ? (
              <CollectedItemsEditor
                items={order.collectedItems}
                saving={isSavingOrderItems}
                onSave={async (updatedItems) => {
                  await updateOrderItems({ id: order._id, items: updatedItems });
                  if (bill && bill.paymentStatus === 'PENDING') await generateBill({ orderId: order._id });
                }}
              />
            ) : pickup ? (
              <CollectedItemsEditor
                items={pickup.collectedItems}
                saving={isSavingItems}
                onSave={async (updatedItems) => {
                  await updatePickupItems({ id: pickup._id, items: updatedItems });
                  if (bill && bill.paymentStatus === 'PENDING') await generateBill({ orderId: order._id });
                }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Loading items…
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {nextStage && (
        <AdvanceStageDialog
          open={advanceConfirmOpen}
          orderId={order._id}
          fromStage={order.currentStatus}
          toStage={nextStage}
          onClose={() => setAdvanceConfirmOpen(false)}
        />
      )}

      <ConfirmDialog
        open={Boolean(pendingDriverId)}
        title={driverId ? 'Reassign this delivery?' : 'Assign this delivery?'}
        description={`${getName(order.customer)}'s order will be assigned to ${pendingDriver?.name ?? 'this driver'}.`}
        confirmLabel={driverId ? 'Reassign' : 'Assign'}
        loading={isAssigningDriver}
        onClose={() => setPendingDriverId(null)}
        onConfirm={async () => {
          if (!pendingDriverId) return;
          await assignDeliveryDriver({ id: order._id, driverId: pendingDriverId });
          setPendingDriverId(null);
        }}
      />

      {pdfBill && <BillPdfDialog open={Boolean(pdfBill)} bill={pdfBill} order={order} onClose={() => setPdfBill(null)} />}
      {bill && <DiscountDialog open={discountOpen} billId={bill._id} onClose={() => setDiscountOpen(false)} />}
      {bill && (
        <RecordPaymentDialog
          open={paymentOpen}
          billId={bill._id}
          balanceDue={bill.finalAmount - bill.amountPaid}
          onClose={() => setPaymentOpen(false)}
        />
      )}
    </Grid>
  );
}
