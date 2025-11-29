type EqualityComponent = string | number | boolean | ValueObject | Date | null | undefined;

export abstract class ValueObject {

  protected abstract getEqualityComponents(): EqualityComponent[];

  public equals(other: ValueObject): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (other.constructor !== this.constructor) {
      return false;
    }

    const componentsA = this.getEqualityComponents();
    const componentsB = other.getEqualityComponents();

    if (componentsA.length !== componentsB.length) {
      return false;
    }

    return componentsA.every((component, index) => {
      const otherComponent = componentsB[index];

      if (component === null || component === undefined || otherComponent === null || otherComponent === undefined) {
        return component === otherComponent;
      }

      if (component instanceof ValueObject && otherComponent instanceof ValueObject) {
        return component.equals(otherComponent);
      }

      if (component instanceof Date && otherComponent instanceof Date) {
        return component.getTime() === otherComponent.getTime();
      }

      return component === otherComponent;
    });
  }
}