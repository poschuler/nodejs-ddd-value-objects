# Value Objects

A teaching domain built around money and identity primitives. Every concept here is a value
— it has no identity of its own, it is fully described by its attributes, and two instances
with the same attributes are the same thing.

## The pattern

**Value Object**:
A domain concept defined entirely by its attributes rather than by an identity. Immutable,
self-validating, and compared by value.
_Avoid_: entity, model, DTO, struct

**Equality Components**:
The ordered attributes that constitute a value object's identity for comparison purposes.
Two value objects of the same type are equal when their equality components are equal.
_Avoid_: identity fields, comparison keys, hash parts

**Factory**:
The named static entry point through which a value object comes into existence, and the only
place where its invariants are checked.
_Avoid_: builder, constructor, initializer

**Invariant**:
A rule that must hold for a value object to exist at all. A value object that violates an
invariant is never created; the attempt fails instead.
_Avoid_: constraint, validation rule, business rule

## Money

**Amount**:
A quantity expressed as an exact decimal, with no currency attached. May be negative.
_Avoid_: value, number, quantity, decimal

**Currency**:
A supported unit of monetary denomination, identified by its ISO code and carrying the number
of decimal places its amounts are expressed in.
_Avoid_: currency code, denomination, ISO code

**Money**:
An Amount denominated in a Currency, expressed at that currency's decimal precision.
Arithmetic between different currencies is not a valid operation.
_Avoid_: cash, monetary value, funds

**Price**:
Money that is never negative — what something costs.
_Avoid_: cost, fee, rate, tariff

## Identity

**Email**:
A syntactically valid email address, normalised to lowercase and without surrounding
whitespace, so that addresses differing only in case are the same address.
_Avoid_: email address, mail, e-mail, address
