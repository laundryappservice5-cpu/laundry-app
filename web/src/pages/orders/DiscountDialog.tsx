import { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material';
import { useApplyDiscountMutation } from '../../api/billApi';

interface DiscountDialogProps {
  open: boolean;
  billId: string;
  onClose: () => void;
}

export function DiscountDialog({ open, billId, onClose }: DiscountDialogProps) {
  const [applyDiscount, { isLoading, error }] = useApplyDiscountMutation();
  const [discountAmount, setDiscountAmount] = useState(0);
  const [reason, setReason] = useState('');

  async function handleSubmit() {
    await applyDiscount({ id: billId, discountAmount, reason }).unwrap();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Apply Discount</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          {error && <Alert severity="error">Could not apply the discount.</Alert>}
          <TextField
            label="Discount Amount"
            type="number"
            fullWidth
            value={discountAmount}
            onChange={(e) => setDiscountAmount(Number(e.target.value))}
          />
          <TextField label="Reason" fullWidth value={reason} onChange={(e) => setReason(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isLoading || discountAmount <= 0 || !reason}>
          {isLoading ? 'Applying…' : 'Apply Discount'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
