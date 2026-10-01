import { describe, expect, it, vi } from "vitest";
import {
  generateGeminiContent,
  GeminiProviderError,
  getEffectiveGeminiModel,
  invokeGeminiToolTurn,
  sanitizeErrorText,
  streamGeminiContent,
} from "./geminiService";

describe("Gemini Service Canonical Provider Unit Tests", () => {
  it("resolves model safely defaulting to gemini-3.5-flash", () => {
    expect(getEffectiveGeminiModel()).toBe("gemini-3.5-flash");
    expect(getEffectiveGeminiModel("Hanna Lite")).toBe("gemini-3.5-flash");
    expect(getEffectiveGeminiModel("Hanna Pro")).toBe("gemini-3.5-flash");
    expect(getEffectiveGeminiModel("gemini-3.5-flash")).toBe("gemini-3.5-flash");
  });

  it("sanitizes raw API keys in error outputs", () => {
    const text = "Error with key AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6 or key=AIzaSySecretKey";
    const clean = sanitizeErrorText(text);
    expect(clean).not.toContain("AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6");
    expect(clean).not.toContain("AIzaSySecretKey");
    expect(clean).toContain("AIzaSy••••••••");
  });

  it("parses valid generateContent response correctly", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: { parts: [{ text: "Canonical Gemini Response" }] },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      const result = await generateGeminiContent({
        apiKey: "AIzaSyMockKeyForTest",
        prompt: "Hello Gemini",
      });

      expect(result.text).toBe("Canonical Gemini Response");
      expect(result.provider).toBe("gemini");
      expect(result.model).toBe("gemini-3.5-flash");
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("handles 503 retry backoff and throws structured GeminiProviderError", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Service Unavailable" } }), {
        status: 503,
        headers: { "content-type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      await expect(
        generateGeminiContent({
          apiKey: "AIzaSyMockKeyForTest",
          prompt: "Test 503",
        })
      ).rejects.toThrow(GeminiProviderError);

      expect(fetchMock).toHaveBeenCalledTimes(3);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("parses stream SSE chunks accurately", async () => {
    const sseBody = `data: {"candidates":[{"content":{"parts":[{"text":"Chunk 1 "}]}}]}\n\ndata: {"candidates":[{"content":{"parts":[{"text":"Chunk 2"}]}}]}\n\n`;
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(sseBody, {
        status: 200,
        headers: { "content-type": "text/event-stream" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const receivedChunks: string[] = [];

    try {
      const result = await streamGeminiContent(
        {
          apiKey: "AIzaSyMockKeyForTest",
          prompt: "Stream test",
        },
        chunk => {
          receivedChunks.push(chunk);
        }
      );

      expect(receivedChunks).toEqual(["Chunk 1 ", "Chunk 2"]);
      expect(result.text).toBe("Chunk 1 Chunk 2");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("executes tool turn returning function calls", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    functionCall: {
                      name: "connector_shopify_list_products",
                      args: { first: 5 },
                    },
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      const result = await invokeGeminiToolTurn({
        apiKey: "AIzaSyMockKeyForTest",
        prompt: "List my products",
        tools: [
          {
            name: "connector_shopify_list_products",
            description: "List products",
            parameters: { type: "object", properties: {} },
          },
        ],
      });

      expect(result.functionCall).toBeDefined();
      expect(result.functionCall?.name).toBe("connector_shopify_list_products");
      expect(result.functionCall?.args).toEqual({ first: 5 });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

// Opt-in Real Production Gemini Smoke Test
// Executes only when process.env.GEMINI_API_KEY is defined and not a test placeholder.
const liveApiKey = process.env.GEMINI_API_KEY;
const isRealApiKeyPresent =
  liveApiKey &&
  liveApiKey.trim().length > 10 &&
  !liveApiKey.includes("mock") &&
  !liveApiKey.includes("test");

describe.runIf(isRealApiKeyPresent)("Opt-In Live Production Gemini Integration Smoke Test", () => {
  it("connects directly to live Google Gemini API and returns real text", async () => {
    const res = await generateGeminiContent({
      apiKey: liveApiKey,
      prompt: "Reply with the single word: OK",
    });

    expect(res.text).toBeDefined();
    expect(res.text.length).toBeGreaterThan(0);
    expect(res.provider).toBe("gemini");
    expect(res.model).toBe("gemini-3.5-flash");
  });
});
