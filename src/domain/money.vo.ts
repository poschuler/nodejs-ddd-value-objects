import { Amount } from "./amount.vo";
import type { Currency } from "./currency.vo";
import { type EqualityComponent, ValueObject } from "./value-object";

type MoneyProps = {
  readonly amount: Amount;
  readonly currency: Currency;
};

type CreateMoneyProps = {
  readonly amount: Amount | number | string;
  readonly currency: Currency;
};

export class Money extends ValueObject {
  public readonly amount: Amount;

  public readonly currency: Currency;

  private constructor(props: MoneyProps) {
    super();
    this.currency = props.currency;
    this.amount = props.amount.round(props.currency.decimals);
    Object.freeze(this);
  }

  public static create(inputProps: CreateMoneyProps) {
    const amount =
      inputProps.amount instanceof Amount
        ? inputProps.amount
        : Amount.create(inputProps.amount);

    return new Money({
      amount: amount,
      currency: inputProps.currency,
    });
  }

  public add(other: Money): Money {
    if (!this.currency.equals(other.currency)) {
      throw new Error("Cannot add money with different currencies");
    }

    const newAmount = this.amount.add(other.amount);

    return new Money({
      amount: newAmount,
      currency: this.currency,
    });
  }

  public subtract(other: Money): Money {
    if (!this.currency.equals(other.currency)) {
      throw new Error("Cannot subtract money with different currencies");
    }

    const newAmount = this.amount.subtract(other.amount);

    return new Money({
      amount: newAmount,
      currency: this.currency,
    });
  }

  public static zero(currency: Currency): Money {
    return new Money({ amount: Amount.create(0), currency });
  }

  public toString(): string {
    return `${this.amount.toFixed(this.currency.decimals)} ${this.currency.code}`;
  }

  public isZero(): boolean {
    return this.amount.isZero();
  }

  protected equalityComponents(): readonly EqualityComponent[] {
    return [this.amount, this.currency];
  }
}
