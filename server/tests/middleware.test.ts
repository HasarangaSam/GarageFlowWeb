import { describe, expect, it, vi } from "vitest";
import { errorMiddleware } from "../src/middleware/error.middleware.js";
import { asyncHandler } from "../src/utils/async-handler.js";
import { AppError } from "../src/utils/errors.js";

const createResponse = () => {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
};

describe("errorMiddleware", () => {
  it("returns the status and message of an expected application error", () => {
    const response = createResponse();

    errorMiddleware(new AppError("Customer not found", 404), {} as never, response as never, vi.fn());

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({ success: false, message: "Customer not found" });
  });

  it("hides unexpected error details behind a 500 response", () => {
    const response = createResponse();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    errorMiddleware(new Error("database password leaked"), {} as never, response as never, vi.fn());

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({ success: false, message: "Internal server error" });
    errorSpy.mockRestore();
  });
});

describe("asyncHandler", () => {
  it("passes rejected async handler errors to Express", async () => {
    const failure = new Error("Async failure");
    const next = vi.fn();
    const handler = asyncHandler(async () => {
      throw failure;
    });

    handler({} as never, {} as never, next);
    await vi.waitFor(() => expect(next).toHaveBeenCalledWith(failure));
  });

  it("does not call next when an async handler resolves", async () => {
    const next = vi.fn();
    const handler = asyncHandler(async () => undefined);

    handler({} as never, {} as never, next);
    await Promise.resolve();

    expect(next).not.toHaveBeenCalled();
  });
});
