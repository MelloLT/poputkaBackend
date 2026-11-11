import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import {
  generateToken,
  verifyToken,
  signResetToken,
  verifyResetToken,
  passwordFingerprint,
} from "../src/utils/token";

describe("auth token", () => {
  it("round-trips userId and role", () => {
    const t = verifyToken(generateToken("u1", "driver"));
    expect(t.userId).toBe("u1");
    expect(t.userRole).toBe("driver");
  });

  it("rejects a token signed with another secret", () => {
    const forged = jwt.sign({ userId: "u1", userRole: "admin" }, "wrong-secret-wrong-secret");
    expect(() => verifyToken(forged)).toThrow();
  });
});

describe("reset token", () => {
  it("round-trips phone and password fingerprint", () => {
    const t = verifyResetToken(signResetToken("+998901234567", "$2b$12$oldhash"));
    expect(t.phone).toBe("+998901234567");
    expect(t.pwv).toBe(passwordFingerprint("$2b$12$oldhash"));
  });

  it("fingerprint changes when password changes (token becomes single-use)", () => {
    expect(passwordFingerprint("$2b$12$oldhash")).not.toBe(passwordFingerprint("$2b$12$newhash"));
  });

  it("rejects a regular auth token used as reset token", () => {
    expect(() => verifyResetToken(generateToken("u1", "passenger"))).toThrow();
  });
});
