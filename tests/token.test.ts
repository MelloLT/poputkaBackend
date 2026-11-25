import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import {
  generateToken,
  verifyToken,
  signResetToken,
  verifyResetToken,
  passwordFingerprint,
  signPhoneToken,
  isPhoneTokenValid,
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

describe("phone confirmation token", () => {
  it("is valid only for the same purpose and phone (any formatting)", () => {
    const t = signPhoneToken("register", "+998 90 123-45-67");
    expect(isPhoneTokenValid(t, "register", "998901234567")).toBe(true);
    expect(isPhoneTokenValid(t, "register", "+998901234568")).toBe(false);
    expect(isPhoneTokenValid(t, "change_phone", "998901234567")).toBe(false);
  });

  it("rejects missing, garbage and forged tokens", () => {
    expect(isPhoneTokenValid(undefined, "register", "998901234567")).toBe(false);
    expect(isPhoneTokenValid("abc", "register", "998901234567")).toBe(false);
    const forged = jwt.sign({ purpose: "phone-register", phone: "998901234567" }, "wrong-secret-wrong-secret");
    expect(isPhoneTokenValid(forged, "register", "998901234567")).toBe(false);
  });
});
