import type { TranslationKey } from '@app/core/i18n/i18n.keys';

export interface CurrencyOption {
  readonly code: string;
  readonly symbol: string;
  readonly labelKey: TranslationKey;
}

export const DEFAULT_CURRENCY = 'COP';

export const CURRENCIES = [
  { code: 'EUR', symbol: '€', labelKey: 'currency.EUR' },
  { code: 'USD', symbol: '$', labelKey: 'currency.USD' },
  { code: 'GBP', symbol: '£', labelKey: 'currency.GBP' },
  { code: 'CHF', symbol: 'Fr', labelKey: 'currency.CHF' },
  { code: 'MXN', symbol: '$', labelKey: 'currency.MXN' },
  { code: 'ARS', symbol: '$', labelKey: 'currency.ARS' },
  { code: 'CLP', symbol: '$', labelKey: 'currency.CLP' },
  { code: 'COP', symbol: '$', labelKey: 'currency.COP' },
  { code: 'BRL', symbol: 'R$', labelKey: 'currency.BRL' },
  { code: 'JPY', symbol: '¥', labelKey: 'currency.JPY' },
] as const satisfies readonly CurrencyOption[];

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

export function isCurrency(value: string): value is CurrencyCode {
  return CURRENCIES.some(({ code }) => code === value);
}

export function currencySymbol(code: CurrencyCode): string {
  return CURRENCIES.find(({ code: optionCode }) => optionCode === code)?.symbol ?? code;
}
