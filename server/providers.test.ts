import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { getProviderCredentialForRequest, upsertProviderCredential } from "./providerDb";

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

describe("providers and integrations routing & management", () => {
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
    expect(JSON.stringify({ catalog, integrations })).not.toContain(
      "encryptedKey"
    );
  });

  it("routes default request to Gemini 3.6 Flash when no custom provider selected", async () => {
    const origKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "AIzaSyServerKeyTest";
    try {
      const res = await getProviderCredentialForRequest(42, "How do I optimize store conversion?");
      expect(res?.provider).toBe("gemini");
      expect(res?.model).toBe("gemini-3.6-flash");
      expect(res?.apiKey).toBe("AIzaSyServerKeyTest");
    } finally {
      process.env.GEMINI_API_KEY = origKey;
    }
  });

  it("routes to user OpenAI credential and model when OpenAI selected", async () => {
    await upsertProviderCredential(101, "openai", "OpenAI", "sk-user-openai-key-101");
    const res = await getProviderCredentialForRequest(101, "Analyze products", "OpenAI");
    expect(res?.provider).toBe("openai");
    expect(res?.apiKey).toBe("sk-user-openai-key-101");
    expect(res?.model).toBe("gpt-4o-mini");
  });

  it("routes to user Anthropic credential and model when Anthropic selected", async () => {
    await upsertProviderCredential(102, "anthropic", "Anthropic", "sk-ant-user-key-102");
    const res = await getProviderCredentialForRequest(102, "Debug React code", "Anthropic");
    expect(res?.provider).toBe("anthropic");
    expect(res?.apiKey).toBe("sk-ant-user-key-102");
    expect(res?.model).toBe("claude-3-5-sonnet-20241022");
  });

  it("routes to user Groq credential and model when Llama/Groq selected", async () => {
    await upsertProviderCredential(103, "llama", "Groq", "gsk_user_groq_key_103");
    const res = await getProviderCredentialForRequest(103, "Summarize inventory", "Groq");
    expect(res?.provider).toBe("llama");
    expect(res?.apiKey).toBe("gsk_user_groq_key_103");
    expect(res?.model).toBe("llama-3.3-70b-versatile");
  });

  it("deterministically switches back to Gemini 3.6 Flash when user selects Hanna Default", async () => {
    const origKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "AIzaSyServerKeyTest";
    try {
      await upsertProviderCredential(104, "openai", "OpenAI", "sk-user-key-104");

      // Custom provider
      const customRes = await getProviderCredentialForRequest(104, "Draft email", "gpt-4o");
      expect(customRes?.provider).toBe("openai");

      // Switch back
      const defaultRes = await getProviderCredentialForRequest(104, "Draft email", "Hanna Default");
      expect(defaultRes?.provider).toBe("gemini");
      expect(defaultRes?.model).toBe("gemini-3.6-flash");
      expect(defaultRes?.apiKey).toBe("AIzaSyServerKeyTest");
    } finally {
      process.env.GEMINI_API_KEY = origKey;
    }
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
