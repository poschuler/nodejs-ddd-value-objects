import { Currency } from "./currency.vo";
import { Amount } from "./amount.vo";
import { ValueObject } from "./abstractions/value-object.abstract";

type MoneyProps = {
  readonly amount: Amount;
  readonly currency: Currency;
};

type CreateMoneyProps = {
  readonly amount: number | string;
  readonly currency: Currency;
};

export class Money extends ValueObject {

  public readonly amount: Amount;

  public readonly currency: Currency;

  private constructor(props: MoneyProps) {
    super();
    this.amount = props.amount;
    this.currency = props.currency;
  }

  static create(inputProps: CreateMoneyProps) {
    if (!inputProps) throw new Error("Money requires props");
    if (!inputProps.currency) throw new Error("Money requires currency");

    const amountVO = Amount.create(inputProps.amount);

    return new Money({
      amount: amountVO,
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

  public static zero(): Money;
  public static zero(props: { currency: Currency }): Money;

  public static zero(props?: { currency: Currency }): Money {
    const currency = props?.currency ?? Currency.None;
    const zeroAmount = Amount.create(0);
    return new Money({ currency, amount: zeroAmount });
  }

  public isZero(): boolean {
    return this.amount.isZero();
  }

  public isZeroInCurrency({ currency }: { currency: Currency }): boolean {
    return this.amount.isZero() && this.currency.equals(currency);
  }

  protected getEqualityComponents() {
    return [this.amount, this.currency]
  }

}
