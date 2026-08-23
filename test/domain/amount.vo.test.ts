import assert from "node:assert/strict";
import { describe, it } from "node:test";
import BigNumber from "bignumber.js";
import { Amount } from "../../src/domain/amount.vo";

describe("Amount", () => {
  describe("create", () => {
    it("accepts a number", () => {
      assert.equal(Amount.create(42).toString(), "42");
    });

    it("accepts a numeric string", () => {
      assert.equal(Amount.create("42.5").toString(), "42.5");
    });

    it("accepts a BigNumber", () => {
      assert.equal(Amount.create(new BigNumber("42.5")).toString(), "42.5");
    });

    it("accepts negative values", () => {
      assert.equal(Amount.create(-5).toString(), "-5");
    });

    it("keeps decimal precision that binary floats lose", () => {
      // 0.1 + 0.2 === 0.30000000000000004 with native numbers
      assert.equal(
        Amount.create(0.1).add(Amount.create(0.2)).toString(),
        "0.3",
      );
    });

    it("normalizes exponential notation into plain digits", () => {
      assert.equal(
        Amount.create("1e25").toString(),
        "10000000000000000000000000",
      );
    });

    it("rejects a non numeric string", () => {
      assert.throws(() => Amount.create("abc"), {
        message: 'Invalid amount: "abc" is not a number',
      });
    });

    it("rejects an empty string", () => {
      assert.throws(() => Amount.create(""), {
        message: 'Invalid amount: "" is not a number',
      });
    });

    it("rejects NaN", () => {
      assert.throws(() => Amount.create(Number.NaN), {
        message: 'Invalid amount: "NaN" is not a number',
      });
    });

    it("rejects infinity", () => {
      assert.throws(() => Amount.create(Number.POSITIVE_INFINITY), {
        message: 'Invalid amount: "Infinity" is not a finite number',
      });
      assert.throws(() => Amount.create(Number.NEGATIVE_INFINITY), {
        message: 'Invalid amount: "-Infinity" is not a finite number',
      });
    });
  });

  describe("arithmetic", () => {
    it("adds two amounts", () => {
      assert.equal(
        Amount.create("10.25").add(Amount.create("5.75")).toString(),
        "16",
      );
    });

    it("subtracts two amounts", () => {
      assert.equal(
        Amount.create("10.25").subtract(Amount.create("0.25")).toString(),
        "10",
      );
    });

    it("allows subtraction to cross below zero", () => {
      assert.equal(
        Amount.create(5).subtract(Amount.create(8)).toString(),
        "-3",
      );
    });

    it("multiplies by a factor without losing precision", () => {
      assert.equal(Amount.create("0.3").times(0.1).toString(), "0.03");
    });

    it("rejects a non finite multiplier", () => {
      assert.throws(() => Amount.create(5).times(Number.POSITIVE_INFINITY));
      assert.throws(() => Amount.create(5).times(Number.NaN));
    });

    it("never mutates the operands", () => {
      const left = Amount.create(10);
      const right = Amount.create(5);
      const sum = left.add(right);

      assert.equal(left.toString(), "10");
      assert.equal(right.toString(), "5");
      assert.equal(sum.toString(), "15");
      assert.notEqual(sum, left);
    });
  });

  describe("round", () => {
    it("rounds half away from zero", () => {
      assert.equal(Amount.create("2.345").round(2).toString(), "2.35");
      assert.equal(Amount.create("2.5").round(0).toString(), "3");
    });

    it("rounds negative halves away from zero too", () => {
      assert.equal(Amount.create("-2.345").round(2).toString(), "-2.35");
      assert.equal(Amount.create("-2.5").round(0).toString(), "-3");
    });

    it("rounds down when below the half", () => {
      assert.equal(Amount.create("2.344").round(2).toString(), "2.34");
    });

    it("returns a new instance and leaves the original untouched", () => {
      const original = Amount.create("2.345");
      const rounded = original.round(2);

      assert.equal(original.toString(), "2.345");
      assert.notEqual(rounded, original);
    });
  });

  describe("predicates", () => {
    it("recognizes zero", () => {
      const zero = Amount.create(0);
      assert.equal(zero.isZero(), true);
      assert.equal(zero.isNegative(), false);
      assert.equal(zero.isPositive(), false);
    });

    it("recognizes a positive amount", () => {
      const positive = Amount.create("0.01");
      assert.equal(positive.isPositive(), true);
      assert.equal(positive.isNegative(), false);
      assert.equal(positive.isZero(), false);
    });

    it("recognizes a negative amount", () => {
      const negative = Amount.create("-0.01");
      assert.equal(negative.isNegative(), true);
      assert.equal(negative.isPositive(), false);
      assert.equal(negative.isZero(), false);
    });
  });

  describe("formatting", () => {
    it("toString drops trailing zeros", () => {
      assert.equal(Amount.create("1.500").toString(), "1.5");
    });

    it("toFixed pads to the requested decimals", () => {
      assert.equal(Amount.create("1.5").toFixed(2), "1.50");
      assert.equal(Amount.create(2).toFixed(2), "2.00");
    });

    it("toFixed rounds half away from zero", () => {
      // (1.005).toFixed(2) === "1.00" with native numbers
      assert.equal(Amount.create("1.005").toFixed(2), "1.01");
    });
  });

  describe("value semantics", () => {
    it("equates values written in different literal forms", () => {
      assert.equal(Amount.create("1.50").equals(Amount.create(1.5)), true);
      assert.equal(Amount.create("1e3").equals(Amount.create(1000)), true);
    });

    it("compares by normalized value, not by BigNumber identity", () => {
      const a = Amount.create(1.5);
      const b = Amount.create("1.50");

      assert.notEqual(a.value, b.value);
      assert.equal(a.equals(b), true);
    });

    it("treats negative zero as zero", () => {
      assert.equal(Amount.create(-0).equals(Amount.create(0)), true);
    });

    it("does not equate different values", () => {
      assert.equal(Amount.create(1).equals(Amount.create(2)), false);
    });
  });
});
