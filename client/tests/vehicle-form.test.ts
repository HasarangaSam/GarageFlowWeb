import { describe, expect, it } from "vitest";
import { vehicleFormSchema } from "../src/schemas/vehicleFormSchema";

const validVehicle = {
  customerId: "c0a80123-4567-4abc-8def-0123456789ab",
  registrationNumber: "CAB-1234",
  make: "Toyota",
  model: "Prius",
  year: 2020,
  mileage: 65000,
};

describe("vehicleFormSchema", () => {
  it("accepts a vehicle with optional year and mileage", () => {
    expect(vehicleFormSchema.safeParse(validVehicle).success).toBe(true);
  });

  it("accepts a vehicle when optional fields are omitted", () => {
    const requiredVehicle = {
      customerId: validVehicle.customerId,
      registrationNumber: validVehicle.registrationNumber,
      make: validVehicle.make,
      model: validVehicle.model,
    };
    expect(vehicleFormSchema.safeParse(requiredVehicle).success).toBe(true);
  });

  it("rejects an invalid customer id and invalid numeric values", () => {
    const result = vehicleFormSchema.safeParse({
      ...validVehicle,
      customerId: "not-a-uuid",
      year: 1899,
      mileage: -1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-integer mileage", () => {
    expect(vehicleFormSchema.safeParse({ ...validVehicle, mileage: 12.5 }).success).toBe(false);
  });
});
