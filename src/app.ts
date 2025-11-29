import { Currency } from "./domain/currency.vo";
import { Email } from "./domain/email.vo";
import { Money } from "./domain/money.vo";

console.log("--- Email Value Object ---");

// 1. Creating two different instances in memory
const emailA = Email.create("ADMIN@company.com");
const emailB = Email.create("admin@company.com");

// 2. Comparing memory references (should be false)2. Comparing memory references
console.log(`emailA === emailB: ${emailA === emailB}`); // -> false

// 3. Comparing by Value (should be true)
console.log(`emailA.equals(emailB): ${emailA.equals(emailB)}`); // -> true

// 4. A case of inequality
const emailC = Email.create("anotherAdmin@company.com");
console.log(`emailA.equals(emailC): ${emailA.equals(emailC)}`); // -> false

console.log("\n--- Money Value Object ---");

// 1. Setup currencies
const usd = Currency.fromCode("USD");
const eur = Currency.fromCode("EUR");

// 2. Create Money instances
const salary = Money.create({ amount: 1000, currency: usd });
const bonus = Money.create({ amount: 250, currency: usd });
const salaryInEUR = Money.create({ amount: 1000, currency: eur });

// 3. Demonstrate Equality
const sameSalary = Money.create({ amount: 1000, currency: usd });
console.log(`salary.equals(sameSalary): ${salary.equals(sameSalary)}`); // -> true
console.log(`salary.equals(bonus): ${salary.equals(bonus)}`); // -> false
console.log(`salary.equals(salaryInEUR): ${salary.equals(salaryInEUR)}`); // -> false

// 4. Perform operations
const totalPayout = salary.add(bonus);
console.log(`Total Payout (USD): ${totalPayout.amount.toNumber()}`); // -> 1250

// 5. Demonstrate immutability
console.log(`Original salary amount: ${salary.amount.toNumber()}`); // -> 1000 (unchanged)

// 6. Handle different currencies
try {
    salary.add(salaryInEUR);
} catch (error) {
    console.log(`Error adding different currencies: ${(error as Error).message}`);
}

// 7. Using the Zero factory
const zeroUSD = Money.zero({ currency: usd });
console.log(`Is zero? ${zeroUSD.isZero()}`); // -> true
console.log(`Is zero in USD? ${zeroUSD.isZeroInCurrency({ currency: usd })}`); // -> true
console.log(`Is zero in EUR? ${zeroUSD.isZeroInCurrency({ currency: eur })}`); // -> false