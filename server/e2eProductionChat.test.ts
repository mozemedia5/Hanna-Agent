import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import type { Server } from "node:http";
import app from "./api";

describe("Production Chat & Vercel API Route Resolution E2E Test", () => {
  let server: Server;
  let baseUrl: string;
  const originalFetch = globalThis.fetch;

  beforeEach(async () => {
    process.env.GEMINI_API_KEY = "test_gemini_prod_key_12345";
    process.env.GEMINI_MODEL = "gemini-3.5-flash";

    await new Promise<void>(resolve => {
      server = app.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        if (typeof addr === "object" && addr) {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterEach(async () => {
    globalThis.fetch = originalFetch;
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  it("resolves /api status endpoint", async () => {
    const res = await fetch(`${baseUrl}/api`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok", service: "hanna-agent-api" });
  });

  it("resolves /api/config endpoint", async () => {
    const res = await fetch(`${baseUrl}/api/config`);
    expect([200, 503]).toContain(res.status);
    const body = await res.json();
    expect(body).toBeDefined();
  });

  it("resolves /api/health endpoint", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect([200, 503]).toContain(res.status);
    const body = await res.json();
    expect(body.status).toBeDefined();
  });

  it("resolves /api/mcp endpoint", async () => {
    const res = await fetch(`${baseUrl}/api/mcp`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("hanna-mcp-server");
    expect(Array.isArray(body.tools)).toBe(true);
  });

  it("executes hanna.ask direct chat request through /api/trpc via Gemini provider path", async () => {
    // Intercept outbound Gemini API call to verify request format & key handling
    globalThis.fetch = vi.fn().mockImplementation(async (url: string | URL | Request, init?: RequestInit) => {
      const urlString = url.toString();
      if (urlString.includes("generativelanguage.googleapis.com")) {
        expect(urlString).toContain("test_gemini_prod_key_12345");
        expect(urlString).toContain("gemini-3.5-flash");

        const reqBody = JSON.parse(init?.body as string);
        expect(reqBody.contents[0].parts[0].text).toContain("What is the capital of France?");

        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: "The capital of France is Paris." }],
                },
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      // Pass through local server requests
      return originalFetch(url, init);
    });

    const res = await fetch(`${baseUrl}/api/trpc/hanna.ask?batch=1`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        "0": {
          json: {
            prompt: "What is the capital of France?",
            model: "Hanna Lite",
            agenticMode: false,
          },
        },
      }),
    });

    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(Array.isArray(payload)).toBe(true);
    expect(payload[0]?.result?.data?.json).toBeDefined();

    const data = payload[0].result.data.json;
    expect(data.text).toBe("The capital of France is Paris.");
    expect(data.model).toBe("gemini · gemini-3.5-flash");
    expect(data.providerError).toBe(false);
  });

  it("handles provider failure gracefully with fallback response without hanging or crashing", async () => {
    globalThis.fetch = vi.fn().mockImplementation(async (url: string | URL | Request, init?: RequestInit) => {
      const urlString = url.toString();
      if (urlString.includes("generativelanguage.googleapis.com")) {
        return new Response(
          JSON.stringify({ error: { message: "Quota exceeded" } }),
          { status: 429, headers: { "content-type": "application/json" } }
        );
      }
      return originalFetch(url, init);
    });

    const res = await fetch(`${baseUrl}/api/trpc/hanna.ask?batch=1`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        "0": {
          json: {
            prompt: "Help me analyze my Shopify store sales.",
            model: "Hanna Lite",
            agenticMode: false,
          },
        },
      }),
    });

    expect(res.status).toBe(200);
    const payload = await res.json();
    const data = payload[0]?.result?.data?.json;
    expect(data).toBeDefined();
    expect(data.providerError).toBe(true);
    expect(data.text).toContain("Shopify");
  });
});
