import type { Money, MoneyJSON } from "./money.vo.js";
import { type EqualityComponent, ValueObject } from "./value-object.js";

type PriceProps = {
  readonly money: Money;
};

export class Price extends ValueObject {
  public readonly money: Money;

  private constructor(props: PriceProps) {
    super();
    this.money = props.money;
    Object.freeze(this);
  }

  public static create(money: Money): Price {
    if (money.amount.isNegative()) {
      throw new Error(`Invalid price: ${money.toString()} cannot be negative`);
    }
    return new Price({ money });
  }

  public toString(): string {
    return this.money.toString();
  }

  public toJSON(): MoneyJSON {
    return this.money.toJSON();
  }

  protected equalityComponents(): readonly EqualityComponent[] {
    return [this.money];
  }
}
