import { Amount } from "./domain/amount.vo";
import { Currency } from "./domain/currency.vo";
import { Email } from "./domain/email.vo";
import { Money } from "./domain/money.vo";
import { Price } from "./domain/price.vo";
import type { CurrencyCode } from "./domain/types/currency.type";

console.log("--- Email Value Object ---");

// 1. Creating two different instances in memory
const emailA = Email.create("ADMIN@company.com");
const emailB = Email.create("  admin@company.com  ");

// 2. Comparing memory references (should be false)
console.log(`emailA === emailB: ${emailA === emailB}`); // -> false

// 3. Comparing by Value (should be true)
console.log(`emailA.equals(emailB): ${emailA.equals(emailB)}`); // -> true

// 4. A case of inequality
const emailC = Email.create("anotherAdmin@company.com");
console.log(`emailA.equals(emailC): ${emailA.equals(emailC)}`); // -> false

// 5. Casing and surrounding blanks never reach the field
console.log(`emailA.value: ${emailA.value}`); // -> admin@company.com
console.log(`emailB.value: ${emailB.value}`); // -> admin@company.com

// 6. A missing value is reported apart from a malformed one
try {
  Email.create("   ");
} catch (error) {
  console.log(`Blank email: ${(error as Error).message}`); // -> Email requires a value
}

// 7. A domain with no dot is not an address
try {
  Email.create("admin@company");
} catch (error) {
  console.log(`Missing TLD: ${(error as Error).message}`); // -> Invalid email address
}

// 8. Neither are consecutive dots
try {
  Email.create("admin..user@company.com");
} catch (error) {
  console.log(`Double dot: ${(error as Error).message}`); // -> Invalid email address
}

console.log("\n--- Amount Value Object ---");

// 1. What binary floating point does to decimals
console.log(`0.1 + 0.2 as numbers: ${0.1 + 0.2}`); // -> 0.30000000000000004

// 2. The same sum, kept exact
const sum = Amount.create("0.1").add(Amount.create("0.2"));
console.log(`0.1 + 0.2 as Amount: ${sum}`); // -> 0.3

// 3. A number literal is already corrupted before Amount ever sees it
// biome-ignore lint/correctness/noPrecisionLoss: losing it is the whole point
const fromNumber = Amount.create(9007199254740993);
const fromString = Amount.create("9007199254740993");
console.log(`From number literal: ${fromNumber}`); // -> 9007199254740992
console.log(`From string literal: ${fromString}`); // -> 9007199254740993

// 4. Same story for a factor: only a string carries it in untouched
console.log(`times(0.1 + 0.2): ${Amount.create(1).times(0.1 + 0.2)}`); // -> 0.30000000000000004
console.log(`times("0.3"): ${Amount.create(1).times("0.3")}`); // -> 0.3

// 5. Representation never affects equality
const oneAndAHalf = Amount.create("1.5");
const oneAndAHalfPadded = Amount.create("1.50");
console.log(`"1.50" equals "1.5": ${oneAndAHalfPadded.equals(oneAndAHalf)}`); // -> true

// 6. Rounding is half up, and returns a new instance
const raw = Amount.create("2.345");
console.log(`raw.round(2): ${raw.round(2)}`); // -> 2.35
console.log(`raw is unchanged: ${raw}`); // -> 2.345

// 7. Negatives are Amount's business; non-negativity belongs to Price
console.log(`(-5).isNegative(): ${Amount.create(-5).isNegative()}`); // -> true

// 8. The two defects are named apart
try {
  Amount.create("abc");
} catch (error) {
  console.log(`Not a number: ${(error as Error).message}`); // -> Invalid amount: "abc" is not a number
}

try {
  Amount.create(Number.POSITIVE_INFINITY);
} catch (error) {
  console.log(`Not finite: ${(error as Error).message}`); // -> Invalid amount: "Infinity" is not a finite number
}

// 9. A malformed factor is reported by its own literal, never as NaN
try {
  Amount.create(1).times("abc");
} catch (error) {
  console.log(`Bad factor: ${(error as Error).message}`); // -> Invalid amount: "abc" is not a number
}

// 10. Decimal places are an argument like any other, so they are validated too
try {
  Amount.create(1).round(1e9);
} catch (error) {
  console.log(`Bad decimals: ${(error as Error).message}`); // -> Invalid decimals: "1000000000" must be an integer between 0 and 20
}

console.log("\n--- Currency Value Object ---");

// 1. Setup currencies
const usd = Currency.fromCode("USD");
const eur = Currency.fromCode("EUR");
const jpy = Currency.fromCode("JPY");

// 2. A closed set, each code carrying its decimal places
const supported = Currency.All.map((c) => `${c.code}/${c.decimals}`);
console.log(`Supported: ${supported.join(", ")}`); // -> PEN/2, USD/2, EUR/2, JPY/0

// 3. Currencies are interned: unlike Email, one code is one instance
const usdAgain = Currency.fromCode("USD");
console.log(`usd === usdAgain: ${usd === usdAgain}`); // -> true

// 4. Equality still answers by value, as in every other value object
console.log(`usd.equals(usdAgain): ${usd.equals(usdAgain)}`); // -> true
console.log(`usd.equals(eur): ${usd.equals(eur)}`); // -> false

// 5. A code outside the set has no instance to return
try {
  Currency.fromCode("XYZ" as CurrencyCode);
} catch (error) {
  console.log(`Unknown code: ${(error as Error).message}`); // -> Unsupported currency code: XYZ
}

console.log("\n--- Money Value Object ---");

// 1. Create Money instances
const salary = Money.create({ amount: 1000, currency: usd });
const bonus = Money.create({ amount: "250.5", currency: usd });
const salaryInEUR = Money.create({ amount: 1000, currency: eur });

// 2. Composition: the currency decides the scale the amount is stored at
console.log(`Salary: ${salary}`); // -> 1000.00 USD
console.log(`Bonus: ${bonus}`); // -> 250.50 USD

const inYen = Money.create({ amount: "1234.56", currency: jpy });
console.log(`Yen has no cents: ${inYen}`); // -> 1235 JPY

// 3. Rounding happens at construction, half up
const halfCent = Money.create({ amount: "1000.005", currency: usd });
console.log(`1000.005 USD: ${halfCent}`); // -> 1000.01 USD

// 4. Which means an amount can round its way down to zero
const dust = Money.create({ amount: "0.004", currency: usd });
console.log(`0.004 USD is zero: ${dust.isZero()}`); // -> true

// 5. Demonstrate Equality
const sameSalary = Money.create({ amount: "1000.00", currency: usd });
console.log(`salary.equals(sameSalary): ${salary.equals(sameSalary)}`); // -> true
console.log(`salary.equals(bonus): ${salary.equals(bonus)}`); // -> false
console.log(`salary.equals(salaryInEUR): ${salary.equals(salaryInEUR)}`); // -> false

// 6. Perform operations
const fee = Money.create({ amount: "0.5", currency: usd });
const totalPayout = salary.add(bonus).subtract(fee);
console.log(`Total Payout (USD): ${totalPayout}`); // -> 1250.00 USD

// 7. Demonstrate immutability: the operands came out of it untouched
console.log(`Original salary amount: ${salary}`); // -> 1000.00 USD

// 8. And the instance itself is frozen: the module is strict, so the write
//    is refused outright instead of passing silently
console.log(`Object.isFrozen(salary): ${Object.isFrozen(salary)}`); // -> true

try {
  (salary as unknown as { amount: unknown }).amount = null;
} catch (error) {
  console.log(`Writing to a frozen field: ${(error as Error).message}`); // -> Cannot assign to read only property 'amount' of object '[object Object]'
}

console.log(`Salary is intact: ${salary}`); // -> 1000.00 USD

// 9. Handle different currencies
try {
  salary.add(salaryInEUR);
} catch (error) {
  console.log(`Adding different currencies: ${(error as Error).message}`); // -> Cannot add money with different currencies
}

try {
  salary.subtract(salaryInEUR);
} catch (error) {
  console.log(`Subtracting different currencies: ${(error as Error).message}`); // -> Cannot subtract money with different currencies
}

// 10. Using the Zero factory
const zeroUSD = Money.zero(usd);
console.log(`Is zero? ${zeroUSD.isZero()}`); // -> true
console.log(`Is zero in USD? ${zeroUSD.equals(Money.zero(usd))}`); // -> true
console.log(`Is zero in EUR? ${zeroUSD.equals(Money.zero(eur))}`); // -> false

console.log("\n--- Price Value Object ---");

// 1. A refinement: the same Money, with one invariant added on top
const listed = Money.create({ amount: "19.99", currency: usd });
const unitPrice = Price.create(listed);
console.log(`Unit price: ${unitPrice}`); // -> 19.99 USD

// 2. Zero is a price; negative is not
console.log(`Free is a price: ${Price.create(Money.zero(usd))}`); // -> 0.00 USD

try {
  Price.create(Money.create({ amount: -1, currency: usd }));
} catch (error) {
  console.log(`Negative price: ${(error as Error).message}`); // -> Invalid price: -1.00 USD cannot be negative
}

// 3. Equality recurses through the composed Money
const sameListed = Money.create({ amount: 19.99, currency: usd });
const samePrice = Price.create(sameListed);
console.log(`unitPrice.equals(samePrice): ${unitPrice.equals(samePrice)}`); // -> true

// 4. But a Price is not the Money it wraps: equals compares constructors first
console.log(`unitPrice.equals(listed): ${unitPrice.equals(listed)}`); // -> false

console.log("\n--- Serialisation ---");

// 1. toString() is for humans, and does not round-trip
console.log(`toString(): ${totalPayout}`); // -> 1250.00 USD

// 2. toJSON() is the wire form: amount at the currency scale, code alone
console.log(`JSON.stringify(): ${JSON.stringify(totalPayout)}`); // -> {"amount":"1250.00","currency":"USD"}

// 3. Nested in a payload it serialises just the same
const order = { total: totalPayout, unitPrice };
console.log(`Nested: ${JSON.stringify(order)}`); // -> {"total":{"amount":"1250.00","currency":"USD"},"unitPrice":{"money":{"amount":"19.99","currency":"USD"}}}

// 4. And the factories read it back into an equal value
type MoneyWire = { amount: string; currency: CurrencyCode };
const wire = JSON.parse(JSON.stringify(totalPayout)) as MoneyWire;
const restored = Money.create({
  amount: wire.amount,
  currency: Currency.fromCode(wire.currency),
});
console.log(`Round-trips back: ${restored.equals(totalPayout)}`); // -> true

console.log("\n--- Equality Edge Cases ---");

// 1. Two different value object types never match
console.log(`emailA.equals(salary): ${emailA.equals(salary)}`); // -> false

// 2. Nor does anything that is not a value object at all
console.log(`emailA.equals(null): ${emailA.equals(null)}`); // -> false
console.log(`emailA.equals(a string): ${emailA.equals(emailA.value)}`); // -> false

// 3. A plain object of the same shape is still not a Money
const lookAlike = { amount: salary.amount, currency: salary.currency };
console.log(`salary.equals(lookAlike): ${salary.equals(lookAlike)}`); // -> false

console.log("\n--- Value Objects as Keys ---");

// 1. Set and Map key by reference, so two equal amounts are stored twice
const seen = new Set([salary, Money.create({ amount: 1000, currency: usd })]);
console.log(`Set size for two equal amounts: ${seen.size}`); // -> 2

// 2. The serialised form is the key that behaves by value
const tenFifty = Money.create({ amount: "10.5", currency: usd });
const sameTenFifty = Money.create({ amount: 10.5, currency: usd });
const byMoney = new Map<string, string>();
byMoney.set(JSON.stringify(tenFifty), "ten fifty");

const key = JSON.stringify(sameTenFifty);
console.log(`Lookup with another instance: ${byMoney.get(key)}`); // -> ten fifty
