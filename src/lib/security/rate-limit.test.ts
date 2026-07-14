import { describe, it, expect, beforeEach, vi } from "vitest";
import { rateLimit } from "./rate-limit.server";
import { RateLimitError } from "@/lib/errors";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  it("allows requests under the limit", () => {
    for (let i = 0; i < 5; i++) {
      expect(() => rateLimit({ key: "test-a", max: 5, windowMs: 1000 })).not.toThrow();
    }
  });

  it("throws RateLimitError once the limit is reached", () => {
    for (let i = 0; i < 3; i++) rateLimit({ key: "test-b", max: 3, windowMs: 1000 });
    expect(() => rateLimit({ key: "test-b", max: 3, windowMs: 1000 })).toThrow(
      RateLimitError,
    );
  });

  it("resets the bucket after the window elapses", () => {
    for (let i = 0; i < 2; i++) rateLimit({ key: "test-c", max: 2, windowMs: 1000 });
    expect(() => rateLimit({ key: "test-c", max: 2, windowMs: 1000 })).toThrow();
    vi.advanceTimersByTime(1500);
    expect(() => rateLimit({ key: "test-c", max: 2, windowMs: 1000 })).not.toThrow();
  });

  it("scopes buckets by key", () => {
    for (let i = 0; i < 5; i++) rateLimit({ key: "test-d1", max: 5, windowMs: 1000 });
    expect(() => rateLimit({ key: "test-d1", max: 5, windowMs: 1000 })).toThrow();
    expect(() => rateLimit({ key: "test-d2", max: 5, windowMs: 1000 })).not.toThrow();
  });
});
