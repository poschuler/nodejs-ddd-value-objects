# 3. The wire form carries the currency code alone

- **Status**: Accepted
- **Date**: 2026-08-24

## Context

`JSON.stringify` only sees own enumerable properties. For `Amount`, whose value lives in a
`#private` field, that means `{}` — the value would vanish with no error at all. For `Money` and
`Price`, whose fields are public, it means whatever those fields happen to be named.

So each of them needs to say what it puts on the wire, and that form has to be one the factories
can read back. It is not the same job as `toString()`, which is for humans and stops
round-tripping as soon as a value object composes others: `"10.50 USD"` goes out, and no factory
takes it in.

## Decision

`Amount.toJSON()` emits its canonical text form — a string, not an object: `"10.5"`, which
`Amount.create()` takes straight back.

`Money.toJSON()` emits `{ amount, currency }` — the amount padded to the currency's scale, the
currency as its ISO code alone. The shape is exported as `MoneyJSON`. `Price.toJSON()` delegates
to the `Money` it wraps and reuses that type.

### Alternatives considered

**Ship `decimals` alongside the code** — rejected because it is derived data. A payload carrying
`{"currency":"USD","decimals":3}` would contradict the currency table, and every reader would then
need a rule for which of the two wins. A value that can be recomputed should not travel.

**Serialise the whole `Currency`** — the same problem, more verbosely.

**Emit `toString()`** — human-readable, but no factory parses it.

**For `Price`, let its `money` field serialise as-is** — this was the original behaviour, and it
emitted `{"money":{...}}`. Rejected because it puts an internal field name into the public
contract: renaming the field would break every consumer, and nobody would have decided that the
name was part of the API in the first place.

## Consequences

- Both types round-trip through their factories, and the demo and tests assert it.
- **A `Price` and the `Money` it wraps serialise identically.** The wire form carries the value,
  not the type. A payload cannot say which one it came from, so reading it back goes through
  whichever factory the caller intends — `Money.create(...)` or `Price.create(Money.create(...))`.
  A consumer that needs to tell them apart must get that from the field holding it, as `unitPrice`
  does, never from the payload.
- The serialised form keys by value, so it works as a `Map` key where the instances themselves do
  not — at the cost that a `Price` and a `Money` of the same figure now collide as one key.
- **`decimals` is recomputed from the code on the way in.** If the currency table ever changes an
  entry's scale, previously stored payloads are reinterpreted under the new one. That is the
  honest price of not shipping derived data, and it is the right trade: a stale scale inside a
  payload would be just as wrong and much harder to notice.
