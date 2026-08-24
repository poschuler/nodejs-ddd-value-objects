import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Email } from "../../src/domain/email.vo";

describe("Email", () => {
  describe("create - normalization", () => {
    it("lowercases the whole address", () => {
      assert.equal(Email.create("USER@Example.COM").value, "user@example.com");
    });

    it("trims surrounding whitespace", () => {
      assert.equal(
        Email.create("  user@example.com  ").value,
        "user@example.com",
      );
    });

    it("keeps an already normalized address untouched", () => {
      assert.equal(Email.create("user@example.com").value, "user@example.com");
    });
  });

  describe("create - validation", () => {
    it("rejects an empty string", () => {
      assert.throws(() => Email.create(""), {
        message: "Email requires a value",
      });
    });

    it("rejects a blank string", () => {
      // Blank collapses to empty once trimmed, so it fails for the same
      // reason as "": there is no value, not a malformed one.
      assert.throws(() => Email.create("   "), {
        message: "Email requires a value",
      });
    });

    it("rejects an address with no local part", () => {
      assert.throws(() => Email.create("@example.com"), {
        message: "Invalid email address",
      });
    });

    it("rejects an address with no domain", () => {
      assert.throws(() => Email.create("user@"), {
        message: "Invalid email address",
      });
    });

    it("rejects a domain with no dot", () => {
      assert.throws(() => Email.create("user@example"), {
        message: "Invalid email address",
      });
    });

    it("rejects a domain whose label before the dot is empty", () => {
      assert.throws(() => Email.create("user@.com"), {
        message: "Invalid email address",
      });
    });

    it("rejects more than one at sign", () => {
      assert.throws(() => Email.create("user@@example.com"), {
        message: "Invalid email address",
      });
    });

    it("rejects inner whitespace", () => {
      assert.throws(() => Email.create("user name@example.com"), {
        message: "Invalid email address",
      });
      assert.throws(() => Email.create("user@exa mple.com"), {
        message: "Invalid email address",
      });
    });
  });

  describe("value semantics", () => {
    it("equates two instances built from equivalent inputs", () => {
      assert.equal(
        Email.create("ADMIN@company.com").equals(
          Email.create("  admin@company.com  "),
        ),
        true,
      );
    });

    it("does not equate different addresses", () => {
      assert.equal(
        Email.create("admin@company.com").equals(
          Email.create("user@company.com"),
        ),
        false,
      );
    });

    it("does not rely on reference identity", () => {
      const a = Email.create("admin@company.com");
      const b = Email.create("admin@company.com");
      assert.notEqual(a, b);
      assert.equal(a.equals(b), true);
    });
  });

  describe("dot placement", () => {
    it("rejects a trailing dot in the domain", () => {
      assert.throws(() => Email.create("user@example.com."));
    });

    it("rejects consecutive dots in the domain", () => {
      assert.throws(() => Email.create("user@example..com"));
    });

    it("rejects a leading dot in the local part", () => {
      assert.throws(() => Email.create(".user@example.com"));
    });
  });
});
