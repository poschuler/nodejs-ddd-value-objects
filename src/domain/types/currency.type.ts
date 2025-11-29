export const availableCurrencies = ["USD", "EUR"] as const;
export type CurrencyCode = (typeof availableCurrencies)[number];
