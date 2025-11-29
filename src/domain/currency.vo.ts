
import { ValueObject } from "./abstractions/value-object.abstract";
import { availableCurrencies } from "./types/currency.type";

export class Currency extends ValueObject {

  public readonly code: string;

  private constructor(code: string) {
    super();
    this.code = code;
  }

  public static readonly None = new Currency("__NONE__");

  public static readonly All = availableCurrencies.map((c) => new Currency(c));

  public static fromCode(code: string): Currency {
    const currency = Currency.All.find((c) => c.code === code);

    if (!currency) throw new Error(`Unsupported currency code: ${code}`);
    return currency;
  }

  protected getEqualityComponents() {
    return [this.code];
  }
}
