import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn().mockResolvedValue(null) }));

import { appRouter } from "./routers";

const caller = () => appRouter.createCaller({
  user: { id: 42, openId: "provider-test", name: "Provider Test", email: null, loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: {} as any,
  res: {} as any,
});

describe("providers", () => {
  it("exposes the supported provider catalog without secrets", async () => {
    const catalog = await appRouter.createCaller({ user: null, req: {} as any, res: {} as any }).providers.catalog();
    expect(catalog.map(provider => provider.id)).toEqual(expect.arrayContaining(["gemini", "openai", "anthropic", "llama", "cloudinary", "jules", "stitch", "v0", "custom"]));
    expect(JSON.stringify(catalog)).not.toContain("encryptedKey");
  });

  it("returns a safe connection-test result when no credential is connected", async () => {
    const result = await caller().providers.testConnection({ provider: "openai" });
    expect(result).toEqual({ success: false, message: "Connect this provider first." });
  });

  it("fails closed when a credential cannot be persisted without a database", async () => {
    await expect(caller().providers.save({ provider: "openai", displayName: "OpenAI", apiKey: "sk-test-key-123456" })).rejects.toThrow("Database is not available");
    await expect(caller().providers.remove({ provider: "openai" })).rejects.toThrow("Database is not available");
  });
});
