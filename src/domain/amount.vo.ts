import BigNumber from "bignumber.js";
import { type EqualityComponent, ValueObject } from "./value-object.js";

type AmountProps = {
  readonly value: BigNumber;
};

export class Amount extends ValueObject {
  readonly #value: BigNumber;

  private constructor(props: AmountProps) {
    super();

    // Both guards live in the one gate every Amount passes through. The
    // finiteness one is reachable: times() can overflow two finite operands
    // into Infinity. The NaN one is not, today — create() rejects NaN before
    // this point, and plus, minus, times and dp never produce one from finite
    // operands. It stays because the first operator that can — a divide(),
    // where 0/0 is NaN — would otherwise mint an Amount whose value is NaN:
    // it prints as "NaN", serialises as "NaN", and compares equal to itself.
    if (props.value.isNaN()) {
      throw new Error(`Invalid amount: "${props.value}" is not a number`);
    }

    if (!props.value.isFinite()) {
      throw new Error(
        `Invalid amount: "${props.value}" is not a finite number`,
      );
    }

    this.#value = props.value;
    Object.freeze(this);
  }

  public static create(input: number | string): Amount {
    const bigValue = new BigNumber(input);

    if (bigValue.isNaN()) {
      throw new Error(`Invalid amount: "${input}" is not a number`);
    }

    return new Amount({ value: bigValue });
  }

  public round(decimals: number): Amount {
    assertDecimals(decimals);
    const newValue = this.#value.dp(decimals, BigNumber.ROUND_HALF_UP);
    return new Amount({ value: newValue });
  }

  public add(other: Amount): Amount {
    const newValue = this.#value.plus(other.#value);
    return new Amount({ value: newValue });
  }

  public subtract(other: Amount): Amount {
    const newValue = this.#value.minus(other.#value);
    return new Amount({ value: newValue });
  }

  public times(multiplier: number | string): Amount {
    // Routed through create() so a malformed factor is reported by its own
    // literal: BigNumber.times() would quietly turn it into NaN, and the
    // message would name "NaN" instead of what the caller actually wrote.
    const factor = Amount.create(multiplier);
    const newValue = this.#value.times(factor.#value);
    return new Amount({ value: newValue });
  }

  public isZero(): boolean {
    return this.#value.isZero();
  }

  public isNegative(): boolean {
    return this.#value.isLessThan(0);
  }

  public isPositive(): boolean {
    return this.#value.isGreaterThan(0);
  }

  public toString(): string {
    return this.#value.toFixed();
  }

  // #value is not an own property, so without this hook JSON.stringify would
  // emit {} and drop the amount without raising anything.
  public toJSON(): string {
    return this.toString();
  }

  public toFixed(decimals: number): string {
    assertDecimals(decimals);
    return this.#value.toFixed(decimals);
  }

  protected equalityComponents(): readonly EqualityComponent[] {
    return [this.#value.toFixed()];
  }
}

// BigNumber takes a scale of up to 1e9 decimal places, far enough to exhaust the
// heap while formatting before it reports anything. Capping it at 20 keeps every
// monetary scale reachable and that failure mode out — out of the scale, at least.
// Nothing here bounds the magnitude: "1e10000000" is still a finite BigNumber, and
// every toString() has to materialise all ten million digits.
const MAX_DECIMALS = 20;

function assertDecimals(decimals: number): void {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > MAX_DECIMALS) {
    throw new Error(
      `Invalid decimals: "${decimals}" must be an integer between 0 and ${MAX_DECIMALS}`,
    );
  }
}
