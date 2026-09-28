import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import CallOutlinedIcon from '@mui/icons-material/CallOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import {
  useGetOrderByIdQuery,
  useAdvanceOrderStatusMutation,
  useUpdateOrderItemsMutation,
} from '../../api/orderApi';
import { useGenerateBillMutation, useGetBillByIdQuery } from '../../api/billApi';
import { useGetSettingsQuery } from '../../api/settingsApi';
import { ExpressBadge } from '../../components/ExpressBadge';
import { OrderStageChip } from '../../components/StatusChip';
import { CollectedItemsCard } from '../../components/CollectedItemsCard';
import { AddItemsCard } from '../../components/AddItemsCard';
import { useCollectedItemsCart } from '../../hooks/useCollectedItemsCart';
import { BillPdfDialog } from '../../components/BillPdfDialog';
import { ORDER_STAGE_LIST } from '../../utils/constants';
import { formatCurrency, formatDateTime, getId, getName } from '../../utils/formatters';
import { printThermalReceipt } from '../../utils/thermalReceipt';
import { DiscountDialog } from './DiscountDialog';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import { AdvanceStageDialog } from './AdvanceStageDialog';
import type { Bill, Customer } from '../../types';

export function OrderDetailV2Page() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useGetOrderByIdQuery(id!);
  const [advanceStatus] = useAdvanceOrderStatusMutation();
  const [updateOrderItems, { isLoading: isSavingOrderItems }] = useUpdateOrderItemsMutation();

  const billId = order ? getId(order.bill) : undefined;
  const { data: bill } = useGetBillByIdQuery(billId!, { skip: !billId });
  const { data: settings } = useGetSettingsQuery();
  const [generateBill, { isLoading: isGeneratingBill }] = useGenerateBillMutation();
  const generateAttemptedRef = useRef<string | null>(null);

  const [advanceConfirmOpen, setAdvanceConfirmOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [pdfBill, setPdfBill] = useState<Bill | null>(null);

  const itemsCart = useCollectedItemsCart({
    items: order?.collectedItems ?? [],
    onSave: async (updatedItems) => {
      if (!order) return;
      await updateOrderItems({ id: order._id, items: updatedItems });
      if (bill && bill.paymentStatus === 'PENDING') await generateBill({ orderId: order._id });
    },
  });

  useEffect(() => {
    if (!order || bill) return;
    if (order.collectedItems.length === 0) return;
    if (generateAttemptedRef.current === order._id) return;
    generateAttemptedRef.current = order._id;
    generateBill({ orderId: order._id })
      .unwrap()
      .catch(() => {
        generateAttemptedRef.current = null;
      });
  }, [order, bill, generateBill]);

  async function handlePaymentRecorded() {
    if (order && order.currentStatus !== 'DELIVERED') {
      await advanceStatus({ id: order._id, status: 'DELIVERED' }).catch(() => {});
    }
  }

  if (isLoading || !order) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="text" width={280} height={40} />
        <Skeleton variant="rectangular" height={140} />
        <Skeleton variant="rectangular" height={220} />
      </Stack>
    );
  }

  const currentIndex = ORDER_STAGE_LIST.indexOf(order.currentStatus);
  const washingDone = currentIndex >= ORDER_STAGE_LIST.indexOf('READY_FOR_DELIVERY');
  const isDelivered = order.currentStatus === 'DELIVERED';
  const nextStage = washingDone ? undefined : 'READY_FOR_DELIVERY';
  const customer = typeof order.customer === 'object' ? (order.customer as Customer) : undefined;

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" rowGap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Order — {getName(order.customer)}
          </Typography>
          <Stack direction="row" spacing={1} mt={1} alignItems="center" flexWrap="wrap" rowGap={1}>
            <OrderStageChip stage={order.currentStatus} />
            {isDelivered && <Chip size="small" label="Delivered" color="success" />}
            {bill && (
              <Chip
                size="small"
                label={bill.paymentStatus === 'PAID' ? 'Paid' : bill.paymentStatus === 'PARTIAL' ? 'Partially Paid' : 'Not Paid'}
                color={bill.paymentStatus === 'PAID' ? 'success' : bill.paymentStatus === 'PARTIAL' ? 'warning' : 'error'}
              />
            )}
            {order.isExpressPickup && <ExpressBadge label="Express Pickup" />}
            {order.isExpressDelivery && <ExpressBadge label="Express Delivery" />}
          </Stack>
        </Box>

        {/* Quick actions */}
        <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
          {customer?.mobileNumber && (
            <Button variant="outlined" size="small" startIcon={<CallOutlinedIcon />} href={`tel:${customer.mobileNumber}`}>
              Call Customer
            </Button>
          )}
          {bill && (
            <>
              <Button variant="outlined" size="small" startIcon={<PictureAsPdfOutlinedIcon />} onClick={() => setPdfBill(bill)}>
                Invoice
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PrintOutlinedIcon />}
                onClick={() => printThermalReceipt(bill, order, settings)}
              >
                Print
              </Button>
              {bill.paymentStatus !== 'PAID' && (
                <Button variant="contained" size="small" startIcon={<PaymentsOutlinedIcon />} onClick={() => setPaymentOpen(true)}>
                  Record Payment
                </Button>
              )}
            </>
          )}
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* Customer + Order info */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Customer Information
                </Typography>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Name
                    </Typography>
                    <Typography variant="body2">{getName(order.customer)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography variant="body2">{customer?.mobileNumber ?? '—'}</Typography>
                  </Stack>
                  {customer?.addresses?.[0] && (
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                      <Typography variant="body2" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body2" textAlign="right">
                        {customer.addresses[0].address}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Order Information
                </Typography>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Order ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {order._id.slice(-8).toUpperCase()}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body2">{formatDateTime(order.createdAt)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Current Status
                    </Typography>
                    <OrderStageChip stage={order.currentStatus} />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Collection / Delivery
                    </Typography>
                    <Typography variant="body2">{order.isInStoreDelivery ? 'In-Store' : 'Home Delivery'}</Typography>
                  </Stack>
                </Stack>

                {!washingDone && (
                  <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={() => setAdvanceConfirmOpen(true)}>
                    Mark Washing Done
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Payment summary */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Payment
                </Typography>
                {!bill && (
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">
                      {isGeneratingBill ? 'Generating bill…' : 'Add items to generate a bill'}
                    </Typography>
                  </Stack>
                )}
                {bill && (
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Total Amount
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(bill.finalAmount)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Amount Paid
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        {formatCurrency(bill.amountPaid)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Amount Pending
                      </Typography>
                      <Typography variant="body2" color="error.main">
                        {formatCurrency(bill.finalAmount - bill.amountPaid)}
                      </Typography>
                    </Stack>
                    {bill.paymentMethod && (
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Method
                        </Typography>
                        <Typography variant="body2">{bill.paymentMethod}</Typography>
                      </Stack>
                    )}
                    <Divider sx={{ my: 0.5 }} />
                    {bill.paymentStatus === 'PENDING' && (
                      <Button size="small" onClick={() => setDiscountOpen(true)}>
                        Apply Discount
                      </Button>
                    )}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Services */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            <CollectedItemsCard cart={itemsCart} saving={isSavingOrderItems} />
            <AddItemsCard cart={itemsCart} width="100%" />
          </Stack>
        </Grid>
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
      {pdfBill && <BillPdfDialog open={Boolean(pdfBill)} bill={pdfBill} order={order} onClose={() => setPdfBill(null)} />}
      {bill && <DiscountDialog open={discountOpen} billId={bill._id} onClose={() => setDiscountOpen(false)} />}
      {bill && (
        <RecordPaymentDialog
          open={paymentOpen}
          billId={bill._id}
          balanceDue={bill.finalAmount - bill.amountPaid}
          onClose={() => setPaymentOpen(false)}
          onRecorded={handlePaymentRecorded}
        />
      )}
    </Stack>
  );
}
