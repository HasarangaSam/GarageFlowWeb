import { describe, expect, it } from "vitest";
import { customerFormSchema } from "../src/schemas/customerSchema";

const validCustomer = {
  firstName: "Kamal",
  lastName: "Perera",
  phone: "0771234567",
  email: "kamal@example.com",
  address: "Colombo",
  notes: "Regular maintenance customer",
};

describe("customerFormSchema", () => {
  it("accepts a customer with the required contact details", () => {
    expect(customerFormSchema.safeParse(validCustomer).success).toBe(true);
  });

  it("allows email to be left blank", () => {
    const result = customerFormSchema.safeParse({
      ...validCustomer,
      email: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a short phone number before the form is submitted", () => {
    const result = customerFormSchema.safeParse({
      ...validCustomer,
      phone: "123",
    });

    expect(result.success).toBe(false);
  });
});
