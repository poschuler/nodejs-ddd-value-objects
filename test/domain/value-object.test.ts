import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EqualityComponent } from "../../src/domain/value-object.js";
import { ValueObject } from "../../src/domain/value-object.js";

// --- Test doubles: exercise the base contract without coupling to a concrete VO ---

class Point extends ValueObject {
  public readonly x: number;
  public readonly y: number;
  constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
  }
  protected equalityComponents(): readonly EqualityComponent[] {
    return [this.x, this.y];
  }
}

/** Same shape as Point, different class: exercises the class identity guard. */
class Coordinate extends ValueObject {
  public readonly x: number;
  public readonly y: number;
  constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
  }
  protected equalityComponents(): readonly EqualityComponent[] {
    return [this.x, this.y];
  }
}

/** Subclass of Point: class identity is exact, not "is-a". */
class Point3D extends Point {
  public readonly z: number;
  constructor(x: number, y: number, z: number) {
    super(x, y);
    this.z = z;
  }
  protected override equalityComponents(): readonly EqualityComponent[] {
    return [this.x, this.y, this.z];
  }
}

class Timestamped extends ValueObject {
  public readonly at: Date;
  constructor(at: Date) {
    super();
    this.at = at;
  }
  protected equalityComponents(): readonly EqualityComponent[] {
    return [this.at];
  }
}

class Segment extends ValueObject {
  public readonly from: Point;
  public readonly to: Point;
  constructor(from: Point, to: Point) {
    super();
    this.from = from;
    this.to = to;
  }
  protected equalityComponents(): readonly EqualityComponent[] {
    return [this.from, this.to];
  }
}

/** Holds an arbitrary component, for edge cases. */
class Box extends ValueObject {
  public readonly value: EqualityComponent;
  constructor(value: EqualityComponent) {
    super();
    this.value = value;
  }
  protected equalityComponents(): readonly EqualityComponent[] {
    return [this.value];
  }
}

/** Same class, variable component count: the only path to the length guard. */
class Ragged extends ValueObject {
  public readonly parts: readonly EqualityComponent[];
  constructor(...parts: readonly EqualityComponent[]) {
    super();
    this.parts = parts;
  }
  protected equalityComponents(): readonly EqualityComponent[] {
    return this.parts;
  }
}

describe("ValueObject.equals", () => {
  describe("equality laws", () => {
    it("is reflexive", () => {
      const point = new Point(1, 2);
      assert.equal(point.equals(point), true);
    });

    it("is symmetric", () => {
      const a = new Point(1, 2);
      const b = new Point(1, 2);
      assert.equal(a.equals(b), true);
      assert.equal(b.equals(a), true);
    });

    it("is transitive", () => {
      const a = new Point(1, 2);
      const b = new Point(1, 2);
      const c = new Point(1, 2);
      assert.equal(a.equals(b) && b.equals(c), true);
      assert.equal(a.equals(c), true);
    });

    it("tells apart instances with different components", () => {
      assert.equal(new Point(1, 2).equals(new Point(9, 9)), false);
    });
  });

  describe("class identity", () => {
    it("does not equate two different classes with the same components", () => {
      assert.equal(new Point(1, 2).equals(new Coordinate(1, 2)), false);
    });

    it("does not equate an instance with a subclass of itself", () => {
      assert.equal(new Point(1, 2).equals(new Point3D(1, 2, 3)), false);
      assert.equal(new Point3D(1, 2, 3).equals(new Point(1, 2)), false);
    });
  });

  describe("comparison against non ValueObject values", () => {
    it("does not equate null or undefined", () => {
      const point = new Point(1, 2);
      assert.equal(point.equals(null), false);
      assert.equal(point.equals(undefined), false);
    });

    it("does not equate a plain object with the same shape", () => {
      assert.equal(new Point(1, 2).equals({ x: 1, y: 2 }), false);
    });

    it("does not equate a primitive", () => {
      assert.equal(new Point(1, 2).equals("1,2"), false);
    });
  });

  describe("component comparison", () => {
    it("compares components positionally", () => {
      assert.equal(new Point(1, 2).equals(new Point(2, 1)), false);
    });

    it("compares Date by instant, not by reference", () => {
      const instant = "2026-08-23T10:00:00.000Z";
      assert.equal(
        new Timestamped(new Date(instant)).equals(
          new Timestamped(new Date(instant)),
        ),
        true,
      );
      assert.equal(
        new Timestamped(new Date(instant)).equals(new Timestamped(new Date(0))),
        false,
      );
    });

    it("compares nested ValueObjects by value", () => {
      const a = new Segment(new Point(0, 0), new Point(1, 1));
      const b = new Segment(new Point(0, 0), new Point(1, 1));
      const c = new Segment(new Point(0, 0), new Point(9, 9));
      assert.equal(a.equals(b), true);
      assert.equal(a.equals(c), false);
    });

    it("tells null apart from undefined", () => {
      assert.equal(new Box(null).equals(new Box(undefined)), false);
      assert.equal(new Box(null).equals(new Box(null)), true);
    });

    it("does not coerce types between components", () => {
      assert.equal(new Box(0).equals(new Box("0")), false);
      assert.equal(new Box(false).equals(new Box(0)), false);
    });

    it("does not equate instances exposing a different number of components", () => {
      // A component list whose length varies between instances of one class is
      // a design smell, but it is legal. Without the length guard every() would
      // only walk the shorter list, and equals would stop being symmetric.
      const short = new Ragged(1);
      const long = new Ragged(1, 2);

      assert.equal(short.equals(long), false);
      assert.equal(long.equals(short), false);
    });
  });
});
