import { describe, expect, it } from "vitest";
import {
  deleteProviderCredential,
  getProviderCredentialById,
  getProviderCredentialForRequest,
  listProviderCredentials,
  upsertProviderCredential,
} from "./providerDb";

describe("providerDb Firebase-ready runtime store", () => {
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
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      provider: "gemini",
      displayName: "Gemini",
    });
    expect(JSON.stringify(result)).not.toContain("AIza-secret-value-1234");
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

  it("falls back to process.env.GEMINI_API_KEY when user has no custom provider key", async () => {
    const origKey = process.env.GEMINI_API_KEY;
    try {
      process.env.GEMINI_API_KEY = "AIzaSyServerEnvTestKey";
      const credential = await getProviderCredentialForRequest(7099, "Hello world");
      expect(credential).toBeDefined();
      expect(credential?.provider).toBe("gemini");
      expect(credential?.apiKey).toBe("AIzaSyServerEnvTestKey");
    } finally {
      process.env.GEMINI_API_KEY = origKey;
    }
  });
});
