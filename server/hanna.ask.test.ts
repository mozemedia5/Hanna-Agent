import { beforeEach, describe, expect, it, vi } from "vitest";

const { invokeUserProvider } = vi.hoisted(() => ({ invokeUserProvider: vi.fn() }));
vi.mock("./providerAdapters", () => ({ invokeUserProvider }));

import { appRouter, executeHannaRequest } from "./routers";
import { upsertProviderCredential } from "./providerDb";

const caller = (user: any = null) => appRouter.createCaller({ req: {} as any, res: {} as any, user });
const user = { id: 9100, openId: "provider-test", name: "Provider Test", email: null, loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

describe("hanna.ask", () => {
  beforeEach(() => invokeUserProvider.mockReset());

  it("returns a routed user-provider response from the server procedure", async () => {
    invokeUserProvider.mockResolvedValue("## Done\n\nI found three useful themes.");
    await upsertProviderCredential(user.id, "openai", "OpenAI", "sk-test-key-9100");
    const result = await caller(user).hanna.ask({ prompt: "Research the key themes" });
    expect(result.text).toContain("three useful themes");
    expect(result.model).toContain("openai");
    expect(result.plan.trace).toBeUndefined();
  });

  it("returns a safe configuration response when no user provider is configured", async () => {
    const result = await caller({ ...user, id: 9101 }).hanna.ask({ prompt: "Help me think" });
    expect(result.text).toContain("Check its API key in Settings");
    expect(result.providerError).toBe(true);
  });

  it("validates requests through the actual tRPC procedure", async () => {
    await expect(caller(user).hanna.ask({ prompt: "" })).rejects.toThrow();
  });

  it("stops before provider execution when an external write requires approval", async () => {
    const result = await executeHannaRequest("Publish this post to Instagram", undefined, user.id);
    expect(result.text).toContain("need your approval");
    expect(invokeUserProvider).not.toHaveBeenCalled();
  });
});
