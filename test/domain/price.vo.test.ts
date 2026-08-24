import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Currency } from "../../src/domain/currency.vo.js";
import { Money, type MoneyJSON } from "../../src/domain/money.vo.js";
import { Price } from "../../src/domain/price.vo.js";

const usd = Currency.fromCode("USD");
const eur = Currency.fromCode("EUR");
const jpy = Currency.fromCode("JPY");

const money = (amount: string | number, currency: Currency = usd) =>
  Money.create({ amount, currency });

describe("Price", () => {
  describe("create", () => {
    it("accepts a positive amount", () => {
      assert.equal(Price.create(money("19.99")).toString(), "19.99 USD");
    });

    it("accepts zero", () => {
      assert.equal(Price.create(money(0)).toString(), "0.00 USD");
    });

    it("accepts a currency with no minor unit", () => {
      assert.equal(Price.create(money(1000, jpy)).toString(), "1000 JPY");
    });

    it("rejects a negative amount", () => {
      // Matched loosely: the stable part of the contract is the reason,
      // not how the amount is formatted inside the message.
      assert.throws(() => Price.create(money(-1)), /cannot be negative/);
    });

    it("names the offending amount in the error", () => {
      assert.throws(() => Price.create(money(-1)), {
        message: "Invalid price: -1.00 USD cannot be negative",
      });
    });

    it("inherits the currency scale rounding of Money", () => {
      assert.equal(Price.create(money("19.994")).toString(), "19.99 USD");
      assert.equal(Price.create(money("19.995")).toString(), "20.00 USD");
    });

    it("accepts a negative input that Money already rounded up to zero", () => {
      // Money rounds -0.004 to the cent before Price ever sees it,
      // so the negativity check never fires for sub-unit negatives.
      assert.equal(Price.create(money("-0.004")).toString(), "0.00 USD");
    });

    it("still rejects a negative input that rounds to a negative cent", () => {
      assert.throws(() => Price.create(money("-0.005")), /cannot be negative/);
    });
  });

  describe("toString", () => {
    it("delegates the formatting to Money", () => {
      const amount = money("19.99");
      assert.equal(Price.create(amount).toString(), amount.toString());
    });
  });

  describe("serialization", () => {
    it("emits the money it wraps, not its own field name", () => {
      // Without toJSON(), JSON.stringify walks the own enumerable `money`
      // field and emits {"money":{...}} — a wire form shaped by an internal
      // field name, which would change the day that field is renamed.
      assert.equal(
        JSON.stringify(Price.create(money("19.99"))),
        '{"amount":"19.99","currency":"USD"}',
      );
    });

    it("inherits the currency scale of the money it wraps", () => {
      assert.equal(
        JSON.stringify(Price.create(money(1000, jpy))),
        '{"amount":"1000","currency":"JPY"}',
      );
    });

    it("is indistinguishable from the Money it wraps", () => {
      // The wire form carries the value, not the type. A payload cannot say
      // whether it came from a Money or a Price, which is why reading one
      // back has to go through the factory the caller intends.
      const listed = money("19.99");

      assert.equal(
        JSON.stringify(Price.create(listed)),
        JSON.stringify(listed),
      );
    });

    it("round trips through the factories", () => {
      const price = Price.create(money("19.99"));
      const wire = JSON.parse(JSON.stringify(price)) as MoneyJSON;
      const restored = Price.create(
        Money.create({
          amount: wire.amount,
          currency: Currency.fromCode(wire.currency),
        }),
      );

      assert.equal(restored.equals(price), true);
    });
  });

  describe("value semantics", () => {
    it("equates prices holding the same money", () => {
      assert.equal(
        Price.create(money("19.99")).equals(Price.create(money("19.99"))),
        true,
      );
    });

    it("does not equate different amounts", () => {
      assert.equal(
        Price.create(money("19.99")).equals(Price.create(money("29.99"))),
        false,
      );
    });

    it("does not equate the same amount in a different currency", () => {
      assert.equal(
        Price.create(money("19.99")).equals(Price.create(money("19.99", eur))),
        false,
      );
    });

    it("does not equate a Price with the Money it wraps", () => {
      const amount = money("19.99");
      assert.equal(Price.create(amount).equals(amount), false);
    });

    it("does not rely on reference identity", () => {
      const a = Price.create(money("19.99"));
      const b = Price.create(money("19.99"));
      assert.notEqual(a, b);
      assert.equal(a.equals(b), true);
    });
  });

  describe("immutability", () => {
    it("cannot be pushed negative after construction", () => {
      // Object.freeze is shallow. If Amount exposed its BigNumber, writing to
      // it through this chain would turn an already validated Price negative.
      // The #private field is what makes the invariant hold for the whole
      // lifetime of the object, not just at the moment of construction.
      const price = Price.create(money("10.00"));

      assert.throws(() => {
        const inner = price.money.amount as unknown as { value: { s: number } };
        inner.value.s = -1;
      }, TypeError);
      assert.equal(price.toString(), "10.00 USD");
      assert.equal(price.money.amount.isNegative(), false);
    });

    it("freezes the instance", () => {
      const price = Price.create(money("19.99"));

      assert.equal(Object.isFrozen(price), true);
      assert.throws(() => {
        (price as { money: Money }).money = money("0.01");
      }, TypeError);
      assert.equal(price.toString(), "19.99 USD");
    });
  });
});
