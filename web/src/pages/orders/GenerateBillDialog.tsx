import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useGenerateBillMutation } from '../../api/billApi';
import { useGetPickupByIdQuery } from '../../api/pickupApi';
import { useGetSettingsQuery } from '../../api/settingsApi';
import { getId, getName, formatCurrency } from '../../utils/formatters';
import type { Bill, ClothType, Order, Service } from '../../types';

interface GenerateBillDialogProps {
  open: boolean;
  order: Order;
  onClose: () => void;
  onGenerated: (bill: Bill) => void;
}

export function GenerateBillDialog({ open, order, onClose, onGenerated }: GenerateBillDialogProps) {
  const [generateBill, { isLoading, error }] = useGenerateBillMutation();
  const pickupId = getId(order.pickup);
  const { data: pickup } = useGetPickupByIdQuery(pickupId!, { skip: !pickupId || !open });
  const { data: settings } = useGetSettingsQuery();

  const [extraCharges, setExtraCharges] = useState(0);
  const [taxes, setTaxes] = useState(0);
  const [pickupCharge, setPickupCharge] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountReason, setDiscountReason] = useState('');

  useEffect(() => {
    if (!open || !settings) return;
    setPickupCharge(order.isInStorePickup ? 0 : settings.homePickupCharge ?? 0);
    setDeliveryCharge(order.isInStoreDelivery ? 0 : settings.homeDeliveryCharge ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, settings, order._id]);

  const collectedItems = order.isInStorePickup ? order.collectedItems : pickup?.collectedItems;
  const itemsReady = order.isInStorePickup ? true : Boolean(pickup);

  const lines =
    collectedItems?.map((item) => {
      const clothType = typeof item.clothType === 'string' ? undefined : (item.clothType as ClothType);
      const service = typeof item.service === 'string' ? undefined : (item.service as Service);
      const unitPrice = clothType?.prices?.[service?._id ?? ''] ?? 0;
      return {
        key: `${clothType?._id ?? getId(item.clothType)}-${service?._id ?? getId(item.service)}`,
        itemName: clothType?.name ?? getName(item.clothType),
        serviceName: service?.name ?? getName(item.service),
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
      };
    }) ?? [];

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const baseAmount = subtotal + pickupCharge + deliveryCharge + extraCharges + taxes;
  const finalAmount = Math.max(0, baseAmount - (discountAmount || 0));

  async function handleSubmit() {
    const bill = await generateBill({
      orderId: order._id,
      extraCharges: extraCharges || undefined,
      taxes: taxes || undefined,
      pickupCharge,
      deliveryCharge,
      discountAmount: discountAmount || undefined,
      discountReason: discountAmount ? discountReason : undefined,
    }).unwrap();
    onGenerated(bill);
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Generate Bill</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          {error && <Alert severity="error">Could not generate the bill. Make sure item prices are set in Services & Pricing.</Alert>}

          {!itemsReady ? (
            <Typography variant="body2" color="text.secondary">
              Loading items…
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((l) => (
                  <TableRow key={l.key}>
                    <TableCell>{l.itemName}</TableCell>
                    <TableCell>{l.serviceName}</TableCell>
                    <TableCell align="right">{l.quantity}</TableCell>
                    <TableCell align="right">
                      {l.unitPrice === 0 ? (
                        <Typography variant="caption" color="warning.main">
                          Not set
                        </Typography>
                      ) : (
                        formatCurrency(l.unitPrice)
                      )}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(l.lineTotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Grid container spacing={2}>
            <Grid size={6}>
              <TextField
                label="Pickup Charge"
                type="number"
                fullWidth
                value={pickupCharge}
                onChange={(e) => setPickupCharge(Number(e.target.value))}
                helperText={order.isInStorePickup ? 'In-store pickup — no charge by default' : undefined}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Delivery Charge"
                type="number"
                fullWidth
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(Number(e.target.value))}
                helperText={order.isInStoreDelivery ? 'In-store delivery — no charge by default' : undefined}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Extra Charges"
                type="number"
                fullWidth
                value={extraCharges}
                onChange={(e) => setExtraCharges(Number(e.target.value))}
              />
            </Grid>
            <Grid size={6}>
              <TextField label="Taxes" type="number" fullWidth value={taxes} onChange={(e) => setTaxes(Number(e.target.value))} />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Discount Amount"
                type="number"
                fullWidth
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Discount Reason"
                fullWidth
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                disabled={!discountAmount}
              />
            </Grid>
          </Grid>

          <Stack spacing={0.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2">Subtotal</Typography>
              <Typography variant="body2">{formatCurrency(subtotal)}</Typography>
            </Stack>
            {pickupCharge > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Pickup Charge</Typography>
                <Typography variant="body2">{formatCurrency(pickupCharge)}</Typography>
              </Stack>
            )}
            {deliveryCharge > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Delivery Charge</Typography>
                <Typography variant="body2">{formatCurrency(deliveryCharge)}</Typography>
              </Stack>
            )}
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="subtitle1" fontWeight={700}>
                Final Amount
              </Typography>
              <Typography variant="subtitle1" fontWeight={700}>
                {formatCurrency(finalAmount)}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading || !itemsReady || (discountAmount > 0 && !discountReason)}
        >
          {isLoading ? 'Generating…' : 'Generate Bill'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
