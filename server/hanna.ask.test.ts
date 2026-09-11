import { beforeEach, describe, expect, it, vi } from "vitest";

const { invokeUserProvider } = vi.hoisted(() => ({
  invokeUserProvider: vi.fn(),
}));
vi.mock("./providerAdapters", () => ({ invokeUserProvider }));

import { appRouter, executeHannaRequest } from "./routers";
import { upsertProviderCredential } from "./providerDb";

const caller = (user: any = null) =>
  appRouter.createCaller({ req: {} as any, res: {} as any, user });
const user = {
  id: 9100,
  openId: "provider-test",
  name: "Provider Test",
  email: null,
  loginMethod: "test",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("hanna.ask", () => {
  beforeEach(() => invokeUserProvider.mockReset());

  it("returns a routed user-provider response when custom provider model is selected", async () => {
    invokeUserProvider.mockResolvedValue(
      "## Done\n\nI found three useful themes."
    );
    await upsertProviderCredential(
      user.id,
      "openai",
      "OpenAI",
      "sk-test-key-9100"
    );
    const result = await caller(user).hanna.ask({
      prompt: "Research the key themes",
      model: "openai",
    });
    expect(result.text).toContain("three useful themes");
    expect(result.model).toContain("openai");
    expect(result.plan.trace).toBeUndefined();
  });

  it("routes to Hanna Default Gemini 2.5 Flash when default model is selected", async () => {
    const origKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "AIzaSyServerEnvTestKey";
    invokeUserProvider.mockResolvedValue("Gemini response");

    try {
      const result = await caller(user).hanna.ask({
        prompt: "Hello Hanna",
        model: "Hanna Default",
      });
      expect(result.text).toBe("Gemini response");
      expect(result.model).toContain("gemini");
      expect(result.model).toContain("gemini-2.5-flash");
    } finally {
      process.env.GEMINI_API_KEY = origKey;
    }
  });

  it("returns a safe configuration error when default Gemini API key is missing", async () => {
    const origKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const result = await caller({ ...user, id: 9101 }).hanna.ask({
        prompt: "Help me think",
      });
      expect(result.text).toContain("Hanna Agent Core");
      expect(result.providerError).toBe(true);
    } finally {
      process.env.GEMINI_API_KEY = origKey;
    }
  });

  it("validates requests through the actual tRPC procedure", async () => {
    await expect(caller(user).hanna.ask({ prompt: "" })).rejects.toThrow();
  });

  it("stops before provider execution when an external write requires approval", async () => {
    const origKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "AIzaSyTestKey";

    try {
      const result = await executeHannaRequest(
        "Publish this post to Instagram",
        undefined,
        user.id
      );
      expect(result.text).toContain("need your approval");
      expect(invokeUserProvider).not.toHaveBeenCalled();
    } finally {
      process.env.GEMINI_API_KEY = origKey;
    }
  });
});
