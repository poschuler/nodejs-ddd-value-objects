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
- **Immutability**: fields are `public readonly`; every concrete value object calls
  `Object.freeze(this)` at the end of its constructor. Operations (`add`, `subtract`,
  `times`, `round`) return a new instance and never mutate the receiver.
- **Equality**: subclasses implement `protected equalityComponents(): readonly EqualityComponent[]`.
  The base `equals()` compares constructors first, then components pairwise — nested value
  objects recurse, `Date` compares by timestamp, everything else uses `===`.
- **Money arithmetic**: all decimal maths goes through `BigNumber.js`. `Amount` exposes its
  equality component as a fixed string so representation never affects equality.
- **Naming**: value object files are `*.vo.ts`, shared types are `*.type.ts`, test files are
  `test/domain/<name>.test.ts`. Class names are the domain term, never suffixed with `VO`.
- **Tests**: `node:test` with `describe`/`it` and `node:assert/strict`. Test names, comments
  and identifiers are written in English.

## Invariants worth knowing

- `Amount` accepts negative values — it only rejects `NaN` and non-finite input. Non-negativity
  is `Price`'s invariant, not `Amount`'s.
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
