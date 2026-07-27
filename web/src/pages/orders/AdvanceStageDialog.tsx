import { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { useAdvanceOrderStatusMutation } from '../../api/orderApi';
import { ORDER_STAGE_LABELS } from '../../utils/constants';
import type { OrderStage } from '../../types';

interface AdvanceStageDialogProps {
  open: boolean;
  orderId: string;
  fromStage: OrderStage;
  toStage: OrderStage;
  onClose: () => void;
}

export function AdvanceStageDialog({ open, orderId, fromStage, toStage, onClose }: AdvanceStageDialogProps) {
  const [advanceStatus, { isLoading, error }] = useAdvanceOrderStatusMutation();
  const [itemCount, setItemCount] = useState('');
  const [remarks, setRemarks] = useState('');

  async function handleConfirm() {
    await advanceStatus({
      id: orderId,
      status: toStage,
      itemCount: itemCount === '' ? undefined : Number(itemCount),
      remarks: remarks || undefined,
    }).unwrap();
    setItemCount('');
    setRemarks('');
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Advance to {ORDER_STAGE_LABELS[toStage]}?</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          {error && <Alert severity="error">Could not advance the order.</Alert>}
          <Typography variant="body2" color="text.secondary">
            This moves the order from "{ORDER_STAGE_LABELS[fromStage]}" to "{ORDER_STAGE_LABELS[toStage]}". This step is
            recorded in the order history and cannot be undone or skipped backwards.
          </Typography>
          <TextField label="Item Count" type="number" value={itemCount} onChange={(e) => setItemCount(e.target.value)} fullWidth />
          <TextField label="Notes" value={remarks} onChange={(e) => setRemarks(e.target.value)} fullWidth multiline minRows={2} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleConfirm} disabled={isLoading}>
          {isLoading ? 'Advancing…' : 'Advance'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
