import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, paginated } from '../utils/apiResponse';
import { paymentService } from '../services/payment.service';
import { getPagination } from '../utils/pagination';
import { buildCsv } from '../utils/csv';

function buildPaymentFilterFromQuery(req: Request) {
  return {
    dateFrom: req.query.dateFrom as string | undefined,
    dateTo: req.query.dateTo as string | undefined,
    method: req.query.method as string | undefined,
    minAmount: req.query.minAmount ? Number(req.query.minAmount) : undefined,
    maxAmount: req.query.maxAmount ? Number(req.query.maxAmount) : undefined,
    orderId: req.query.orderId as string | undefined,
    search: req.query.search as string | undefined,
  };
}

export const listPayments = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const [items, total] = await paymentService.list(buildPaymentFilterFromQuery(req), skip, limit);
  paginated(res, items, { page, limit, total });
});

interface PaymentExportRow {
  createdAt: string;
  amount: number;
  method: string;
  referenceId?: string;
  order: { _id: string };
  customer: { name: string; mobileNumber: string };
  collectedBy: { name: string };
}

export const exportPayments = asyncHandler(async (req: Request, res: Response) => {
  const [items] = await paymentService.list(buildPaymentFilterFromQuery(req), 0, 100000);

  const csv = buildCsv<PaymentExportRow>(
    [
      { header: 'Date', accessor: (p) => new Date(p.createdAt).toISOString() },
      { header: 'Order ID', accessor: (p) => p.order._id.toString().slice(-8).toUpperCase() },
      { header: 'Customer', accessor: (p) => p.customer.name },
      { header: 'Phone', accessor: (p) => p.customer.mobileNumber },
      { header: 'Amount', accessor: (p) => p.amount },
      { header: 'Method', accessor: (p) => p.method },
      { header: 'Reference', accessor: (p) => p.referenceId ?? '' },
      { header: 'Collected By', accessor: (p) => p.collectedBy.name },
    ],
    items as unknown as PaymentExportRow[],
  );

  res.type('text/csv').attachment('payments.csv').send(csv);
});

export const paymentSummary = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await paymentService.summary());
});

export const pendingByDriver = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await paymentService.pendingByDriver());
});

export const pendingForDriver = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await paymentService.pendingForDriver(req.params.driverId));
});

export const settle = asyncHandler(async (req: Request, res: Response) => {
  const payments = await paymentService.settle(req.user!.userId, req.user!.role, req.body.paymentIds);
  ok(res, payments);
});
