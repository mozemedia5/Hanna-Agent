import { describe, expect, it } from "vitest";
import { buildAgentPlan, createDefaultToolRegistry, runAgentCore, runAgentLoop } from "./agentCore";

describe("Hanna Agent Core", () => {
  it("plans document analysis and question generation without fabricating tool output", () => {
    const plan = buildAgentPlan("Upload this PDF, summarize it, and create 20 questions");
    expect(plan.tools.map(tool => tool.id)).toEqual(expect.arrayContaining(["files.read", "content.generate"]));
    expect(plan.steps.join(" ")).toContain("Read the supplied file");
    expect(plan.approvalRequired).toBe(false);
  });

  it("pauses before consequential external actions", async () => {
    const result = await runAgentCore("Publish this campaign to Instagram", undefined, async () => ({ text: "should not run", model: "test" }));
    expect(result.plan.approvalRequired).toBe(true);
    expect(result.text).toContain("need your approval");
    expect(result.trace.find(item => item.stage === "decide")?.status).toBe("waiting");
  });

  it("discovers and executes tools added after registry creation", async () => {
    const registry = createDefaultToolRegistry();
    registry.register({
      id: "mock.module.create",
      label: "Create module",
      description: "Create a learning module in the mock adapter.",
      capabilities: ["education.module.create"],
      requiresApproval: false,
      scopes: ["education:write"],
      execute: async args => ({ id: "module_123", title: args.title }),
    });
    const result = await runAgentLoop(
      { userMessage: "Create a biology module", requestId: "test-request" },
      async state => state.step === 0
        ? { type: "tool_call", toolId: "mock.module.create", arguments: { title: "Biology" } }
        : { type: "final", response: "Created the module." },
      registry,
    );
    expect(registry.discover("education.module.create").map(tool => tool.id)).toContain("mock.module.create");
    expect(result.status).toBe("completed");
    expect(result.toolResults[0]?.data).toEqual({ id: "module_123", title: "Biology" });
  });

  it("returns a safe provider failure without claiming a tool ran", async () => {
    const result = await runAgentCore("Analyze this report", undefined, async () => { throw new Error("provider unavailable"); });
    expect(result.providerError).toBe(true);
    expect(result.text).toContain("Check its API key in Settings");
    expect(result.trace.find(item => item.stage === "verify")?.detail).toContain("no fabricated tool results");
  });
});
