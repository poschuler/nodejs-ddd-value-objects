import { type EqualityComponent, ValueObject } from "./value-object";

export class Email extends ValueObject {
  public readonly value: string;

  private constructor(value: string) {
    super();
    this.value = value;
    Object.freeze(this);
  }

  public static create(input: string): Email {
    if (!input) throw new Error("Email requires a value");

    const normalizedEmail = input.trim().toLowerCase();

    if (!Email.isValid(normalizedEmail)) {
      throw new Error("Invalid email address");
    }

    return new Email(normalizedEmail);
  }

  protected equalityComponents(): readonly EqualityComponent[] {
    return [this.value];
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@.]+(?:\.[^\s@.]+)*@[^\s@.]+(?:\.[^\s@.]+)+$/;
    return emailRegex.test(email);
  }
}
