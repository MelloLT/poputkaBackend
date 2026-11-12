import { describe, expect, it } from "vitest";
import { validateRegistration, passwordProblem, ageOn } from "../src/utils/userValidation";
import { validateTripInput, PRICE_MAX } from "../src/utils/tripValidation";

const NOW = new Date("2026-11-12T12:00:00Z");
const valid = {
  firstName: "Abdulxamid",
  lastName: "Sultonov",
  username: "abdul_95",
  email: "abdul@gmail.com",
  phone: "+998 90 123 45 67",
  password: "Qatest123",
  role: "passenger",
  gender: "male",
  birthDate: "1995-05-05",
};
const codes = (errs: { field: string; code: string }[]) => errs.map((e) => `${e.field}:${e.code}`);

describe("registration validation", () => {
  it("accepts a valid user", () => {
    expect(validateRegistration(valid, { now: NOW })).toEqual([]);
  });

  it("rejects role=admin (privilege escalation)", () => {
    expect(codes(validateRegistration({ ...valid, role: "admin" }, { now: NOW }))).toContain("role:INVALID_ROLE");
  });

  it("rejects birth year 1774 and missing/invalid dates", () => {
    expect(codes(validateRegistration({ ...valid, birthDate: "1774-11-02" }, { now: NOW }))).toContain("birthDate:AGE_TOO_OLD");
    expect(codes(validateRegistration({ ...valid, birthDate: undefined }, { now: NOW }))).toContain("birthDate:FIELD_REQUIRED");
    expect(codes(validateRegistration({ ...valid, birthDate: "2001-02-30" }, { now: NOW }))).toContain("birthDate:BIRTH_DATE_INVALID");
    expect(codes(validateRegistration({ ...valid, birthDate: "2012-01-01" }, { now: NOW }))).toContain("birthDate:AGE_REQUIRED_MIN_18");
  });

  it("returns all problems at once", () => {
    const errs = validateRegistration({ ...valid, username: " ", gender: "robot", email: "x", password: "123" }, { now: NOW });
    expect(codes(errs)).toEqual(
      expect.arrayContaining(["username:FIELD_REQUIRED", "gender:INVALID_GENDER", "email:INVALID_EMAIL_FORMAT", "password:INVALID_PASSWORD_FORMAT"]),
    );
  });

  it("explains exactly what is wrong with the password", () => {
    expect(passwordProblem("Abc12")).toBe("PASSWORD_TOO_SHORT");
    expect(passwordProblem("12345678")).toBe("PASSWORD_NEEDS_LETTER");
    expect(passwordProblem("Asastyle")).toBe("PASSWORD_NEEDS_DIGIT");
    expect(passwordProblem("Пароль123")).toBe("PASSWORD_INVALID_CHARS");
    expect(passwordProblem("Qatest123")).toBeNull();
  });

  it("allows Uzbek names with apostrophes", () => {
    expect(validateRegistration({ ...valid, firstName: "G‘ulom", lastName: "O'tkirov" }, { now: NOW })).toEqual([]);
  });

  it("check-register mode does not require role/gender", () => {
    const { role, gender, ...rest } = valid;
    expect(validateRegistration(rest, { requireRoleGender: false, now: NOW })).toEqual([]);
  });

  it("computes age correctly around birthdays", () => {
    expect(ageOn("2008-11-12", NOW)).toBe(18);
    expect(ageOn("2008-11-13", NOW)).toBe(17);
  });
});

describe("trip validation", () => {
  const future = new Date(Date.now() + 86_400_000).toISOString();
  const trip = {
    from: { cityKey: "toshkent", address: "Chilonzor" },
    to: { cityKey: "samarqand", address: "Registon" },
    departureAt: future,
    price: 120000,
    availableSeats: 3,
  };

  it("accepts a valid trip", () => {
    expect(validateTripInput(trip)).toEqual([]);
  });

  it("rejects absurd, tiny and negative prices", () => {
    for (const price of [10_000_000_000_000, 1, -5, "abc"]) {
      expect(validateTripInput({ ...trip, price }).map((e) => e.field)).toContain("price");
    }
    expect(validateTripInput({ ...trip, price: PRICE_MAX })).toEqual([]);
  });

  it("rejects bad seats, same city and past dates", () => {
    expect(codes(validateTripInput({ ...trip, availableSeats: 9 }))).toContain("availableSeats:SEATS_OUT_OF_RANGE");
    expect(codes(validateTripInput({ ...trip, to: trip.from }))).toContain("to:SAME_CITY");
    expect(codes(validateTripInput({ ...trip, departureAt: "2020-01-01T00:00:00Z" }))).toContain(
      "departureAt:TRIP_DATETIME_FUTURE_REQUIRED",
    );
  });

  it("partial mode checks only provided fields", () => {
    expect(validateTripInput({ price: 90000 }, { partial: true })).toEqual([]);
    expect(codes(validateTripInput({ price: 0 }, { partial: true }))).toContain("price:PRICE_OUT_OF_RANGE");
  });
});
