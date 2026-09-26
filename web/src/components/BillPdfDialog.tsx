import { useEffect, useMemo } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Link } from '@mui/material';
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

  const { blobUrl, buildError } = useMemo(() => {
    if (!open) return { blobUrl: undefined, buildError: false };
    try {
      const doc = buildBillPdf(bill, order, settings);
      return { blobUrl: doc.output('bloburl') as unknown as string, buildError: false };
    } catch {
      return { blobUrl: undefined, buildError: true };
    }
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
        {buildError && (
          <Alert severity="error" sx={{ m: 2 }}>
            Could not generate the invoice preview. You can still try downloading it below.
          </Alert>
        )}
        {blobUrl && (
          // <object> (not <iframe>) so browsers that can't render PDFs inline — many
          // mobile browsers just show a blank iframe — fall back to the message below.
          <object data={blobUrl} type="application/pdf" style={{ width: '100%', height: '100%' }}>
            <Alert severity="info" sx={{ m: 2 }}>
              Your browser can't preview PDFs here.{' '}
              <Link href={blobUrl} target="_blank" rel="noopener">
                Open the invoice in a new tab
              </Link>{' '}
              to view it, or use the download button below.
            </Alert>
          </object>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Back</Button>
        {blobUrl && (
          <Button href={blobUrl} target="_blank" rel="noopener">
            Open in New Tab
          </Button>
        )}
        <Button variant="contained" onClick={handleDownload} disabled={!blobUrl}>
          Download PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}
