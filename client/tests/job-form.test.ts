import { describe, expect, it } from "vitest";
import {
  jobFormSchema,
  mechanicJobUpdateSchema,
} from "../src/schemas/jobFormSchema";
import { resolveJobMileageIn } from "../src/utils/jobMileage";

const validJob = {
  customerId: "c0a80123-4567-4abc-8def-0123456789ab",
  vehicleId: "d0a80123-4567-4abc-8def-0123456789ab",
  mechanicId: "e0a80123-4567-4abc-8def-0123456789ab",
  complaint: "Engine makes a knocking noise",
  diagnosis: "Inspect the crankshaft bearings",
  status: "IN_PROGRESS" as const,
  priority: "HIGH" as const,
  mileageIn: 45000,
  mileageOut: 45100,
  notes: "Customer requested an estimate first",
};

describe("jobFormSchema", () => {
  it("accepts a complete repair job", () => {
    expect(jobFormSchema.safeParse(validJob).success).toBe(true);
  });

  it("requires valid customer and vehicle identifiers", () => {
    const result = jobFormSchema.safeParse({
      ...validJob,
      customerId: "customer-1",
      vehicleId: "vehicle-1",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(["customerId", "vehicleId"]),
      );
    }
  });

  it("rejects a mileage-out value below the mileage-in value", () => {
    const result = jobFormSchema.safeParse({ ...validJob, mileageOut: 44999 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["mileageOut"],
          message: "Mileage out cannot be lower than mileage in",
        }),
      );
    }
  });

  it("rejects a negative mileage value", () => {
    expect(
      jobFormSchema.safeParse({ ...validJob, mileageIn: -1 }).success,
    ).toBe(false);
  });
});

describe("resolveJobMileageIn", () => {
  it("uses the selected vehicle mileage as the default mileage in", () => {
    expect(resolveJobMileageIn(45200, undefined)).toBe(45200);
  });

  it("keeps the current mileage in value when the selected vehicle has no recorded mileage", () => {
    expect(resolveJobMileageIn(null, 45000)).toBe(45000);
  });
});

describe("mechanicJobUpdateSchema", () => {
  it("allows a mechanic to submit only fields they may change", () => {
    expect(
      mechanicJobUpdateSchema.safeParse({
        status: "COMPLETED",
        mileageOut: 45100,
      }).success,
    ).toBe(true);
  });

  it("rejects unknown job status values", () => {
    expect(
      mechanicJobUpdateSchema.safeParse({ status: "CANCELLED" }).success,
    ).toBe(false);
  });
});
