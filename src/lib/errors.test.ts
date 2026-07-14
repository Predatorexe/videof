import { describe, it, expect } from "vitest";
import {
  AppError,
  NotFoundError,
  RateLimitError,
  ValidationError,
  toErrorDTO,
} from "./errors";

describe("errors", () => {
  it("wraps known AppError instances", () => {
    expect(toErrorDTO(new NotFoundError("widget"))).toEqual({
      code: "NOT_FOUND",
      status: 404,
      message: "widget not found",
    });
    expect(toErrorDTO(new ValidationError("bad")).status).toBe(400);
    expect(toErrorDTO(new RateLimitError()).status).toBe(429);
  });

  it("wraps plain Errors as 500 INTERNAL_ERROR", () => {
    const dto = toErrorDTO(new Error("boom"));
    expect(dto.status).toBe(500);
    expect(dto.code).toBe("INTERNAL_ERROR");
    expect(dto.message).toBe("boom");
  });

  it("wraps unknown throwables", () => {
    const dto = toErrorDTO("nope");
    expect(dto.status).toBe(500);
    expect(dto.code).toBe("INTERNAL_ERROR");
  });

  it("AppError preserves code/status/details", () => {
    const e = new AppError("x", "X", 418, { hint: "teapot" });
    expect(e.status).toBe(418);
    expect(e.details).toEqual({ hint: "teapot" });
  });
});
