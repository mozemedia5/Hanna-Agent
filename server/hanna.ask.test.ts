import { beforeEach, describe, expect, it, vi } from "vitest";

const { invokeLLM } = vi.hoisted(() => ({ invokeLLM: vi.fn() }));
vi.mock("./_core/llm", () => ({ invokeLLM }));

import { appRouter, executeHannaRequest } from "./routers";

const caller = () => appRouter.createCaller({ req: {} as any, res: {} as any, user: null });

describe("hanna.ask", () => {
  beforeEach(() => invokeLLM.mockReset());

  it("returns a routed model response from the server procedure", async () => {
    invokeLLM.mockResolvedValue({ choices: [{ message: { content: "## Done\n\nI found three useful themes." } }] });
    const result = await caller().hanna.ask({ prompt: "Research the key themes" });
    expect(result.text).toContain("three useful themes");
    expect(result.model).toBe("gpt-5-mini");
  });

  it("returns a safe fallback when the model has no text content", async () => {
    invokeLLM.mockResolvedValue({ choices: [{ message: { content: null } }] });
    const result = await caller().hanna.ask({ prompt: "Help me think" });
    expect(result.text).toContain("rephrase");
  });

  it("validates requests through the actual tRPC procedure", async () => {
    await expect(caller().hanna.ask({ prompt: "" })).rejects.toThrow();
  });

  it("returns a safe error response when the provider rejects", async () => {
    const failingProvider = async () => { throw new Error("provider unavailable"); };
    const result = await executeHannaRequest("Analyze this report", undefined, failingProvider as any);
    expect(result.text).toContain("unable to reach");
    expect(result.model).toBe("gpt-5-mini");
  });
});
