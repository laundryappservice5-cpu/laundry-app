import { useState, type ReactElement } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentsIcon from '@mui/icons-material/Payments';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import { useRecordPaymentMutation } from '../../api/billApi';
import { formatCurrency } from '../../utils/formatters';
import type { PaymentLeg, PaymentMethod } from '../../types';

interface RecordPaymentDialogProps {
  open: boolean;
  billId: string;
  balanceDue: number;
  onClose: () => void;
}

type CollectionOption = 'CARD' | 'CASH' | 'PARTIAL';

const OPTIONS: { key: CollectionOption; label: string; icon: ReactElement }[] = [
  { key: 'CARD', label: 'Card (Swipe Machine)', icon: <CreditCardIcon /> },
  { key: 'CASH', label: 'Cash', icon: <PaymentsIcon /> },
  { key: 'PARTIAL', label: 'Partial Payment (Cash + Card)', icon: <CallSplitIcon /> },
];

export function RecordPaymentDialog({ open, billId, balanceDue, onClose }: RecordPaymentDialogProps) {
  const [recordPayment, { isLoading, error }] = useRecordPaymentMutation();
  const [option, setOption] = useState<CollectionOption | null>(null);
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');

  const cash = Number(cashAmount) || 0;
  const card = Number(cardAmount) || 0;
  const partialTotal = cash + card;

  function reset() {
    setOption(null);
    setCashAmount('');
    setCardAmount('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleCollectFull(method: PaymentMethod) {
    await recordPayment({ id: billId, splits: [{ amount: balanceDue, method }] }).unwrap();
    handleClose();
  }

  async function handleCollectPartial() {
    if (partialTotal <= 0) return;
    const splits: PaymentLeg[] = [];
    if (cash > 0) splits.push({ amount: cash, method: 'CASH' });
    if (card > 0) splits.push({ amount: card, method: 'CARD' });
    try {
      await recordPayment({ id: billId, splits }).unwrap();
      handleClose();
    } catch {
      // dialog stays open so the amounts can be corrected and retried
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Collect Payment</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          {error && <Alert severity="error">Could not record the payment. Check the amount and try again.</Alert>}
          <Typography variant="body2" color="text.secondary">
            Balance Due
          </Typography>
          <Typography variant="h5" fontWeight={800}>
            {formatCurrency(balanceDue)}
          </Typography>

          <Stack spacing={1}>
            {OPTIONS.map((o) => (
              <Button
                key={o.key}
                variant={option === o.key ? 'contained' : 'outlined'}
                startIcon={o.icon}
                sx={{ justifyContent: 'flex-start', py: 1.25 }}
                onClick={() => setOption(o.key)}
              >
                {o.label}
              </Button>
            ))}
          </Stack>

          {option === 'PARTIAL' && (
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
              <Stack spacing={1.5}>
                <Typography variant="caption" color="text.secondary">
                  Split what the customer pays now between cash and card — both get recorded separately.
                </Typography>
                <Stack direction="row" spacing={1.5}>
                  <TextField
                    label="Cash Amount"
                    type="number"
                    fullWidth
                    size="small"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    slotProps={{ htmlInput: { min: 0 } }}
                  />
                  <TextField
                    label="Card Amount"
                    type="number"
                    fullWidth
                    size="small"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(e.target.value)}
                    slotProps={{ htmlInput: { min: 0 } }}
                  />
                </Stack>
                {partialTotal > 0 && (
                  <Typography variant="body2">
                    Collecting now: {formatCurrency(partialTotal)}
                    {partialTotal < balanceDue && ` — remaining balance: ${formatCurrency(balanceDue - partialTotal)}`}
                  </Typography>
                )}
                {partialTotal > balanceDue && (
                  <Alert severity="error" sx={{ py: 0 }}>
                    Total exceeds the balance due.
                  </Alert>
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        {option === 'PARTIAL' ? (
          <Button
            variant="contained"
            onClick={handleCollectPartial}
            disabled={isLoading || partialTotal <= 0 || partialTotal > balanceDue}
          >
            {isLoading ? 'Recording…' : `Record ${formatCurrency(partialTotal)}`}
          </Button>
        ) : (
          <Button variant="contained" onClick={() => option && handleCollectFull(option)} disabled={isLoading || !option}>
            {isLoading ? 'Recording…' : `Collect ${formatCurrency(balanceDue)}`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
