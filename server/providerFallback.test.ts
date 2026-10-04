import { describe, expect, it } from "vitest";
import { classifyProviderError, isFallbackEligible } from "../server/ai/providerFallback";
import { GeminiProviderError } from "../server/geminiService";
import { getCanonicalGoogleRedirectUri, generateOAuthState, verifyOAuthState } from "../server/oauthRoutes";
import { resolveProviderAndModel } from "../server/aiConfig";

describe("Provider Architecture & Fallback Unit Tests", () => {
  it("classifies Gemini quota and rate limit errors correctly as fallback-eligible", () => {
    const quotaErr = new GeminiProviderError({
      model: "gemini-3.5-flash",
      errorCode: "GEMINI_QUOTA_EXCEEDED",
      message: "Resource quota exhausted",
      status: 429,
    });
    const classified = classifyProviderError(quotaErr);
    expect(classified.errorClass).toBe("quota");
    expect(isFallbackEligible(classified.errorClass)).toBe(true);
  });

  it("classifies safety and malformed request errors as non-fallback-eligible", () => {
    const safetyErr = new Error("Safety policy rejection: harmful prompt detected");
    const classified = classifyProviderError(safetyErr);
    expect(classified.errorClass).toBe("safety");
    expect(isFallbackEligible(classified.errorClass)).toBe(false);
  });

  it("resolves Groq models correctly to llama provider with gpt-oss models", () => {
    const resolved120b = resolveProviderAndModel("Hanna Groq GPT-OSS 120B");
    expect(resolved120b.provider).toBe("llama");
    expect(resolved120b.model).toBe("openai/gpt-oss-120b");

    const resolved20b = resolveProviderAndModel("Hanna Groq GPT-OSS 20B");
    expect(resolved20b.provider).toBe("llama");
    expect(resolved20b.model).toBe("openai/gpt-oss-20b");
  });

  it("constructs canonical Google OAuth redirect URI using APP_BASE_URL", () => {
    delete process.env.GOOGLE_REDIRECT_URI;
    process.env.APP_BASE_URL = "https://hanna-agent.vercel.app";
    const uri = getCanonicalGoogleRedirectUri();
    expect(uri).toBe("https://hanna-agent.vercel.app/api/oauth/google/callback");
  });

  it("generates and verifies cryptographically secure OAuth state", () => {
    const state = generateOAuthState("user_test_123");
    const verified = verifyOAuthState(state);
    expect(verified.valid).toBe(true);
    expect(verified.uid).toBe("user_test_123");
  });
});
