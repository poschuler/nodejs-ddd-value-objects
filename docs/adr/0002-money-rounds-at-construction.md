# 2. Money rounds to the currency scale at construction

- **Status**: Accepted
- **Date**: 2026-08-24

## Context

An `Amount` carries as many decimals as it was given. A `Currency` says how many its amounts are
expressed in — two for `USD`, none for `JPY`. So a `Money` can be handed more precision than its
currency can express: `1000.005 USD`, or the result of splitting `100.00` three ways.

Something has to decide where that excess goes. There are only three places: when the value is
built, when it is displayed, or never.

## Decision

`Money` rounds at construction, half away from zero, to `currency.decimals`. A `Money` is
therefore always expressed at its currency's precision, and the amount it holds is the amount it
prints.

### Alternatives considered

**Round only when formatting** — keep `1000.005` inside and show `1000.01`. Rejected because it
breaks the promise that a value object *is* its value: two instances that display identically
would not be `equals`, and the sum of what is stored would drift away from the sum of what was
shown. The discrepancy would surface as a reconciliation bug months later, which is the worst
possible place to find it.

**Refuse an amount with more decimals than the currency expresses** — stricter, and defensible in
a system where every amount arrives already scaled. Rejected because the excess mostly comes from
division and percentages, so the rule would push the same rounding decision onto every caller,
repeatedly, with no shared answer.

## Consequences

- A `Money` is always at its currency's scale, `equals` agrees with what is printed, and the wire
  form needs no scaling of its own.
- **Rounding before operating is not the same as rounding after.** Two half-cents built as
  separate `Money` become one cent each, so they add up to `0.02 USD`, not `0.01`. The
  `rounds each operand before adding` test states this outright. A caller who needs the
  intermediate precision must do the arithmetic in `Amount` and build the `Money` at the end.
- An amount below half the minor unit rounds to zero, so `0.004 USD` reports `isZero()`. A
  negative one rounds up to zero, which is why `Price` accepts `-0.004` and rejects `-0.005`.
- Half away from zero is a choice, not a law. Half to even — the IEEE 754 default, and long
  standing practice in accounting — would change these results: `2.345` would land on `2.34`
  rather than `2.35`. The mode is named in exactly one place, `Amount.round()`, so changing it is
  a one-line decision rather than a hunt.
- Distributing a total without losing or inventing a minor unit — splitting `100.00` three ways —
  is **deliberately out of scope**. It needs an allocation operation that returns several `Money`
  and places the remainder, which this repository does not implement.
