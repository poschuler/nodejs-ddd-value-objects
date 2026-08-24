import BigNumber from "bignumber.js";
import { type EqualityComponent, ValueObject } from "./value-object";

type AmountProps = {
  readonly value: BigNumber;
};

export class Amount extends ValueObject {
  public readonly value: BigNumber;

  private constructor(props: AmountProps) {
    super();

    if (props.value.isNaN()) {
      throw new Error(`Invalid amount: "${props.value}" is not a number`);
    }

    if (!props.value.isFinite()) {
      throw new Error(
        `Invalid amount: "${props.value}" is not a finite number`,
      );
    }

    this.value = props.value;
    Object.freeze(this);
  }

  public static create(input: number | string | BigNumber): Amount {
    const bigValue = new BigNumber(input);

    if (bigValue.isNaN()) {
      throw new Error(`Invalid amount: "${input}" is not a number`);
    }

    return new Amount({ value: bigValue });
  }

  public round(decimals: number): Amount {
    assertDecimals(decimals);
    const newValue = this.value.dp(decimals, BigNumber.ROUND_HALF_UP);
    return new Amount({ value: newValue });
  }

  public add(other: Amount): Amount {
    const newValue = this.value.plus(other.value);
    return new Amount({ value: newValue });
  }

  public subtract(other: Amount): Amount {
    const newValue = this.value.minus(other.value);
    return new Amount({ value: newValue });
  }

  public times(multiplier: number): Amount {
    const newValue = this.value.times(multiplier);
    return new Amount({ value: newValue });
  }

  public isZero(): boolean {
    return this.value.isZero();
  }

  public isNegative(): boolean {
    return this.value.isLessThan(0);
  }

  public isPositive(): boolean {
    return this.value.isGreaterThan(0);
  }

  public toString(): string {
    return this.value.toFixed();
  }

  public toFixed(decimals: number): string {
    assertDecimals(decimals);
    return this.value.toFixed(decimals);
  }

  protected equalityComponents(): readonly EqualityComponent[] {
    return [this.value.toFixed()];
  }
}

function assertDecimals(decimals: number): void {
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new Error(
      `Invalid decimals: "${decimals}" must be a non-negative integer`,
    );
  }
}
