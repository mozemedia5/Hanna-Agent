import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { performAiHealthCheck } from "./aiHealth";
import * as providerAdapters from "./providerAdapters";

describe("Phase 6 & End-to-End Production Verification", () => {
  it("verifies /api/health returns structured diagnostic status when GEMINI_API_KEY is present or missing", async () => {
    const reportWithoutKey = await performAiHealthCheck();
    expect(reportWithoutKey.provider).toBe("gemini");
    expect(reportWithoutKey.model).toBe("gemini-3.6-flash");

    const origKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "AIzaSyTestKeyForHealthCheck";

    // Mock global fetch for health check ping
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          { content: { parts: [{ text: "Ping health check." }] } },
        ],
      }),
    } as any);

    try {
      const reportWithKey = await performAiHealthCheck();
      expect(reportWithKey.status).toBe("AI_READY");
      expect(reportWithKey.provider).toBe("gemini");
      expect(reportWithKey.model).toBe("gemini-3.6-flash");
      expect(reportWithKey.geminiKeyPresent).toBe(true);
    } finally {
      fetchSpy.mockRestore();
      process.env.GEMINI_API_KEY = origKey;
    }
  });

  it("verifies end-to-end chat flow returns HANNA_OK through executeHannaRequest", async () => {
    const origKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "AIzaSyTestKeyForE2E";

    const spy = vi
      .spyOn(providerAdapters, "invokeUserProvider")
      .mockResolvedValue("HANNA_OK");

    try {
      const caller = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: null,
      });
      const response = await caller.hanna.ask({
        prompt: "Reply with exactly: HANNA_OK",
      });

      expect(response.text).toBe("HANNA_OK");
      expect(response.model).toContain("gemini-3.6-flash");
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: "gemini",
          model: "gemini-3.6-flash",
          apiKey: "AIzaSyTestKeyForE2E",
        })
      );
    } finally {
      spy.mockRestore();
      process.env.GEMINI_API_KEY = origKey;
    }
  });
});
