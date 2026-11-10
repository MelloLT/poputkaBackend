import { describe, expect, it, vi } from "vitest";
import { requireInternalSecret } from "../src/middleware/internalAuth";

const run = (header?: string) => {
  const req: any = { header: () => header, ip: "127.0.0.1", path: "/cb" };
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  const next = vi.fn();
  requireInternalSecret(req, res, next);
  return { res, next };
};

describe("requireInternalSecret", () => {
  it("passes with correct secret", () => {
    expect(run("internal-secret-1234567890").next).toHaveBeenCalled();
  });
  it("blocks missing secret", () => {
    const { next, res } = run(undefined);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
  it("blocks wrong secret", () => {
    expect(run("nope").next).not.toHaveBeenCalled();
  });
});
