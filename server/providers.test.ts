import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

const caller = () =>
  appRouter.createCaller({
    user: {
      id: 42,
      openId: "provider-test",
      name: "Provider Test",
      email: null,
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as any,
    res: {} as any,
  });

describe("providers and integrations", () => {
  it("exposes supported providers and integrations without secrets", async () => {
    const catalog = await appRouter
      .createCaller({ user: null, req: {} as any, res: {} as any })
      .providers.catalog();
    expect(catalog.map(provider => provider.id)).toEqual(
      expect.arrayContaining([
        "gemini",
        "openai",
        "anthropic",
        "llama",
        "mistral",
        "openrouter",
        "heygen",
        "synthesia",
        "elevenlabs",
        "custom",
      ])
    );
    const integrations = await appRouter
      .createCaller({ user: null, req: {} as any, res: {} as any })
      .integrations.catalog();
    expect(integrations.map(integration => integration.id)).toEqual(
      expect.arrayContaining([
        "shopify",
        "cjdropshipping",
        "autods",
        "zendrop",
        "takeapp",
        "heygen",
        "synthesia",
        "elevenlabs",
        "lovable",
        "tiktok",
        "instagram",
        "youtube",
        "pinterest",
        "linktree",
        "whatsapp",
        "slack",
        "github",
        "vercel",
        "google-workspace",
        "mcp-custom",
      ])
    );
    expect(integrations.map(integration => integration.id)).not.toContain(
      "google-trends"
    );
    expect(JSON.stringify({ catalog, integrations })).not.toContain(
      "encryptedKey"
    );
  });

  it("returns a safe connection-test result when no credential is connected", async () => {
    const result = await caller().providers.testConnection({
      provider: "openai",
    });
    expect(result).toEqual({
      success: false,
      message: "Connect this provider first.",
    });
  });

  it("saves and removes a user-owned provider without database access", async () => {
    const saved = await caller().providers.save({
      provider: "openai",
      displayName: "OpenAI",
      apiKey: "sk-test-key-987654",
    });
    expect(saved.maskedKey).not.toContain("sk-test-key-987654");
    await expect(
      caller().providers.remove({ provider: "openai" })
    ).resolves.toEqual({ success: true });
  });
});
