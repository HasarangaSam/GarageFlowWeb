import { describe, expect, it, vi } from "vitest";
import {
  createStaffSchema,
  loginSchema,
  updateStaffSchema,
} from "../src/schemas/auth.schema.js";
import { generateAccessToken, verifyAccessToken } from "../src/utils/auth.js";
import { requireRole } from "../src/middleware/auth.middleware.js";
import { AppError } from "../src/utils/errors.js";
import type { AuthenticatedRequest } from "../src/middleware/auth.middleware.js";

// Fallback secret for isolated test runs
process.env.ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "test-access-token-secret-12345";

describe("loginSchema", () => {
  it("accepts an email address and password", () => {
    expect(
      loginSchema.safeParse({
        email: "manager@garageflow.lk",
        password: "secretPassword",
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid email and an empty password", () => {
    expect(
      loginSchema.safeParse({ email: "not-an-email", password: "" }).success,
    ).toBe(false);
  });
});

describe("staff account validation", () => {
  const newMechanic = {
    name: "Nimal Silva",
    email: "nimal@garageflow.lk",
    password: "temporary-password",
    role: "MECHANIC",
  };

  it("allows an owner to create a manager or mechanic", () => {
    expect(createStaffSchema.safeParse(newMechanic).success).toBe(true);
    expect(
      createStaffSchema.safeParse({ ...newMechanic, role: "MANAGER" }).success,
    ).toBe(true);
  });

  it("never accepts OWNER as a staff-account role", () => {
    expect(
      createStaffSchema.safeParse({ ...newMechanic, role: "OWNER" }).success,
    ).toBe(false);
  });

  it("requires at least one field when editing staff", () => {
    expect(updateStaffSchema.safeParse({}).success).toBe(false);
    expect(updateStaffSchema.safeParse({ name: "Nimal Perera" }).success).toBe(
      true,
    );
  });
});

describe("access tokens", () => {
  it("keeps the signed-in user's id and role", () => {
    const token = generateAccessToken("user-99", "MECHANIC");
    const payload = verifyAccessToken(token);

    expect(payload.userId).toBe("user-99");
    expect(payload.role).toBe("MECHANIC");
  });
});

describe("owner-only access", () => {
  it("allows an owner to use staff management", () => {
    const next = vi.fn();
    const request = { user: { id: "owner-1", role: "OWNER" } } as AuthenticatedRequest;

    requireRole("OWNER")(request, {} as never, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("blocks a manager from using staff management", () => {
    const next = vi.fn();
    const request = { user: { id: "manager-1", role: "MANAGER" } } as AuthenticatedRequest;

    requireRole("OWNER")(request, {} as never, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(403);
  });
});
