export type Currency = 'INR' | 'AED';

const LOCALE_BY_CURRENCY: Record<Currency, string> = {
  INR: 'en-IN',
  AED: 'en-AE',
};

let currentCurrency: Currency = 'AED';

export function setCurrency(currency: Currency): void {
  currentCurrency = currency;
}

export function getCurrency(): Currency {
  return currentCurrency;
}

export function getCurrencyLocale(): string {
  return LOCALE_BY_CURRENCY[currentCurrency];
}
