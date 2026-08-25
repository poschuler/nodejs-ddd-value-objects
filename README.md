# Node.js DDD Value Objects

A reference implementation of the Domain-Driven Design **Value Object** pattern in TypeScript,
built as teaching material. Each value object here exists to demonstrate one aspect of the
pattern — self-validation, immutability, value equality, composition, refinement — and each
decision that could have gone another way is written down in [`docs/adr/`](docs/adr/).

## Core Concepts Illustrated

### 1. Value Objects

A value object measures, quantifies or describes a thing in the domain. It has no identity of its
own: it is fully described by its attributes.

- **Immutability**: once created, the state cannot change. Every concrete value object calls
  `Object.freeze(this)` in its constructor. Because `freeze` is shallow, a field holding a mutable
  object needs more than that: `Amount` keeps its `BigNumber` in a `#private` field, so no cast
  can reach it and mutate the value in place — TypeScript's `private` would not do, since it is
  erased at compile time.
- **Value-based equality**: two value objects are equal when all their attributes are equal, not
  when they are the same reference.
- **Self-validation**: they enforce their own invariants at creation. The constructor is private
  and construction goes through a static factory, so an instance that exists is always valid. A
  factory handed bad input throws an `Error` naming the offending value.
- **No side effects**: operations return a new instance rather than modifying the receiver.

### 2. The `ValueObject` Abstract Class

[`src/domain/value-object.ts`](src/domain/value-object.ts) is the base class every value object
extends. It provides:

- `equals(other: unknown): boolean` — returns `false` for anything that is not a `ValueObject` of
  the exact same class, then compares components pairwise.
- `protected equalityComponents(): readonly EqualityComponent[]` — abstract; each subclass names
  the attributes that constitute its value.

The same file exports `EqualityComponent` — `string | number | boolean | Date | ValueObject |
null | undefined`. Nested value objects are compared recursively, `Date` by timestamp, and
everything else by `===`.

## The Value Objects

| Value object | What it is | What it demonstrates |
| --- | --- | --- |
| [`Email`](src/domain/email.vo.ts) | A syntactically valid address, trimmed and lowercased | Normalising **before** validating, so `""` and `"   "` fail for the same reason and two addresses differing only in case are one address |
| [`Amount`](src/domain/amount.vo.ts) | An exact decimal quantity, no currency attached, may be negative | Hiding a mutable dependency behind a `#private` field; arithmetic that returns new instances; rejecting `NaN` and non-finite input by name |
| [`Currency`](src/domain/currency.vo.ts) | A supported ISO 4217 code and the number of decimals its amounts carry | A closed set with interned instances (`Currency.All`); validating **without** normalising |
| [`Money`](src/domain/money.vo.ts) | An `Amount` denominated in a `Currency` | Composition, and an invariant that spans two objects: `add()` and `subtract()` refuse to mix currencies |
| [`Price`](src/domain/price.vo.ts) | `Money` that is never negative — what something costs | Refinement: narrowing another value object by adding an invariant instead of duplicating its behaviour |

### Four details worth a second look

- **`Amount` accepts `"0x1f"` but rejects `"1,000"`.** What counts as a number is decided by
  `bignumber.js`, not by `Amount`. The library is an implementation detail on the way out — its
  errors never surface — but not on the way in, where its parser is what decides which strings are
  numbers at all. The `limits of this validation` suite pins that surface rather than hiding it.
- **`Money` rounds at construction, not at display.** An amount arriving with more decimals than
  its currency allows is rounded half away from zero right there, so a `Money` is always expressed
  at its currency's precision and two paths to the same figure agree.
- **A `Price` and the `Money` it wraps serialise identically.** Both emit
  `{"amount":"19.99","currency":"USD"}`. The wire form carries the value, not the type: a payload
  cannot say which one it came from, so reading it back goes through whichever factory the caller
  intends.
- **A signature taking a primitive validates; a signature taking a value object trusts.** That one
  rule decides where every check belongs. It is why `Currency.fromCode()` takes a plain `string`
  rather than a `CurrencyCode` — narrowing the parameter would only push callers to cast past the
  very check the guard is there to perform.

## Where the Reasoning Lives

The code shows what was built. These say why, and they are the point of the repository as much as
the classes are.

| Where | What it holds |
| --- | --- |
| [`docs/adr/`](docs/adr/) | The decisions that could have gone another way, each with the alternatives that were rejected and the consequences accepted |
| [`CONTEXT.md`](CONTEXT.md) | The ubiquitous language: one definition per domain term, and the words deliberately avoided |
| [`AGENTS.md`](AGENTS.md) | Conventions and invariants, written for whoever — or whatever — edits this code next |
| [`src/app.ts`](src/app.ts) | A runnable tour of every value object. Each `console.log` carries a `// ->` comment with the exact line it prints |

The decisions recorded so far:

1. [Exact decimals through bignumber.js](docs/adr/0001-exact-decimals-via-bignumber.md) — and why
   minor-unit integers, the classic Money-pattern answer, were rejected.
2. [Money rounds at construction](docs/adr/0002-money-rounds-at-construction.md).
3. [The wire form carries the currency code alone](docs/adr/0003-wire-form-carries-the-currency-code-alone.md).

## Project Structure

```
├───src/
│   ├───app.ts                     # Runnable tour of every value object
│   └───domain/
│       ├───types/
│       │   └───currency.type.ts   # Supported currency codes and their decimal places
│       ├───value-object.ts        # Base class for all value objects
│       ├───amount.vo.ts           # Exact decimal quantity
│       ├───currency.vo.ts         # Supported currency code
│       ├───email.vo.ts            # Email address
│       ├───money.vo.ts            # Composition: Amount + Currency
│       └───price.vo.ts            # Refinement: Money constrained to non-negative
├───test/
│   └───domain/                    # One suite per value object, using node:test
├───architecture/                  # Structurizr workspace and exported diagrams
├───docs/
│   ├───adr/                       # Architecture decision records
│   └───agents/                    # Conventions the AI coding skills read
├───CONTEXT.md                     # Domain glossary (ubiquitous language)
├───AGENTS.md                      # Context and rules of engagement for AI assistants
├───tsconfig.json                  # Type-checking configuration
├───tsconfig.build.json            # Emit configuration (dist/)
└───biome.json                     # Linting and formatting
```

## Architecture & Diagrams

Diagrams follow the C4 model and are defined as code in
[`architecture/workspace.dsl`](architecture/workspace.dsl), rendered with
[Structurizr](https://structurizr.com/). The SVGs below are exports; run Structurizr locally for
the interactive version.

- **Domain-Layer-Overview** — every value object and its relationship to the abstract base class.

    ![Domain Layer Overview](architecture/diagrams/Domain-Layer-Overview.svg)

- **Email-Value-Object** — a single, simple value object in isolation.

    ![Email Value Object](architecture/diagrams/Email-Value-Object.svg)

- **Money-Value-Object** — composition: `Money` built from `Amount` and `Currency`, and the
  external dependency on `bignumber.js`.

    ![Money Value Object](architecture/diagrams/Money-Value-Object.svg)

- **Price-Value-Object** — refinement: `Price` narrowing `Money` with a non-negativity invariant.

    ![Price Value Object](architecture/diagrams/Price-Value-Object.svg)

### Running Structurizr Locally

`docker-compose up`, then open `http://localhost:8081`. The `./architecture` directory is mounted
as Structurizr's data directory, so edits to the `.dsl` file are picked up on refresh.

This uses the `local` command of the Structurizr tooling, which replaces Structurizr Lite —
discontinued in March 2026, with `structurizr/lite:latest` now serving only a deprecation notice.
The container is pinned to `user: "1000:1000"` so it can write to the mounted directory; the
image's default is the distroless `nonroot` account (UID 65532), which cannot write to a host
directory owned by you. Adjust the UID/GID if yours differ (`id -u`, `id -g`).

> **Note**: `architecture/workspace.json` carries a `lastModifiedDate` that Structurizr rewrites
> on every open. A git `clean` filter keeps that stamp out of the history: `.gitattributes` names
> the filter, but its definition is local to each clone. See **Local setup** in `AGENTS.md` for
> the one-off `git config` a fresh clone needs.

## Getting Started

Requires **Node.js v24 or higher** (the TypeScript configuration extends `@tsconfig/node24`) and
**pnpm** — the project pins `pnpm@11.23.0` via the `packageManager` field.

```bash
git clone https://github.com/poschuler/nodejs-ddd-value-objects.git
cd nodejs-ddd-value-objects
pnpm install
pnpm dev        # runs src/app.ts in watch mode
```

| Command | What it does |
| --- | --- |
| `pnpm dev` | Runs `src/app.ts` in watch mode via `tsx` |
| `pnpm start` | Builds, then runs the compiled `dist/app.js` |
| `pnpm test` | Runs every suite once |
| `pnpm test:watch` | Re-runs on change |
| `pnpm test:coverage` | Runs with Node's experimental coverage report |
| `pnpm typecheck` | Type-checks `src` and `test` without emitting |
| `pnpm build` | Clears `dist/` and compiles `src` with `tsconfig.build.json` |
| `pnpm lint` / `pnpm lint:fix` | Biome check over `src` and `test`, reporting or writing |

## Technologies Used

- **TypeScript** on **Node.js**, as native ESM (`"type": "module"`, `module: nodenext`). Relative
  imports carry a `.js` extension even though the source file is `.ts` — the specifier names the
  emitted file, not the source.
- **bignumber.js** for arbitrary-precision decimal arithmetic.
- **tsx** to execute TypeScript directly, and **node:test** with `node:assert/strict` for the
  suites.
- **Biome** for linting and formatting, **pnpm** as the package manager.

## License

MIT. See the [`LICENSE`](LICENSE) file.

---

> This README was drafted with an LLM and reviewed by hand. Where it summarises a decision, the
> record in [`docs/adr/`](docs/adr/) is the longer and more careful version — and where either
> disagrees with the code, the code and its tests are what actually run.
