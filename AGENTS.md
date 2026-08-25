# AGENTS.md

TypeScript reference implementation of the DDD Value Object pattern for Node.js. Built as
teaching material: each value object exists to demonstrate one aspect of the pattern —
self-validation, immutability, value equality, composition.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Runs `src/app.ts` in watch mode via `tsx` |
| `pnpm build` | Cleans `dist/` and compiles with `tsconfig.build.json` |
| `pnpm start` | Builds, then runs the compiled `dist/app.js` |
| `pnpm typecheck` | Type-checks without emitting |
| `pnpm test` | Runs `node:test` suites under `test/` via `tsx --test` |
| `pnpm test:watch` | Same, in watch mode |
| `pnpm test:coverage` | Same, with `--experimental-test-coverage` |
| `pnpm lint` / `pnpm lint:fix` | Biome check over `src` and `test` |

Package manager is pnpm (`pnpm@11.23.0`). Never use npm or yarn here.

## Local setup

`architecture/workspace.json` carries a `lastModifiedDate` that Structurizr rewrites every time
the workspace is opened. A `clean` filter pins it to the epoch in what git stores, so the stamp
alone never shows up as a change. `.gitattributes` names the filter, but a filter's definition
is not versioned — each clone needs it once:

```bash
git config filter.structurizr.clean 'sed "s/\"lastModifiedDate\" : \"[^\"]*\"/\"lastModifiedDate\" : \"1970-01-01T00:00:00Z\"/"'
```

Without it the field simply stops being normalised; nothing breaks.

## Layout

```
src/
  app.ts                     Runnable demo of the pattern
  domain/
    value-object.ts          ValueObject base class + EqualityComponent type
    email.vo.ts              Format validation + normalisation
    amount.vo.ts             Precise decimals via BigNumber.js
    currency.vo.ts           Closed set of currency codes, with decimal places
    money.vo.ts              Composition: Amount + Currency
    price.vo.ts              Refinement: Money constrained to non-negative
    types/currency.type.ts   currencyDecimals map + CurrencyCode
test/domain/                 One *.test.ts per value object, mirroring src/domain
architecture/                Structurizr workspace and exported diagrams
docs/
  adr/                       Architecture decision records
  agents/                    Conventions the agent skills read
CONTEXT.md                   Domain glossary (ubiquitous language)
```

## Conventions

- **Modules**: the package is ESM (`"type": "module"`) compiled with `module: nodenext`.
  Relative imports carry a `.js` extension even though the file on disk is `.ts` — the
  specifier names the emitted file, not the source, and `import type` is no exception.
  Omitting it is `TS2835`. `tsx` resolves extensionless specifiers anyway, so a missing
  one survives `pnpm dev` and only surfaces at `pnpm typecheck` or `pnpm build`; run one
  of those before calling an import done. There is no `require`, `__dirname` or
  `module.exports` anywhere in `src/` or `test/`.
- **Construction**: constructors are `private`. Every value object is built through a
  static factory — `create()`, or a domain-specific one such as `Currency.fromCode()` and
  `Money.zero()`.
- **Validation**: invariants are enforced at construction time and throw a plain `Error`
  with a message naming the offending value. An instance that exists is always valid.
  Operation arguments are validated too — `Amount.round()` and `toFixed()` reject decimals
  outside `0..MAX_DECIMALS`, so neither a `[BigNumber Error]` nor the heap exhaustion that
  `toFixed(1e9)` would cause ever reaches the caller. That makes `BigNumber` an implementation
  detail of `Amount` on the way out, but not on the way in: its parser is what decides which
  strings `create()` accepts, so `"0x1f"` is a valid amount and `"1,000"` is not. Nobody chose
  that; the `limits of this validation` suite in `amount.vo.test.ts` pins the surface rather
  than hiding it. Closing it would mean checking the shape of the string before BigNumber ever
  sees it — worth doing in a service fed by strangers, deliberately not done here, where naming
  the leak teaches more than papering over it.
- **Boundaries**: a signature that takes a primitive is a boundary and validates it; a
  signature that takes a value object trusts it. Constructors are private, so an `Amount`
  or a `Currency` in hand has already been through its factory and cannot be invalid.
  That one rule decides where a check belongs. `Amount.create()`, `Amount.round()`,
  `Amount.toFixed()` and `Currency.fromCode()` take primitives, so each rejects bad input
  as above. `Currency.fromCode()` takes a plain `string` rather than `CurrencyCode`:
  narrowing the parameter would only push callers to cast, and the cast is exactly the
  check the guard is there to perform. `Money.create()` is both at once — it validates the
  amount, propagating the errors of `Amount.create()` unchanged, and trusts the currency.
  `Money.zero()`, `Price.create()` and `Money.add()` / `subtract()` take value objects and
  never re-check them; `add()` still enforces the domain rule that currencies must match,
  which is a different thing from validating an argument. Passing `undefined` in from
  untyped JavaScript throws a bare `TypeError` from inside: that is a caller bug, not a
  domain case, and it is deliberately not guarded. Defending every argument against the
  type system would bury the invariants that actually matter.
- **Immutability**: every concrete value object calls `Object.freeze(this)` at the end of its
  constructor. `freeze` is shallow, so a field holding a mutable object is not enough on its
  own: `Amount` keeps its `BigNumber` in a `#private` field, unreachable by any cast.
  TypeScript's `private` would not do — it is erased at compile time and the object stays
  writable at runtime. Every other field is `public readonly`. Operations (`add`, `subtract`,
  `times`, `round`) return a new instance and never mutate the receiver. Every module is
  strict — ESM by definition, and `alwaysStrict` from the base tsconfig before that — so a
  write to a frozen field throws `TypeError` instead of passing silently. The `immutability`
  suites assert that throw, so a demo or test that writes to a frozen field must catch it.
- **Equality**: subclasses implement `protected equalityComponents(): readonly EqualityComponent[]`.
  The base `equals()` compares constructors first, then components pairwise — nested value
  objects recurse, `Date` compares by timestamp, everything else uses `===`.
- **Money arithmetic**: all decimal maths goes through `BigNumber.js`. `Amount` exposes its
  equality component as a fixed string so representation never affects equality.
- **Serialisation**: a value object implements `toJSON()` when `JSON.stringify` would
  otherwise put the wrong thing on the wire — either because the representation is hidden
  and the default is `{}` (`Amount`, whose `#value` is not an own property), or because its
  own fields would ship an internal shape (`Price`, where the `money` field would otherwise
  become part of the public contract and change the day it is renamed). What comes out is a
  form the factories can read back, which is not the same as `toString()`: that one is for
  humans and stops round-tripping as soon as a value object composes others (`"10.50 USD"`
  goes out, but no factory takes it in). `Money` and `Price` share one form, exported as
  `MoneyJSON`: the amount padded to the currency scale, and the currency as its code alone —
  `decimals` is left out because it is derived from that code, and shipping it would invite a
  caller to contradict the currency table. Sharing that form means the wire carries the value
  and not the type: a payload cannot say whether it came from a `Money` or a `Price`, so
  reading one back goes through whichever factory the caller intends.
- **Naming**: value object files are `*.vo.ts`, shared types are `*.type.ts`, test files are
  `test/domain/<name>.test.ts`. Class names are the domain term, never suffixed with `VO`.
- **Tests**: `node:test` with `describe`/`it` and `node:assert/strict`. Test names, comments
  and identifiers are written in English.
- **Demo**: `src/app.ts` is executable documentation — every `console.log` carries a `// ->`
  comment with the exact line it prints. Changing one means re-running `pnpm start` and
  updating the comment: a stale `// ->` is a lie the reader has no way to catch. When the
  point of a snippet is something a tool flags — a number literal that loses precision, say —
  suppress it with a stated reason instead of rewriting the example around the tool; the
  suppression is part of the lesson.

## Invariants worth knowing

- `Amount` accepts negative values — it only rejects `NaN` and non-finite input. Non-negativity
  is `Price`'s invariant, not `Amount`'s. The two defects are named apart (`"is not a number"`
  vs `"is not a finite number"`) from every entry point: `create()` and the operators alike.
- `Amount` bounds the scale but not the magnitude. `round()` and `toFixed()` cap decimals at
  `MAX_DECIMALS`, yet nothing caps how large a value may be: `"1e10000000"` is still finite to
  BigNumber, and every `toString()` — and so every `equals()`, which compares fixed strings —
  materialises all ten million digits. Acceptable in a teaching domain; a service taking
  amounts from strangers would bound both.
- `Amount.create()` and `Amount.times()` take `number | string`. A `number` factor has already
  been through binary floating point before the call, so a string is the only way to hand it an
  exact one — the type cannot rescue a value that arrived corrupted. `BigNumber` is kept out of
  both signatures on purpose: a caller holding one passes `bn.toFixed()`, exact and the same form
  `Amount` uses as its equality component, so the library never crosses a public boundary.
- `BigNumber` can fail three ways, and any operation added to `Amount` has to answer for all
  three: it can return `NaN` (`0/0`), it can return a non-finite value (`10/0`, or a `times()`
  that overflows two finite operands), or it can throw a `[BigNumber Error]` of its own
  (`exponentiatedBy(0.5)`). The private constructor catches the first two for every operator at
  once — which is why its `NaN` guard stays although no current path reaches it. The third has
  no such gate: it is headed off where the argument is validated, the way `assertDecimals()`
  does for `round()` and `toFixed()`.
- `Money` rounds its amount to the currency's decimal places at construction (`JPY` → 0, others → 2).
- `Money.add()` / `subtract()` throw when currencies differ.
- `Currency.All` is a frozen list built from `currencyDecimals`; `fromCode()` returns the shared
  instance, so currencies are interned.
- `Currency.fromCode()` validates without normalising. ISO 4217 codes are uppercase, so `"usd"`
  is a malformed code rather than the same code written differently, and accepting it would
  hide a broken payload. `Email` is the opposite case: it normalises before validating, because
  two addresses differing only in case really are one address. Normalising is part of a
  boundary's job only when the domain says the two forms mean the same thing.

## Collaboration model

The agent acts as an **architectural consultant and pair programmer**, not as an automated
code modifier. The point of each exchange is to reason about design and arrive at a solution
the user then implements by hand.

- **Source code**: do **not** edit `.ts`, `.json` or `.sql` files. Deliver every code
  suggestion as a snippet in the reply.
- **Documentation**: `AGENTS.md`, `CONTEXT.md`, `README.md`, `docs/**` may be edited with
  file tools, but **only when the user explicitly asks**.
- **Shell**: avoid commands that mutate the filesystem or git state unless asked.

## Agent skills

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
