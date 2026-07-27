import { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import { useRecordPaymentMutation } from '../../api/billApi';
import { PAYMENT_METHODS } from '../../utils/constants';
import type { PaymentMethod } from '../../types';

interface RecordPaymentDialogProps {
  open: boolean;
  billId: string;
  defaultAmount: number;
  onClose: () => void;
}

export function RecordPaymentDialog({ open, billId, defaultAmount, onClose }: RecordPaymentDialogProps) {
  const [recordPayment, { isLoading, error }] = useRecordPaymentMutation();
  const [amount, setAmount] = useState(defaultAmount);
  const [method, setMethod] = useState<PaymentMethod>('CASH');

  async function handleSubmit() {
    await recordPayment({ id: billId, amount, method }).unwrap();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Record Payment</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          {error && <Alert severity="error">Could not record the payment.</Alert>}
          <TextField label="Amount" type="number" fullWidth value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          <TextField select label="Payment Method" fullWidth value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            {PAYMENT_METHODS.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isLoading || amount <= 0}>
          {isLoading ? 'Recording…' : 'Record Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
