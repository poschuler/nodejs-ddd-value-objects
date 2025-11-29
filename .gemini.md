# Project Context: Node.js DDD Value Objects

This project is a TypeScript implementation of the Domain-Driven Design (DDD) Value Object pattern. It provides a set of reusable, immutable value objects and a base class to create new ones. The focus is on ensuring type safety data integrity through validation, and reliable value-based equality.

## 1. Core Concepts & Architecture

### a. The `ValueObject` Abstract Class (`src/domain/abstractions/value-object.abstract.ts`)

- **Purpose**: The cornerstone of the pattern. It provides a generic `equals()` method that compares two value
 objects based on their constituent parts.
- **Key Method**: `getEqualityComponents(): any[]`. Each concrete class must implement this method to return an
 array of its properties that define its identity. The `equals()` method uses this array for comparison.
  
### b. Concrete Value Object Implementations

   The project contains several examples of value objects:

- **`Email` (`src/domain/email.vo.ts`)**: A simple value object representing a validated and normalized email
 address.
- **`Amount` (`src/domain/amount.vo.ts`)**: Represents a monetary value using `BigNumber.js` to avoid floating-poi
 inaccuracies. It enforces non-negativity and provides methods for safe arithmetic (`add`, `times`).
- **`Currency` (`src/domain/currency.vo.ts`)**: A type-safe object representing a currency code (e.g., "USD", "EUR
 based on a predefined list.
- **`Money` (`src/domain/money.vo.ts`)**: A composite value object that combines `Amount` and `Currency`. It
 demonstrates how value objects can be composed and include business logic (e.g., preventing addition of different
 currencies).
  
### c. Project Structure

- `src/app.ts`: A demonstration file to show how to create and compare value objects.
- `src/domain/`: Contains all DDD domain-layer constructs.
  - `abstractions/`: Home to the base `ValueObject` class.
  - `types/`: Contains shared type definitions, like `CurrencyCode`.
  - `*.vo.ts`: Concrete value object implementations.
  
## 2. Key Technologies & Conventions

- **Language**: TypeScript
- **Runtime**: Node.js
- **Package Manager**: pnpm
- **Core Logic**:
  - Immutability is key. Constructors are private, and creation is handled by static `create()` methods.
  - Validation is performed within the `create()` method, throwing an error for invalid data.
  - `BigNumber.js` is used for all monetary calculations to ensure precision.
- **Development Scripts**:
  - `pnpm dev`: Runs the application in watch mode using `tsx`.
  - `pnpm build`: Compiles TypeScript to JavaScript in the `dist` directory.
  - `pnpm start`: Builds and runs the compiled application.

## 3. LLM Collaboration Model

**Directive:** The LLM agent for this project acts as an **architectural consultant and pair programmer**, not as an automated code modifier. The primary goal of the interaction is to discuss architecture, design patterns, and best practices to arrive at a well-reasoned solution, which the user will then implement manually.

**Rules of Engagement:**

- **Source Code Modification:** The LLM **must not** use tools (`write_file`, `replace`) to modify source code files (e.g., `.ts`, `.json`, `.sql`). All suggestions for code changes must be provided as text or code snippets in the chat response.
- **Documentation File Modification:** The LLM **may only** use file modification tools (`write_file`, `replace`) for documentation and context files (e.g., `.gemini.md`, `README.md`), and **only when explicitly instructed** to do so by the user.
- **Shell Commands:** The LLM should avoid running shell commands (`run_shell_command`) unless explicitly asked, especially for commands that modify the file system or git state.
