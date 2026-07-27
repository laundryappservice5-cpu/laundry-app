import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  useGetOrderByIdQuery,
  useUpdateOrderServiceStatusMutation,
  useAddOrderServiceMutation,
  useAssignDeliveryDriverMutation,
  useUpdateOrderItemsMutation,
} from '../../api/orderApi';
import { useGetBillByIdQuery } from '../../api/billApi';
import { useGetPickupByIdQuery, useUpdatePickupItemsMutation } from '../../api/pickupApi';
import { useListDriversQuery } from '../../api/driverApi';
import { useListServicesQuery } from '../../api/catalogApi';
import { OrderStageTimeline } from '../../components/OrderStageTimeline';
import { ExpressBadge } from '../../components/ExpressBadge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { OrderStageChip } from '../../components/StatusChip';
import { CollectedItemsEditor } from '../../components/CollectedItemsEditor';
import { BillPdfDialog } from '../../components/BillPdfDialog';
import { ORDER_STAGE_LABELS, ORDER_STAGE_LIST } from '../../utils/constants';
import { formatCurrency, getId, getName } from '../../utils/formatters';
import { GenerateBillDialog } from './GenerateBillDialog';
import { DiscountDialog } from './DiscountDialog';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import { AdvanceStageDialog } from './AdvanceStageDialog';
import type { Bill } from '../../types';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useGetOrderByIdQuery(id!);
  const [updateServiceStatus] = useUpdateOrderServiceStatusMutation();
  const [addOrderService, { isLoading: isAddingService }] = useAddOrderServiceMutation();
  const [assignDeliveryDriver, { isLoading: isAssigningDriver }] = useAssignDeliveryDriverMutation();
  const { data: drivers = [] } = useListDriversQuery();
  const { data: allServices = [] } = useListServicesQuery();
  const [pendingDriverId, setPendingDriverId] = useState<string | null>(null);
  const [addServiceId, setAddServiceId] = useState('');

  const billId = order ? getId(order.bill) : undefined;
  const { data: bill } = useGetBillByIdQuery(billId!, { skip: !billId });

  const pickupId = order ? getId(order.pickup) : undefined;
  const { data: pickup } = useGetPickupByIdQuery(pickupId!, { skip: !pickupId });
  const [updatePickupItems, { isLoading: isSavingItems }] = useUpdatePickupItemsMutation();
  const [updateOrderItems, { isLoading: isSavingOrderItems }] = useUpdateOrderItemsMutation();

  const [generateBillOpen, setGenerateBillOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [advanceConfirmOpen, setAdvanceConfirmOpen] = useState(false);
  const [pdfBill, setPdfBill] = useState<Bill | null>(null);

  if (isLoading || !order) {
    return <Skeleton variant="rectangular" height={400} />;
  }

  const currentIndex = ORDER_STAGE_LIST.indexOf(order.currentStatus);
  let nextStage = ORDER_STAGE_LIST[currentIndex + 1];
  if (order.isInStoreDelivery && nextStage === 'OUT_FOR_DELIVERY') {
    nextStage = 'DELIVERED';
  }
  const allServicesCompleted = order.services.length > 0 && order.services.every((s) => s.isCompleted);
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
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Service Checklist
              </Typography>
              <Stack spacing={1}>
                {order.services.map((s) => {
                  const serviceId = getId(s.service) ?? '';
                  return (
                    <Stack key={serviceId} direction="row" alignItems="center" spacing={1}>
                      <Checkbox
                        checked={s.isCompleted}
                        onChange={(e) => updateServiceStatus({ id: order._id, serviceId, isCompleted: e.target.checked })}
                      />
                      <Typography>{getName(s.service)}</Typography>
                      {s.isCompleted && <Chip size="small" label="Done" color="success" />}
                    </Stack>
                  );
                })}
              </Stack>

              {(() => {
                const existingIds = new Set(order.services.map((s) => getId(s.service)));
                const availableServices = allServices.filter((svc) => !existingIds.has(svc._id));
                if (availableServices.length === 0) return null;
                return (
                  <Stack direction="row" spacing={1} mt={2} alignItems="center">
                    <TextField
                      select
                      size="small"
                      label="Add a service"
                      value={addServiceId}
                      onChange={(e) => setAddServiceId(e.target.value)}
                      sx={{ minWidth: 220 }}
                    >
                      {availableServices.map((svc) => (
                        <MenuItem key={svc._id} value={svc._id}>
                          {svc.name}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={!addServiceId || isAddingService}
                      onClick={async () => {
                        await addOrderService({ id: order._id, serviceId: addServiceId }).unwrap();
                        setAddServiceId('');
                      }}
                    >
                      Add
                    </Button>
                  </Stack>
                );
              })()}
            </CardContent>
          </Card>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Stack spacing={3}>
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

        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Billing
            </Typography>

            {(!bill || bill.paymentStatus !== 'PAID') && (
              <Stack spacing={2} sx={{ mb: bill ? 2 : 0 }}>
                {!allServicesCompleted && (
                  <Alert severity="info">A bill can be generated once every service above is marked complete.</Alert>
                )}
                <Button variant="contained" disabled={!allServicesCompleted} onClick={() => setGenerateBillOpen(true)}>
                  {bill ? 'Regenerate Bill' : 'Generate Bill'}
                </Button>
              </Stack>
            )}

            {bill && (
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary">
                  Invoice {bill.invoiceNumber}
                </Typography>
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Subtotal</Typography>
                  <Typography variant="body2">{formatCurrency(bill.subtotal)}</Typography>
                </Stack>
                {bill.pickupCharge > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Pickup Charge</Typography>
                    <Typography variant="body2">{formatCurrency(bill.pickupCharge)}</Typography>
                  </Stack>
                )}
                {bill.deliveryCharge > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Delivery Charge</Typography>
                    <Typography variant="body2">{formatCurrency(bill.deliveryCharge)}</Typography>
                  </Stack>
                )}
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Extra Charges</Typography>
                  <Typography variant="body2">{formatCurrency(bill.extraCharges)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Taxes</Typography>
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
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography fontWeight={700}>Final Amount</Typography>
                  <Typography fontWeight={700}>{formatCurrency(bill.finalAmount)}</Typography>
                </Stack>
                <Chip
                  label={bill.paymentStatus === 'PAID' ? `Paid via ${bill.paymentMethod}` : 'Payment Pending'}
                  color={bill.paymentStatus === 'PAID' ? 'success' : 'warning'}
                  sx={{ alignSelf: 'flex-start' }}
                />

                <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                  <Button variant="outlined" onClick={() => setPdfBill(bill)}>
                    View Invoice
                  </Button>
                  {bill.paymentStatus !== 'PAID' && (
                    <Button variant="outlined" onClick={() => setDiscountOpen(true)}>
                      Apply Discount
                    </Button>
                  )}
                  {bill.paymentStatus !== 'PAID' && (
                    <Button variant="contained" onClick={() => setPaymentOpen(true)}>
                      Record Payment
                    </Button>
                  )}
                </Stack>
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
                orderServices={order.services.map((s) => s.service)}
                onSave={async (updatedItems) => {
                  await updateOrderItems({ id: order._id, items: updatedItems });
                }}
              />
            ) : pickup ? (
              <CollectedItemsEditor
                items={pickup.collectedItems}
                saving={isSavingItems}
                orderServices={order.services.map((s) => s.service)}
                onSave={async (updatedItems) => {
                  await updatePickupItems({ id: pickup._id, items: updatedItems });
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

      <GenerateBillDialog
        open={generateBillOpen}
        order={order}
        onClose={() => setGenerateBillOpen(false)}
        onGenerated={(generatedBill) => {
          setGenerateBillOpen(false);
          setPdfBill(generatedBill);
        }}
      />
      {pdfBill && <BillPdfDialog open={Boolean(pdfBill)} bill={pdfBill} order={order} onClose={() => setPdfBill(null)} />}
      {bill && <DiscountDialog open={discountOpen} billId={bill._id} onClose={() => setDiscountOpen(false)} />}
      {bill && (
        <RecordPaymentDialog
          open={paymentOpen}
          billId={bill._id}
          defaultAmount={bill.finalAmount}
          onClose={() => setPaymentOpen(false)}
        />
      )}
    </Grid>
  );
}
