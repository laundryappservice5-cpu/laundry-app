import { useEffect, useMemo } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { buildBillPdf } from '../utils/billPdf';
import { useGetSettingsQuery } from '../api/settingsApi';
import type { Bill, Order } from '../types';

interface BillPdfDialogProps {
  open: boolean;
  bill: Bill;
  order: Order;
  onClose: () => void;
}

export function BillPdfDialog({ open, bill, order, onClose }: BillPdfDialogProps) {
  const { data: settings } = useGetSettingsQuery();

  const blobUrl = useMemo(() => {
    if (!open) return undefined;
    const doc = buildBillPdf(bill, order, settings);
    return doc.output('bloburl') as unknown as string;
  }, [open, bill, order, settings]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  function handleDownload() {
    const doc = buildBillPdf(bill, order, settings);
    doc.save(`${bill.invoiceNumber}.pdf`);
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Invoice {bill.invoiceNumber}</DialogTitle>
      <DialogContent sx={{ height: '75vh', p: 0 }}>
        {blobUrl && (
          <iframe title="Invoice PDF" src={blobUrl} style={{ width: '100%', height: '100%', border: 'none' }} />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Back</Button>
        <Button variant="contained" onClick={handleDownload}>
          Download PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}
