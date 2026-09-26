import { describe, expect, it } from "vitest";
import { createInvoiceSchema } from "../src/schemas/invoice.schema.js";
import { adjustStockSchema, createPartSchema } from "../src/schemas/part.schema.js";
import { createPaymentSchema } from "../src/schemas/payment.schema.js";
import { createVehicleSchema, updateVehicleSchema } from "../src/schemas/vehicle.schema.js";

const id = "c0a80123-4567-4abc-8def-0123456789ab";

describe("inventory schemas", () => {
  it("applies stock defaults when creating a part", () => {
    const result = createPartSchema.parse({
      sku: "OIL-5W30",
      name: "Synthetic engine oil",
      costPrice: 3500,
      sellingPrice: 4500,
    });

    expect(result).toMatchObject({ quantity: 0, minimumStock: 5 });
  });

  it("rejects a zero stock adjustment", () => {
    expect(adjustStockSchema.safeParse({ type: "ADJUSTMENT", quantity: 0 }).success).toBe(false);
  });

  it("accepts both additions and deductions in an adjustment", () => {
    expect(adjustStockSchema.safeParse({ type: "PURCHASE", quantity: 4 }).success).toBe(true);
    expect(adjustStockSchema.safeParse({ type: "DAMAGE", quantity: -2 }).success).toBe(true);
  });
});

describe("billing schemas", () => {
  it("supplies empty invoice items and zero totals by default", () => {
    const result = createInvoiceSchema.parse({ repairJobId: id });

    expect(result).toMatchObject({ labourItems: [], discount: 0, tax: 0 });
  });

  it("rejects invalid invoice items and negative discounts", () => {
    expect(
      createInvoiceSchema.safeParse({
        repairJobId: id,
        discount: -1,
        labourItems: [{ description: "x", quantity: 0, unitPrice: -10 }],
      }).success,
    ).toBe(false);
  });

  it("requires a positive payment amount and supported method", () => {
    expect(createPaymentSchema.safeParse({ amount: 1250, method: "CARD" }).success).toBe(true);
    expect(createPaymentSchema.safeParse({ amount: 0, method: "CHEQUE" }).success).toBe(false);
  });
});

describe("vehicle schemas", () => {
  const vehicle = {
    customerId: id,
    registrationNumber: "CAB-1234",
    make: "Toyota",
    model: "Aqua",
  };

  it("requires a valid customer id when creating a vehicle", () => {
    expect(createVehicleSchema.safeParse({ ...vehicle, customerId: "123" }).success).toBe(false);
  });

  it("does not let vehicle updates change ownership", () => {
    const result = updateVehicleSchema.parse({ customerId: id, mileage: 75000 });

    expect(result).toEqual({ mileage: 75000 });
  });
});
