import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/EditOutlined';
import { useUpdateStageEntryMutation } from '../api/orderApi';
import type { OrderStage, OrderStatusHistoryEntry } from '../types';
import { ORDER_STAGE_LABELS, ORDER_STAGE_LIST } from '../utils/constants';
import { formatDateTime, getName } from '../utils/formatters';
import { DRIVER_LOGISTICS_ENABLED } from '../utils/featureFlags';

const DRIVER_ONLY_STAGES: OrderStage[] = ['PICKUP_CREATED', 'DRIVER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'];
const VISIBLE_STAGES = DRIVER_LOGISTICS_ENABLED
  ? ORDER_STAGE_LIST
  : ORDER_STAGE_LIST.filter((stage) => !DRIVER_ONLY_STAGES.includes(stage));

interface OrderStageTimelineProps {
  orderId: string;
  currentStatus: OrderStage;
  statusHistory: OrderStatusHistoryEntry[];
}

export function OrderStageTimeline({ orderId, currentStatus, statusHistory }: OrderStageTimelineProps) {
  const currentIndex = ORDER_STAGE_LIST.indexOf(currentStatus);
  const historyByStage = new Map(statusHistory.map((entry) => [entry.status, entry]));
  const [editingEntry, setEditingEntry] = useState<OrderStatusHistoryEntry | null>(null);

  return (
    <>
      <Grid container spacing={1.5}>
        {VISIBLE_STAGES.map((stage) => {
          const index = ORDER_STAGE_LIST.indexOf(stage);
          const entry = historyByStage.get(stage);
          const isCompleted = index <= currentIndex;
          const isCurrent = stage === currentStatus;

          return (
            <Grid key={stage} size={{ xs: 6, sm: 4, md: 3 }}>
              <Card
                variant="outlined"
                sx={{
                  p: 1.5,
                  height: '100%',
                  borderColor: isCurrent ? 'primary.main' : 'divider',
                  borderWidth: isCurrent ? 2 : 1,
                  bgcolor: isCompleted ? 'background.paper' : 'action.hover',
                  opacity: isCompleted ? 1 : 0.6,
                  position: 'relative',
                }}
              >
                <Typography variant="caption" fontWeight={700} color={isCompleted ? 'text.primary' : 'text.disabled'}>
                  {ORDER_STAGE_LABELS[stage]}
                </Typography>

                {entry ? (
                  <>
                    <Typography variant="h6" fontWeight={800} sx={{ mt: 0.5 }}>
                      {entry.itemCount ?? '—'}
                      {entry.itemCount !== undefined && (
                        <Typography component="span" variant="caption" color="text.secondary" ml={0.5}>
                          items
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {formatDateTime(entry.timestamp)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" noWrap>
                      by {getName(entry.updatedBy, 'system')}
                    </Typography>
                    {entry.remarks && (
                      <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }} noWrap>
                        {entry.remarks}
                      </Typography>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => setEditingEntry(entry)}
                      sx={{ position: 'absolute', top: 4, right: 4 }}
                    >
                      <EditIcon fontSize="inherit" />
                    </IconButton>
                  </>
                ) : (
                  <Typography variant="body2" color="text.disabled" sx={{ mt: 1.5 }}>
                    Pending
                  </Typography>
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <StageEditDialog orderId={orderId} entry={editingEntry} onClose={() => setEditingEntry(null)} />
    </>
  );
}

function StageEditDialog({
  orderId,
  entry,
  onClose,
}: {
  orderId: string;
  entry: OrderStatusHistoryEntry | null;
  onClose: () => void;
}) {
  const [updateStageEntry, { isLoading }] = useUpdateStageEntryMutation();
  const [itemCount, setItemCount] = useState('');
  const [remarks, setRemarks] = useState('');

  return (
    <Dialog
      open={Boolean(entry)}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      TransitionProps={{
        onEnter: () => {
          setItemCount(entry?.itemCount !== undefined ? String(entry.itemCount) : '');
          setRemarks(entry?.remarks ?? '');
        },
      }}
    >
      <DialogTitle>{entry ? ORDER_STAGE_LABELS[entry.status] : ''}</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label="Item Count"
            type="number"
            value={itemCount}
            onChange={(e) => setItemCount(e.target.value)}
            fullWidth
          />
          <TextField label="Notes" value={remarks} onChange={(e) => setRemarks(e.target.value)} fullWidth multiline minRows={2} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={isLoading}
          onClick={async () => {
            if (!entry) return;
            await updateStageEntry({
              id: orderId,
              entryId: entry._id,
              itemCount: itemCount === '' ? undefined : Number(itemCount),
              remarks: remarks || undefined,
            });
            onClose();
          }}
        >
          {isLoading ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
