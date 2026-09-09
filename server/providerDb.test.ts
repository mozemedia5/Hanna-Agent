import { describe, expect, it } from "vitest";
import { forceReloadStoreForTest } from "./persistentStore";
import {
  deleteProviderCredential,
  getProviderCredentialById,
  getProviderCredentialForRequest,
  listProviderCredentials,
  upsertProviderCredential,
} from "./providerDb";

describe("providerDb Persistent Store", () => {
  it("saves encrypted provider data and returns masked metadata", async () => {
    const result = await upsertProviderCredential(
      7001,
      "openai",
      "OpenAI",
      "sk-secret-value-1234"
    );
    expect(result.maskedKey).not.toContain("sk-secret-value-1234");
    const saved = await getProviderCredentialById(7001, "openai");
    expect(saved?.apiKey).toBe("sk-secret-value-1234");
    const listed = await listProviderCredentials(7001);
    expect(JSON.stringify(listed)).not.toContain("sk-secret-value-1234");
  });

  it("lists only the current user's masked provider metadata", async () => {
    await upsertProviderCredential(
      7002,
      "gemini",
      "Gemini",
      "AIza-secret-value-1234"
    );
    await upsertProviderCredential(
      7003,
      "openai",
      "OpenAI",
      "sk-other-secret-1234"
    );
    const result = await listProviderCredentials(7002);
    expect(result.some(r => r.provider === "gemini")).toBe(true);
    expect(result.some(r => r.provider === "openai")).toBe(false);
    expect(JSON.stringify(result)).not.toContain("AIza-secret-value-1234");
  });

  it("survives cold start / process reload without losing user credentials", async () => {
    await upsertProviderCredential(
      8001,
      "anthropic",
      "Anthropic",
      "sk-ant-persistent-secret-999"
    );

    // Simulate new serverless execution instance
    forceReloadStoreForTest();

    const retrieved = await getProviderCredentialById(8001, "anthropic");
    expect(retrieved).toBeDefined();
    expect(retrieved?.apiKey).toBe("sk-ant-persistent-secret-999");
  });

  it("routes to custom provider when connected and requested, and falls back to Gemini 3.6 Flash on default", async () => {
    const origKey = process.env.GEMINI_API_KEY;
    try {
      process.env.GEMINI_API_KEY = "AIzaSyServerEnvTestKey";

      await upsertProviderCredential(
        9001,
        "openai",
        "OpenAI",
        "sk-user-openai-key"
      );

      // User requests custom OpenAI model
      const customReq = await getProviderCredentialForRequest(
        9001,
        "Hello",
        "gpt-4o"
      );
      expect(customReq?.provider).toBe("openai");
      expect(customReq?.apiKey).toBe("sk-user-openai-key");
      expect(customReq?.model).toBe("gpt-4o");

      // User switches back to Hanna Default
      const defaultReq = await getProviderCredentialForRequest(
        9001,
        "Hello",
        "Hanna Default"
      );
      expect(defaultReq?.provider).toBe("gemini");
      expect(defaultReq?.apiKey).toBe("AIzaSyServerEnvTestKey");
      expect(defaultReq?.model).toBe("gemini-2.5-flash");
    } finally {
      process.env.GEMINI_API_KEY = origKey;
    }
  });

  it("removes a user provider credential without touching another user", async () => {
    await upsertProviderCredential(
      7004,
      "openai",
      "OpenAI",
      "sk-remove-me-1234"
    );
    await upsertProviderCredential(7005, "openai", "OpenAI", "sk-keep-me-1234");
    await expect(deleteProviderCredential(7004, "openai")).resolves.toEqual({
      success: true,
    });
    await expect(
      getProviderCredentialById(7004, "openai")
    ).resolves.toBeUndefined();
    await expect(
      getProviderCredentialById(7005, "openai")
    ).resolves.toMatchObject({ apiKey: "sk-keep-me-1234" });
  });
});
