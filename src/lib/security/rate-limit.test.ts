import { describe, it, expect, vi, beforeEach } from "vitest";

const rpcMock = vi.fn();

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { rpc: (...args: unknown[]) => rpcMock(...args) },
}));

import { rateLimit } from "./rate-limit.server";
import { RateLimitError } from "@/lib/errors";

describe("rateLimit (Supabase-backed)", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("allows when the RPC reports allowed=true", async () => {
    rpcMock.mockResolvedValue({
      data: [{ allowed: true, current_count: 1, reset_at: new Date(Date.now() + 1000).toISOString() }],
      error: null,
    });
    const { rateLimit } = await loadModule();
    await expect(rateLimit({ key: "k", max: 5, windowMs: 1000 })).resolves.toBeUndefined();
    expect(rpcMock).toHaveBeenCalledWith("rate_limit_check", {
      _key: "k",
      _max: 5,
      _window_ms: 1000,
    });
  });

  it("throws RateLimitError when the RPC reports allowed=false", async () => {
    rpcMock.mockResolvedValue({
      data: [{ allowed: false, current_count: 6, reset_at: new Date(Date.now() + 2000).toISOString() }],
      error: null,
    });
    const { rateLimit } = await loadModule();
    await expect(rateLimit({ key: "k", max: 5, windowMs: 1000 })).rejects.toBeInstanceOf(RateLimitError);
  });

  it("fails-open by default when the backend errors", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "boom" } });
    const { rateLimit } = await loadModule();
    await expect(rateLimit({ key: "k", max: 5, windowMs: 1000 })).resolves.toBeUndefined();
  });

  it("fails-closed when bypassOnError is false", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "boom" } });
    const { rateLimit } = await loadModule();
    await expect(
      rateLimit({ key: "k", max: 5, windowMs: 1000, bypassOnError: false }),
    ).rejects.toBeInstanceOf(RateLimitError);
  });
});
