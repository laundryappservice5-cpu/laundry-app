import { jsPDF } from 'jspdf';
import type { Bill, Order } from '../types';
import type { Settings } from '../api/settingsApi';
import { formatDateTime, getName } from './formatters';
import { getCurrency } from './currencyStore';

// jsPDF's built-in fonts (Helvetica/Times/Courier) don't include the ₹ glyph, so the
// usual formatCurrency() output renders as a broken character here. Use a plain
// "CODE 123.45" format instead of the Intl-formatted symbol.
function pdfCurrency(amount: number): string {
  return `${getCurrency()} ${amount.toFixed(2)}`;
}

export function buildBillPdf(bill: Bill, order: Order, settings?: Settings): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 48;
  let y = 56;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(settings?.businessName ?? 'The Royal Fresh Laundry', marginX, y);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (settings?.address) {
    y += 16;
    doc.text(settings.address, marginX, y);
  }
  if (settings?.supportPhone) {
    y += 14;
    doc.text(`Phone: ${settings.supportPhone}`, marginX, y);
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 547, 56, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(bill.invoiceNumber, 547, 72, { align: 'right' });
  doc.text(formatDateTime(bill.createdAt), 547, 86, { align: 'right' });

  y = Math.max(y, 86) + 28;
  doc.setDrawColor(200);
  doc.line(marginX, y, 547, y);
  y += 22;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To', marginX, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.text(getName(order.customer), marginX, y);

  y += 30;
  const colX = { item: marginX, service: 230, qty: 360, price: 420, total: 500 };
  doc.setFont('helvetica', 'bold');
  doc.text('Item', colX.item, y);
  doc.text('Service', colX.service, y);
  doc.text('Qty', colX.qty, y, { align: 'right' });
  doc.text('Price', colX.price, y, { align: 'right' });
  doc.text('Total', colX.total, y, { align: 'right' });
  y += 8;
  doc.line(marginX, y, 547, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  for (const line of bill.lineItems) {
    doc.text(getName(line.clothType), colX.item, y);
    doc.text(getName(line.service), colX.service, y);
    doc.text(String(line.quantity), colX.qty, y, { align: 'right' });
    doc.text(pdfCurrency(line.unitPrice), colX.price, y, { align: 'right' });
    doc.text(pdfCurrency(line.lineTotal), colX.total, y, { align: 'right' });
    y += 18;
  }

  y += 8;
  doc.line(marginX, y, 547, y);
  y += 22;

  function totalsRow(label: string, value: string, bold = false) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(label, 420, y, { align: 'right' });
    doc.text(value, colX.total, y, { align: 'right' });
    y += 18;
  }

  totalsRow('Subtotal', pdfCurrency(bill.subtotal));
  if (bill.pickupCharge > 0) totalsRow('Pickup Charge', pdfCurrency(bill.pickupCharge));
  if (bill.deliveryCharge > 0) totalsRow('Delivery Charge', pdfCurrency(bill.deliveryCharge));
  totalsRow('Extra Charges', pdfCurrency(bill.extraCharges));
  totalsRow('Taxes', pdfCurrency(bill.taxes));
  if (bill.discount) {
    totalsRow(`Discount (${bill.discount.reason})`, `-${pdfCurrency(bill.discount.discountAmount)}`);
  }
  y += 4;
  doc.line(420, y - 14, 547, y - 14);
  totalsRow('Total', pdfCurrency(bill.finalAmount), true);

  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const paymentLine =
    bill.paymentStatus === 'PAID' ? `Paid via ${bill.paymentMethod ?? 'N/A'}` : 'Payment Pending';
  doc.text(`Payment Status: ${paymentLine}`, marginX, y);

  return doc;
}
