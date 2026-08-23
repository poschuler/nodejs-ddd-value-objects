export const currencyDecimals = {
  PEN: 2,
  USD: 2,
  EUR: 2,
  JPY: 0,
} as const;

export type CurrencyCode = keyof typeof currencyDecimals;
