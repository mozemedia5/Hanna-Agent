import { afterEach, describe, expect, it, vi } from "vitest";
import { invokeUserProvider } from "./providerAdapters";

afterEach(() => vi.unstubAllGlobals());

describe("invokeUserProvider", () => {
  it("calls OpenAI-compatible providers from the server", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "server response" } }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await invokeUserProvider({
      provider: "openai",
      apiKey: "sk-test-key",
      model: "gpt-5-mini",
      prompt: "Say hello",
    });
    expect(result).toBe("server response");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("surfaces provider failures for the safe Hanna fallback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401 })
    );
    await expect(
      invokeUserProvider({
        provider: "anthropic",
        apiKey: "bad-key",
        model: "claude-sonnet-4-6",
        prompt: "Hello",
      })
    ).rejects.toThrow("Anthropic provider returned 401");
  });
});
