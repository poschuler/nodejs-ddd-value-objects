import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Currency } from "../../src/domain/currency.vo";
import type { CurrencyCode } from "../../src/domain/types/currency.type";
import { currencyDecimals } from "../../src/domain/types/currency.type";

describe("Currency", () => {
  describe("fromCode", () => {
    it("returns the currency matching the code", () => {
      assert.equal(Currency.fromCode("USD").code, "USD");
    });

    it("returns the same shared instance for the same code", () => {
      assert.equal(Currency.fromCode("USD"), Currency.fromCode("USD"));
    });

    it("throws for an unsupported code", () => {
      // The cast crosses the type boundary on purpose: this guard exists for
      // callers coming from untyped input (JSON, env vars, HTTP payloads).
      assert.throws(() => Currency.fromCode("XXX" as CurrencyCode), {
        message: "Unsupported currency code: XXX",
      });
    });

    it("resolves every code declared in the currency table", () => {
      for (const code of Object.keys(currencyDecimals) as CurrencyCode[]) {
        assert.equal(Currency.fromCode(code).code, code);
      }
    });
  });

  describe("decimals", () => {
    it("exposes two decimals for minor-unit currencies", () => {
      assert.equal(Currency.fromCode("USD").decimals, 2);
      assert.equal(Currency.fromCode("EUR").decimals, 2);
      assert.equal(Currency.fromCode("PEN").decimals, 2);
    });

    it("exposes zero decimals for JPY", () => {
      assert.equal(Currency.fromCode("JPY").decimals, 0);
    });

    it("derives decimals from the currency table", () => {
      for (const currency of Currency.All) {
        assert.equal(currency.decimals, currencyDecimals[currency.code]);
      }
    });
  });

  describe("All", () => {
    it("holds one currency per entry in the currency table", () => {
      assert.equal(Currency.All.length, Object.keys(currencyDecimals).length);
    });

    it("exposes every supported code exactly once", () => {
      const codes = Currency.All.map((currency) => currency.code);
      assert.deepEqual([...codes].sort(), Object.keys(currencyDecimals).sort());
      assert.equal(new Set(codes).size, codes.length);
    });

    it("is frozen", () => {
      assert.equal(Object.isFrozen(Currency.All), true);
      assert.throws(
        () => (Currency.All as Currency[]).push(Currency.fromCode("USD")),
        TypeError,
      );
    });

    it("hands out the very instances returned by fromCode", () => {
      for (const currency of Currency.All) {
        assert.equal(Currency.fromCode(currency.code), currency);
      }
    });
  });

  describe("value semantics", () => {
    it("equates currencies with the same code", () => {
      assert.equal(
        Currency.fromCode("USD").equals(Currency.fromCode("USD")),
        true,
      );
    });

    it("does not equate different currencies", () => {
      assert.equal(
        Currency.fromCode("USD").equals(Currency.fromCode("EUR")),
        false,
      );
    });

    it("makes reference equality and value equality agree", () => {
      const a = Currency.fromCode("PEN");
      const b = Currency.fromCode("PEN");
      assert.equal(a === b, true);
      assert.equal(a.equals(b), true);
    });
  });

  describe("immutability", () => {
    it("freezes each shared instance", () => {
      // fromCode hands out singletons, so a single write would corrupt the
      // currency for every consumer in the process, not just this caller.
      const usd = Currency.fromCode("USD");

      assert.equal(Object.isFrozen(usd), true);
      assert.throws(() => {
        (usd as { decimals: number }).decimals = 8;
      }, TypeError);
      assert.equal(Currency.fromCode("USD").decimals, 2);
    });
  });
});
