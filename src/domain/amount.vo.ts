import { ValueObject } from "./abstractions/value-object.abstract";
import BigNumber from "bignumber.js";

const ROUNDING_MODE = BigNumber.ROUND_HALF_UP;
const DECIMAL_PLACES = 2;

type AmountProps = {
  readonly value: BigNumber;
};

export class Amount extends ValueObject {

  public readonly value: BigNumber;

  private constructor(props: AmountProps) {
    super();
    this.value = props.value.dp(DECIMAL_PLACES, ROUNDING_MODE);
  }

  public static create(input: number | string | BigNumber): Amount {
    try {
      const bigValue = new BigNumber(input);

      if (bigValue.isNaN()) {
        throw new Error("Invalid amount: not a number");
      }

      if (bigValue.isNegative()) {
        throw new Error("Invalid amount: amount cannot be negative");
      }

      return new Amount({ value: bigValue });
    } catch {
      throw new Error(`Error creating Amount from input: ${input}`);
    }
  }

  public add(other: Amount): Amount {
    const newValue = this.value.plus(other.value);
    return new Amount({ value: newValue });
  }

  public times(multiplier: number): Amount {
    const newValue = this.value.times(multiplier);
    return new Amount({ value: newValue });
  }

  public isZero(): boolean {
    return this.value.isZero();
  }

  public toString(): string {
    return this.value.toFixed(DECIMAL_PLACES, ROUNDING_MODE);
  }

  public toNumber(): number {
    return parseFloat(this.toString());
  }

  protected getEqualityComponents() {
    return [this.value.toFixed(DECIMAL_PLACES)];
  }
}
