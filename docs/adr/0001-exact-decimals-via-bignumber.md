# 1. Exact decimals through bignumber.js

- **Status**: Accepted
- **Date**: 2026-08-24

## Context

`Amount` has to hold monetary quantities exactly. JavaScript's `number` is an IEEE 754 binary
double, so decimal fractions that are not a sum of negative powers of two cannot be represented:
`0.1 + 0.2` is `0.30000000000000004`, and `(1.005).toFixed(2)` is `"1.00"`. Neither is acceptable
for money, and both fail quietly — no exception, no flag, just a slightly wrong figure that
survives every downstream operation.

Being teaching material shapes how the problem is presented — `src/app.ts` prints `0.1 + 0.2`
before showing the fix — but it does not decide between the options below: any of them can be
demonstrated just as plainly. Correctness and cost decide.

## Decision

`Amount` holds a `BigNumber` from `bignumber.js`, in a `#private` field, and every decimal
operation goes through it. Rounding is explicit and half away from zero (`ROUND_HALF_UP`).
The library stays out of every public signature: `create()` and `times()` take `number | string`,
and the props type that names a `BigNumber` is not exported.

### Alternatives considered

**Integers of the minor unit in a `number`** — the classic Money-pattern answer: store 1050 and
remember it means 10.50. Rejected because the scale is not universal (`JPY` has none, `USD` has
two), so the scale has to travel next to the integer anyway; because `Number.MAX_SAFE_INTEGER`
caps the representable range; and because any intermediate step with a real fraction — a tax
rate, a percentage, a split — drops straight back into binary floating point. It avoids the
problem in the easy cases and hides it in the hard ones.

**Native `BigInt`** — exact and unbounded, but integral: it needs the same manual scale as the
option above, and offers no rounding mode of its own.

**`decimal.js` / `big.js`** — equivalent in kind. `bignumber.js` was chosen out of familiarity,
with no technical argument deciding it; any of the three would serve. Worth stating plainly,
because it is the alternative most likely to be reconsidered — and reconsidering it is not free,
for the reason in the last consequence below.

## Consequences

- Decimal arithmetic is exact, and rounding is a decision the code states rather than a side
  effect of the representation.
- **The library's parser shows through the contract.** `Amount.create()` validates that its input
  is a finite number, but what counts as a number is decided by `bignumber.js`: `"0x1f"` is `31`,
  `"0xff.8"` is `255.5`, and `"1,000"` is rejected. Nobody chose that surface. It is pinned by the
  `limits of this validation` suite rather than hidden; closing it would mean validating the shape
  of the string before the library sees it.
- **The scale is bounded, the magnitude is not.** `round()` and `toFixed()` cap decimals at
  `MAX_DECIMALS`, but nothing caps size: `"1e10000000"` is still a finite `BigNumber` whose every
  `toString()` materialises ten million digits.
- **Three failure modes to answer for.** Any operation added to `Amount` must handle a `NaN`
  result (`0/0`), a non-finite one (`10/0`, or a `times()` that overflows), and a
  `[BigNumber Error]` thrown by the library itself (`exponentiatedBy(0.5)`). The private
  constructor catches the first two for every operator at once; the third is headed off where the
  argument is validated, as `assertDecimals()` does.
- Hiding the `BigNumber` in a `#private` field makes it unreachable by any cast, which is what
  keeps an already-validated value from being mutated later — but it also makes the field
  invisible to `JSON.stringify`, which is why `Amount` implements `toJSON()`.
- **Contained in the signatures, not in the build.** No public signature mentions `BigNumber`:
  a caller holding one hands over `bn.toFixed()`, which is exact and is the same form `Amount`
  already uses as its equality component. Narrowing the two signatures that used to accept one
  cost nothing, because nothing in `src/` ever passed a `BigNumber` — only two tests did, and they
  now hand in the fixed string instead. What a signature cannot hide is the rest:
  `amount.vo.test.ts` still imports the library to build those values, and the parser surface and
  rounding mode described above are observable behaviour a replacement would have to match, not
  implementation detail it could quietly redefine. Containing a library in the types is not the
  same as being able to swap it.
