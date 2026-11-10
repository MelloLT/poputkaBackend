import { describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app";
import { generateToken } from "../src/utils/token";

// Эти проверки срабатывают до обращения к БД, поэтому Postgres для тестов не нужен.
const app = createApp();

describe("app basics", () => {
  it("GET /health", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("OK");
  });

  it("unknown route -> JSON 404", async () => {
    const res = await request(app).get("/definitely-not-here");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "NOT_FOUND" });
  });

  it("sets security headers (helmet) and hides x-powered-by", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("CORS", () => {
  it("allows the production frontend", async () => {
    const res = await request(app).get("/health").set("Origin", "https://pop-utka.uz");
    expect(res.headers["access-control-allow-origin"]).toBe("https://pop-utka.uz");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("does not allow a foreign origin", async () => {
    const res = await request(app).get("/health").set("Origin", "https://evil.example");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("auth guard", () => {
  it("rejects requests without token", async () => {
    const res = await request(app).get("/chats");
    expect(res.status).toBe(401);
  });

  it("rejects a forged token", async () => {
    const forged = jwt.sign({ userId: "u1", userRole: "admin" }, "attacker-secret-attacker-secret");
    const res = await request(app).get("/chats").set("Authorization", `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });
});

describe("payment callback", () => {
  it("is closed without internal secret", async () => {
    const res = await request(app).post("/api/payment/callback").send({ status: "paid" });
    expect(res.status).toBe(403);
  });

  it("is closed with a wrong secret", async () => {
    const res = await request(app)
      .post("/api/payment/callback")
      .set("x-internal-secret", "wrong")
      .send({ status: "paid" });
    expect(res.status).toBe(403);
  });
});

describe("password reset", () => {
  it("no longer accepts a bare phone number", async () => {
    const res = await request(app)
      .post("/pass/reset")
      .send({ phone: "+998901234567", newPassword: "newpass123" });
    expect(res.status).toBe(400);
  });

  it("rejects a garbage reset token", async () => {
    const res = await request(app)
      .post("/pass/reset")
      .send({ resetToken: "not-a-real-token-at-all", newPassword: "newpass123" });
    expect(res.status).toBe(401);
  });

  it("rejects a normal login token used as reset token", async () => {
    const res = await request(app)
      .post("/pass/reset")
      .send({ resetToken: generateToken("u1", "passenger"), newPassword: "newpass123" });
    expect(res.status).toBe(401);
  });

  it("rejects a weak password", async () => {
    const res = await request(app)
      .post("/pass/reset")
      .send({ resetToken: "x".repeat(40), newPassword: "123" });
    expect(res.status).toBe(400);
  });
});

describe("OTP validation", () => {
  it("rejects an invalid phone", async () => {
    const res = await request(app).post("/otp").send({ phone: "abc", type: "register" });
    expect(res.status).toBe(400);
  });

  it("rejects an unknown OTP type", async () => {
    const res = await request(app).post("/otp").send({ phone: "+998901234567", type: "hack" });
    expect(res.status).toBe(400);
  });

  it("rejects a malformed code on verify", async () => {
    const res = await request(app)
      .post("/otp/verify")
      .send({ phone: "+998901234567", type: "register", inputCode: "12" });
    expect(res.status).toBe(400);
  });
});

describe("admin reports", () => {
  it("users export requires login", async () => {
    const res = await request(app).get("/admin/export/users.xlsx");
    expect(res.status).toBe(401);
  });

  it("growth stats require login", async () => {
    const res = await request(app).get("/admin/stats/growth");
    expect(res.status).toBe(401);
  });
});
