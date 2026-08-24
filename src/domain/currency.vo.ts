import { type CurrencyCode, currencyDecimals } from "./types/currency.type.js";
import { type EqualityComponent, ValueObject } from "./value-object.js";

export class Currency extends ValueObject {
  public readonly code: CurrencyCode;
  public readonly decimals: number;

  private constructor(code: CurrencyCode) {
    super();
    this.code = code;
    this.decimals = currencyDecimals[code];
    Object.freeze(this);
  }

  public static readonly All: readonly Currency[] = Object.freeze(
    (Object.keys(currencyDecimals) as CurrencyCode[]).map(
      (c) => new Currency(c),
    ),
  );

  public static fromCode(code: string): Currency {
    const currency = Currency.All.find((c) => c.code === code);

    if (!currency) throw new Error(`Unsupported currency code: ${code}`);
    return currency;
  }

  protected equalityComponents(): readonly EqualityComponent[] {
    return [this.code];
  }
}
