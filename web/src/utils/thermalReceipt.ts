import JsBarcode from 'jsbarcode';
import type { Bill, Order } from '../types';
import type { Settings } from '../api/settingsApi';
import { getName } from './formatters';
import { getCurrency } from './currencyStore';

function money(amount: number): string {
  return `${getCurrency()} ${amount.toFixed(2)}`;
}

function shortDate(date: string | Date): string {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

function shortDateTime(date: string | Date): string {
  const d = new Date(date);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${shortDate(d)} ${hh}:${min}`;
}

function barcodeDataUrl(value: string): string {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, value, {
    format: 'CODE128',
    displayValue: false,
    margin: 0,
    height: 45,
    width: 1.6,
  });
  return canvas.toDataURL('image/png');
}

function paymentLine(bill: Bill): string {
  const balance = bill.finalAmount - (bill.amountPaid ?? 0);
  if (bill.paymentStatus === 'PAID') return `Paid via ${bill.paymentMethod ?? 'N/A'}`;
  if (bill.paymentStatus === 'PARTIAL') return `Partially Paid via ${bill.paymentMethod ?? 'N/A'} — Balance Due ${money(balance)}`;
  return 'Payment Pending';
}

function watermark(bill: Bill): { label: string; color: string; fontSize: number } {
  if (bill.paymentStatus === 'PAID') return { label: 'PAID', color: '#168c3c', fontSize: 34 };
  if (bill.paymentStatus === 'PARTIAL') return { label: 'PARTIALLY PAID', color: '#c81e1e', fontSize: 17 };
  return { label: 'UNPAID', color: '#c81e1e', fontSize: 28 };
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function buildThermalReceiptHtml(bill: Bill, order: Order, settings?: Settings): string {
  const totalQty = bill.lineItems.reduce((sum, li) => sum + li.quantity, 0);
  const customerName = getName(order.customer, 'Walk-in Customer');
  const balance = Math.max(0, bill.finalAmount - (bill.amountPaid ?? 0));
  const collectionTag = order.isInStoreDelivery ? '**In-Store**' : '**Home Delivery**';
  const barcode = barcodeDataUrl(bill.invoiceNumber);
  const wm = watermark(bill);

  const itemRows = bill.lineItems
    .map(
      (li) => `
      <div class="item-row">
        <div class="item-name">${escapeHtml(li.clothType ? getName(li.clothType) : getName(li.service))}</div>
        <div class="item-nums">
          <span>${li.unitPrice.toFixed(1)}</span>
          <span>${li.quantity} Qty</span>
          <span>${li.lineTotal.toFixed(1)}</span>
        </div>
      </div>
      <div class="item-service">${escapeHtml(li.clothType ? getName(li.service) : 'Flat fee')}</div>
    `,
    )
    .join('<div class="spacer"></div>');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(bill.invoiceNumber)}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body {
    width: 78mm;
    margin: 0 auto;
    padding: 8px 10px 16px;
    font-family: Arial, Helvetica, sans-serif;
    color: #000;
    font-size: 12px;
  }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  .business-name { font-size: 15px; font-weight: 700; }
  .dashed { border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  .barcode-wrap { text-align: center; margin: 8px 0 2px; }
  .barcode-wrap img { max-width: 100%; }
  .barcode-value { letter-spacing: 2px; font-size: 12px; }
  .head-row { font-weight: 700; font-size: 11px; }
  .col-desc { text-align: left; }
  .col-num { text-align: right; }
  .item-row { display: flex; justify-content: space-between; margin-top: 6px; }
  .item-name { font-weight: 700; flex: 1; padding-right: 6px; }
  .item-nums { display: flex; gap: 10px; white-space: nowrap; font-size: 11px; }
  .item-service { font-size: 11px; color: #333; }
  .spacer { height: 4px; }
  .totals-row { display: flex; justify-content: space-between; margin-top: 4px; }
  .grand { font-size: 13px; font-weight: 700; }
  .footer-tag { margin-top: 10px; font-weight: 700; }
  .stack { display: grid; }
  .stack > * { grid-area: 1 / 1; }
  .watermark {
    align-self: center;
    justify-self: center;
    transform: rotate(-28deg);
    font-size: ${wm.fontSize}px;
    font-weight: 800;
    letter-spacing: 1px;
    opacity: 0.16;
    color: ${wm.color};
    white-space: nowrap;
    pointer-events: none;
    z-index: 1;
  }
  .receipt-content { z-index: 0; }
  @media print {
    body { padding-bottom: 4px; }
  }
</style>
</head>
<body>
<div class="stack">
  <div class="watermark">${escapeHtml(wm.label)}</div>
  <div class="receipt-content">
  <div class="center">
    <div class="business-name">${escapeHtml(settings?.businessName ?? 'Laundry')}</div>
    ${settings?.address ? `<div>${escapeHtml(settings.address)}</div>` : ''}
    ${settings?.supportPhone ? `<div>Contact : ${escapeHtml(settings.supportPhone)}</div>` : ''}
    ${settings?.email ? `<div>Email : ${escapeHtml(settings.email)}</div>` : ''}
    ${settings?.taxId ? `<div>Tax ID : ${escapeHtml(settings.taxId)}</div>` : ''}
  </div>

  <div class="dashed"></div>

  <div class="row">
    <span class="bold">${escapeHtml(bill.invoiceNumber)}</span>
    <span>Order Dt : ${shortDate(order.createdAt)}</span>
  </div>
  <div class="row">
    <span>${escapeHtml(customerName)}</span>
    <span>${shortDateTime(order.createdAt)}</span>
  </div>

  <div class="dashed"></div>

  <div class="barcode-wrap">
    <img src="${barcode}" alt="${escapeHtml(bill.invoiceNumber)}" />
  </div>
  <div class="center barcode-value">${escapeHtml(bill.invoiceNumber)}</div>

  <div class="dashed"></div>

  <div class="row head-row">
    <span class="col-desc">Description</span>
    <span class="item-nums"><span>Price</span><span>Qty/Kg</span><span>Total</span></span>
  </div>

  <div class="dashed"></div>

  ${itemRows}

  <div class="dashed"></div>

  <div class="totals-row bold">
    <span></span>
    <span>${totalQty} Qty</span>
  </div>
  <div class="totals-row">
    <span>Sub Total :</span>
    <span>${money(bill.subtotal)}</span>
  </div>
  ${bill.pickupCharge > 0 ? `<div class="totals-row"><span>Pickup Charge :</span><span>${money(bill.pickupCharge)}</span></div>` : ''}
  ${bill.deliveryCharge > 0 ? `<div class="totals-row"><span>Delivery Charge :</span><span>${money(bill.deliveryCharge)}</span></div>` : ''}
  ${bill.taxes > 0 ? `<div class="totals-row"><span>Taxes :</span><span>${money(bill.taxes)}</span></div>` : ''}
  ${bill.discount ? `<div class="totals-row"><span>Discount :</span><span>-${money(bill.discount.discountAmount)}</span></div>` : ''}

  <div class="dashed"></div>

  <div class="totals-row grand">
    <span>Grand Total :</span>
    <span>${money(bill.finalAmount)}</span>
  </div>
  <div class="totals-row grand">
    <span>Total Due :</span>
    <span>${money(balance)}</span>
  </div>

  <div class="dashed"></div>

  <div class="center">${escapeHtml(paymentLine(bill))}</div>
  <div class="center footer-tag">${collectionTag}</div>
  </div>
</div>
</body>
</html>`;
}

export function printThermalReceipt(bill: Bill, order: Order, settings?: Settings): void {
  const html = buildThermalReceiptHtml(bill, order, settings);
  const printWindow = window.open('', '_blank', 'width=380,height=640');
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}
