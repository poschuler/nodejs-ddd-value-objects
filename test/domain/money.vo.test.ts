import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Amount } from "../../src/domain/amount.vo.js";
import { Currency } from "../../src/domain/currency.vo.js";
import { Money, type MoneyJSON } from "../../src/domain/money.vo.js";

const usd = Currency.fromCode("USD");
const eur = Currency.fromCode("EUR");
const jpy = Currency.fromCode("JPY");

describe("Money", () => {
  describe("create", () => {
    it("accepts a number", () => {
      assert.equal(
        Money.create({ amount: 10, currency: usd }).toString(),
        "10.00 USD",
      );
    });

    it("accepts a numeric string", () => {
      assert.equal(
        Money.create({ amount: "10.5", currency: usd }).toString(),
        "10.50 USD",
      );
    });

    it("accepts an Amount", () => {
      const amount = Amount.create("10.5");
      assert.equal(
        Money.create({ amount, currency: usd }).toString(),
        "10.50 USD",
      );
    });

    it("leaves the source Amount untouched", () => {
      const amount = Amount.create("7.126");
      Money.create({ amount, currency: usd });
      assert.equal(amount.toString(), "7.126");
    });

    it("propagates the validation errors of Amount", () => {
      assert.throws(() => Money.create({ amount: "abc", currency: usd }), {
        message: 'Invalid amount: "abc" is not a number',
      });
    });
  });

  describe("rounding to the currency scale", () => {
    it("rounds to the minor unit of the currency", () => {
      assert.equal(
        Money.create({ amount: "7.126", currency: usd }).toString(),
        "7.13 USD",
      );
    });

    it("rounds half away from zero", () => {
      assert.equal(
        Money.create({ amount: "10.005", currency: usd }).toString(),
        "10.01 USD",
      );
      assert.equal(
        Money.create({ amount: "10.004", currency: usd }).toString(),
        "10.00 USD",
      );
    });

    it("rounds negative halves away from zero", () => {
      assert.equal(
        Money.create({ amount: "-3.005", currency: usd }).toString(),
        "-3.01 USD",
      );
    });

    it("drops decimals entirely for a currency with no minor unit", () => {
      assert.equal(
        Money.create({ amount: "1000.999", currency: jpy }).toString(),
        "1001 JPY",
      );
      assert.equal(
        Money.create({ amount: "1000.4", currency: jpy }).toString(),
        "1000 JPY",
      );
    });

    it("rounds each operand before adding, so sub-unit inputs inflate the total", () => {
      // Two half cents become one cent each on construction, not one cent in total.
      const a = Money.create({ amount: "0.005", currency: usd });
      const b = Money.create({ amount: "0.005", currency: usd });

      assert.equal(a.add(b).toString(), "0.02 USD");

      // Adding at Amount level, before Money rounds, yields half of that.
      const addedBeforeRounding = Amount.create("0.005").add(
        Amount.create("0.005"),
      );
      assert.equal(
        Money.create({ amount: addedBeforeRounding, currency: usd }).toString(),
        "0.01 USD",
      );
    });
  });

  describe("add", () => {
    it("adds two amounts in the same currency", () => {
      const salary = Money.create({ amount: 1000, currency: usd });
      const bonus = Money.create({ amount: 250, currency: usd });
      assert.equal(salary.add(bonus).toString(), "1250.00 USD");
    });

    it("rejects a different currency", () => {
      assert.throws(
        () =>
          Money.create({ amount: 1, currency: usd }).add(
            Money.create({ amount: 1, currency: eur }),
          ),
        { message: "Cannot add money with different currencies" },
      );
    });

    it("keeps the currency of the result", () => {
      const sum = Money.create({ amount: 1, currency: jpy }).add(
        Money.create({ amount: 2, currency: jpy }),
      );
      assert.equal(sum.currency.equals(jpy), true);
    });

    it("never mutates the operands", () => {
      const left = Money.create({ amount: 1000, currency: usd });
      const right = Money.create({ amount: 250, currency: usd });
      const sum = left.add(right);

      assert.equal(left.toString(), "1000.00 USD");
      assert.equal(right.toString(), "250.00 USD");
      assert.notEqual(sum, left);
    });

    it("is associative for amounts already at currency scale", () => {
      const a = Money.create({ amount: "0.01", currency: usd });
      const b = Money.create({ amount: "0.02", currency: usd });
      const c = Money.create({ amount: "0.03", currency: usd });

      assert.equal(
        a
          .add(b)
          .add(c)
          .equals(a.add(b.add(c))),
        true,
      );
    });
  });

  describe("subtract", () => {
    it("subtracts two amounts in the same currency", () => {
      const total = Money.create({ amount: "10.50", currency: usd });
      const paid = Money.create({ amount: "0.50", currency: usd });
      assert.equal(total.subtract(paid).toString(), "10.00 USD");
    });

    it("rejects a different currency", () => {
      assert.throws(
        () =>
          Money.create({ amount: 1, currency: usd }).subtract(
            Money.create({ amount: 1, currency: eur }),
          ),
        { message: "Cannot subtract money with different currencies" },
      );
    });

    it("allows the result to cross below zero", () => {
      const result = Money.create({ amount: 5, currency: usd }).subtract(
        Money.create({ amount: 8, currency: usd }),
      );
      assert.equal(result.toString(), "-3.00 USD");
    });
  });

  describe("zero", () => {
    it("builds a zero amount for the currency", () => {
      assert.equal(Money.zero(usd).toString(), "0.00 USD");
      assert.equal(Money.zero(jpy).toString(), "0 JPY");
    });

    it("reports itself as zero", () => {
      assert.equal(Money.zero(usd).isZero(), true);
      assert.equal(
        Money.create({ amount: "0.01", currency: usd }).isZero(),
        false,
      );
    });

    it("is the additive identity", () => {
      const salary = Money.create({ amount: 1000, currency: usd });
      assert.equal(salary.add(Money.zero(usd)).equals(salary), true);
    });

    it("does not equate zero across currencies", () => {
      assert.equal(Money.zero(usd).equals(Money.zero(eur)), false);
    });
  });

  describe("toString", () => {
    it("pads to the decimals of the currency", () => {
      assert.equal(
        Money.create({ amount: 10, currency: usd }).toString(),
        "10.00 USD",
      );
    });

    it("omits decimals for a currency with no minor unit", () => {
      assert.equal(
        Money.create({ amount: 1250, currency: jpy }).toString(),
        "1250 JPY",
      );
    });
  });

  describe("serialization", () => {
    it("serializes the amount at currency scale and the currency by code", () => {
      // The wire form drops `decimals`, which is derivable from the code, and
      // pads the amount, which Amount.toString on its own would not do.
      assert.equal(
        JSON.stringify(Money.create({ amount: "10.5", currency: usd })),
        '{"amount":"10.50","currency":"USD"}',
      );
      assert.equal(
        JSON.stringify(Money.create({ amount: 1250, currency: jpy })),
        '{"amount":"1250","currency":"JPY"}',
      );
    });

    it("round trips through create", () => {
      const money = Money.create({ amount: "10.50", currency: usd });
      const wire = JSON.parse(JSON.stringify(money)) as MoneyJSON;
      const restored = Money.create({
        amount: wire.amount,
        currency: Currency.fromCode(wire.currency),
      });

      assert.equal(restored.equals(money), true);
    });
  });

  describe("value semantics", () => {
    it("equates the same amount in the same currency", () => {
      assert.equal(
        Money.create({ amount: 1000, currency: usd }).equals(
          Money.create({ amount: "1000.00", currency: usd }),
        ),
        true,
      );
    });

    it("does not equate the same amount in different currencies", () => {
      assert.equal(
        Money.create({ amount: 1000, currency: usd }).equals(
          Money.create({ amount: 1000, currency: eur }),
        ),
        false,
      );
    });

    it("does not equate different amounts in the same currency", () => {
      assert.equal(
        Money.create({ amount: 1000, currency: usd }).equals(
          Money.create({ amount: 250, currency: usd }),
        ),
        false,
      );
    });

    it("equates inputs that round to the same minor unit", () => {
      assert.equal(
        Money.create({ amount: "10.004", currency: usd }).equals(
          Money.create({ amount: 10, currency: usd }),
        ),
        true,
      );
    });

    it("does not rely on reference identity", () => {
      const a = Money.create({ amount: 1000, currency: usd });
      const b = Money.create({ amount: 1000, currency: usd });
      assert.notEqual(a, b);
      assert.equal(a.equals(b), true);
    });
  });

  describe("immutability", () => {
    it("freezes the instance", () => {
      const salary = Money.create({ amount: "10.50", currency: usd });

      assert.equal(Object.isFrozen(salary), true);
      assert.throws(() => {
        (salary as { currency: Currency }).currency = eur;
      }, TypeError);
      assert.equal(salary.toString(), "10.50 USD");
    });
  });
});
