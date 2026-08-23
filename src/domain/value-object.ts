export type EqualityComponent =
  | string
  | number
  | boolean
  | Date
  | ValueObject
  | null
  | undefined;

export abstract class ValueObject {
  protected abstract equalityComponents(): readonly EqualityComponent[];

  public equals(other: unknown): boolean {
    if (!(other instanceof ValueObject)) {
      return false;
    }

    if (other.constructor !== this.constructor) {
      return false;
    }

    const left = this.equalityComponents();
    const right = other.equalityComponents();

    if (left.length !== right.length) {
      return false;
    }

    return left.every((value, index) => equalsComponent(value, right[index]));
  }
}

function equalsComponent(
  left: EqualityComponent,
  right: EqualityComponent,
): boolean {
  if (left instanceof ValueObject && right instanceof ValueObject) {
    return left.equals(right);
  }

  if (left instanceof Date && right instanceof Date) {
    return left.getTime() === right.getTime();
  }

  return left === right;
}
