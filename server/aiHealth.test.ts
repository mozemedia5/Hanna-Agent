import { describe, expect, it, vi } from "vitest";
import { performAiHealthCheck } from "./aiHealth";

describe("performAiHealthCheck", () => {
  it("returns GEMINI_KEY_MISSING when GEMINI_API_KEY is not set", async () => {
    const origKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      const report = await performAiHealthCheck();
      expect(report.status).toBe("GEMINI_KEY_MISSING");
      expect(report.geminiKeyPresent).toBe(false);
      expect(report.provider).toBe("gemini");
      expect(report.model).toBe("gemini-2.5-flash");
    } finally {
      process.env.GEMINI_API_KEY = origKey;
    }
  });

  it("returns AI_READY when Gemini API responds successfully", async () => {
    const origKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "AIzaSyTestKey123456";

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: "Pong" }] } }],
      }),
    });

    try {
      const report = await performAiHealthCheck();
      expect(report.status).toBe("AI_READY");
      expect(report.geminiKeyPresent).toBe(true);
      expect(report.model).toBe("gemini-2.5-flash");
    } finally {
      process.env.GEMINI_API_KEY = origKey;
      global.fetch = originalFetch;
    }
  });

  it("returns GEMINI_AUTH_FAILED when Gemini returns status 401 or 403", async () => {
    const origKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "AIzaSyInvalidKey";

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "API key not valid",
    });

    try {
      const report = await performAiHealthCheck();
      expect(report.status).toBe("GEMINI_AUTH_FAILED");
    } finally {
      process.env.GEMINI_API_KEY = origKey;
      global.fetch = originalFetch;
    }
  });
});
