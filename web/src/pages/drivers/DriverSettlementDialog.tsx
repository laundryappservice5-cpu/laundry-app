import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useGetPendingForDriverQuery, useSettlePaymentsMutation } from '../../api/paymentApi';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { formatCurrency, formatDateTime, getId } from '../../utils/formatters';

interface DriverSettlementDialogProps {
  open: boolean;
  driverId: string;
  driverName: string;
  onClose: () => void;
}

export function DriverSettlementDialog({ open, driverId, driverName, onClose }: DriverSettlementDialogProps) {
  const { data: payments = [], isFetching } = useGetPendingForDriverQuery(driverId, { skip: !open });
  const [settlePayments, { isLoading: isSettling, error }] = useSettlePaymentsMutation();
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) setSelected([]);
  }, [open]);

  const allSelected = payments.length > 0 && selected.length === payments.length;
  const selectedTotal = payments.filter((p) => selected.includes(p._id)).reduce((sum, p) => sum + p.amount, 0);

  function toggleAll() {
    setSelected(allSelected ? [] : payments.map((p) => p._id));
  }

  function toggleOne(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleConfirmSettle() {
    await settlePayments({ paymentIds: selected }).unwrap();
    setConfirmOpen(false);
    setSelected([]);
    if (payments.length === selected.length) onClose();
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Cash to Collect — {driverName}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {error && <Alert severity="error">Could not mark these payments as received. Try again.</Alert>}
            <Typography variant="body2" color="text.secondary">
              These are payments {driverName} has collected from customers but hasn't handed over yet. Select the ones they've
              returned to you and mark them received.
            </Typography>

            {!isFetching && payments.length === 0 && (
              <Alert severity="success">Nothing pending — everything this driver has collected has been handed over.</Alert>
            )}

            {payments.length > 0 && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox checked={allSelected} indeterminate={selected.length > 0 && !allSelected} onChange={toggleAll} />
                    </TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p) => {
                    const orderId = typeof p.bill === 'object' ? getId(p.bill.order) : undefined;
                    return (
                      <TableRow key={p._id} hover selected={selected.includes(p._id)}>
                        <TableCell padding="checkbox">
                          <Checkbox checked={selected.includes(p._id)} onChange={() => toggleOne(p._id)} />
                        </TableCell>
                        <TableCell>
                          {formatDateTime(p.createdAt)}
                          {orderId && (
                            <Button size="small" sx={{ ml: 1, minWidth: 0, p: 0 }} onClick={() => navigate(`/orders/${orderId}`)}>
                              View Order
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>{p.method}</TableCell>
                        <TableCell align="right">{formatCurrency(p.amount)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {selected.length > 0 && (
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                <Typography variant="body2" fontWeight={700}>
                  {selected.length} selected — {formatCurrency(selectedTotal)}
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
          <Button variant="contained" disabled={selected.length === 0 || isSettling} onClick={() => setConfirmOpen(true)}>
            Mark {selected.length > 0 ? formatCurrency(selectedTotal) : ''} as Received
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Mark as received?"
        description={`Confirm you have physically received ${formatCurrency(selectedTotal)} from ${driverName}. This cannot be undone.`}
        confirmLabel="Mark as Received"
        loading={isSettling}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSettle}
      />
    </>
  );
}
