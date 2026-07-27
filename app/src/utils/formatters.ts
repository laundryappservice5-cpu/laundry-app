import { getCurrency, getCurrencyLocale } from './currencyStore';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(getCurrencyLocale(), { style: 'currency', currency: getCurrency(), maximumFractionDigits: 2 }).format(
    amount,
  );
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getId(ref: { _id: string } | string | undefined): string | undefined {
  if (!ref) return undefined;
  return typeof ref === 'string' ? ref : ref._id;
}

export function getName(ref: { name: string } | string | undefined, fallback = '—'): string {
  if (!ref) return fallback;
  return typeof ref === 'string' ? ref : ref.name;
}
