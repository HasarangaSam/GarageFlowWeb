import { describe, expect, it } from "vitest";
import { formatNotificationMessage } from "../src/utils/notificationMessage";

describe("formatNotificationMessage", () => {
  it("removes a legacy invoice UUID from notification copy", () => {
    expect(
      formatNotificationMessage(
        "Payment received for invoice 123e4567-e89b-12d3-a456-426614174000",
      ),
    ).toBe("Payment received for invoice");
  });

  it("preserves text when no invoice UUID is present", () => {
    expect(formatNotificationMessage("A repair job is ready for pickup")).toBe(
      "A repair job is ready for pickup",
    );
  });

  it("only removes UUIDs that directly follow the word invoice", () => {
    expect(
      formatNotificationMessage("Customer 123e4567-e89b-12d3-a456-426614174000 paid"),
    ).toBe("Customer 123e4567-e89b-12d3-a456-426614174000 paid");
  });
});
