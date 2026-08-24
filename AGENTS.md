# AGENTS.md

TypeScript reference implementation of the DDD Value Object pattern for Node.js. Built as
teaching material: each value object exists to demonstrate one aspect of the pattern —
self-validation, immutability, value equality, composition.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Runs `src/app.ts` in watch mode via `tsx` |
| `pnpm build` | Cleans `dist/` and compiles with `tsconfig.build.json` |
| `pnpm typecheck` | Type-checks without emitting |
| `pnpm test` | Runs `node:test` suites under `test/` via `tsx --test` |
| `pnpm test:watch` | Same, in watch mode |
| `pnpm test:coverage` | Same, with `--experimental-test-coverage` |
| `pnpm lint` / `pnpm lint:fix` | Biome check over `src` and `test` |

Package manager is pnpm (`pnpm@10.17.1`). Never use npm or yarn here.

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
```

## Conventions

- **Construction**: constructors are `private`. Every value object is built through a
  static factory — `create()`, or a domain-specific one such as `Currency.fromCode()` and
  `Money.zero()`.
- **Validation**: invariants are enforced at construction time and throw a plain `Error`
  with a message naming the offending value. An instance that exists is always valid.
  Operation arguments are validated too — `Amount.round()` and `toFixed()` reject decimals
  outside `0..MAX_DECIMALS`, so neither a `[BigNumber Error]` nor the heap exhaustion that
  `toFixed(1e9)` would cause ever reaches the caller. `BigNumber` is an implementation detail
  of `Amount`, not part of its contract.
- **Immutability**: every concrete value object calls `Object.freeze(this)` at the end of its
  constructor. `freeze` is shallow, so a field holding a mutable object is not enough on its
  own: `Amount` keeps its `BigNumber` in a `#private` field, unreachable by any cast.
  TypeScript's `private` would not do — it is erased at compile time and the object stays
  writable at runtime. Every other field is `public readonly`. Operations (`add`, `subtract`,
  `times`, `round`) return a new instance and never mutate the receiver.
- **Equality**: subclasses implement `protected equalityComponents(): readonly EqualityComponent[]`.
  The base `equals()` compares constructors first, then components pairwise — nested value
  objects recurse, `Date` compares by timestamp, everything else uses `===`.
- **Money arithmetic**: all decimal maths goes through `BigNumber.js`. `Amount` exposes its
  equality component as a fixed string so representation never affects equality.
- **Serialisation**: a value object that hides its representation implements `toJSON()`, since
  `JSON.stringify` only sees own enumerable properties and would otherwise emit `{}`. It
  returns a form the factories can read back, which is not the same as `toString()`: that one
  is for humans and stops round-tripping as soon as a value object composes others
  (`"10.50 USD"` goes out, but no factory takes it in).
- **Naming**: value object files are `*.vo.ts`, shared types are `*.type.ts`, test files are
  `test/domain/<name>.test.ts`. Class names are the domain term, never suffixed with `VO`.
- **Tests**: `node:test` with `describe`/`it` and `node:assert/strict`. Test names, comments
  and identifiers are written in English.

## Invariants worth knowing

- `Amount` accepts negative values — it only rejects `NaN` and non-finite input. Non-negativity
  is `Price`'s invariant, not `Amount`'s. The two defects are named apart (`"is not a number"`
  vs `"is not a finite number"`) from every entry point: `create()` and the operators alike.
- `Amount.times()` takes `number | string | BigNumber`. A `number` factor has already been
  through binary floating point before the call, so a string is the only way to hand it an
  exact one — the type cannot rescue a value that arrived corrupted.
- `Money` rounds its amount to the currency's decimal places at construction (`JPY` → 0, others → 2).
- `Money.add()` / `subtract()` throw when currencies differ.
- `Currency.All` is a frozen list built from `currencyDecimals`; `fromCode()` returns the shared
  instance, so currencies are interned.

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

### Issue tracker

Issues live as GitHub issues on `poschuler/nodejs-ddd-value-objects`, driven by the `gh` CLI.
See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label named after its role. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
