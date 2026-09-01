import { describe, expect, it } from "vitest";
import {
  buildAgentPlan,
  createDefaultToolRegistry,
  runAgentCore,
  runAgentLoop,
  taskScheduler,
} from "./agentCore";

describe("Hanna Agent Core", () => {
  it("plans document analysis and question generation without fabricating tool output", () => {
    const plan = buildAgentPlan(
      "Upload this PDF, summarize it, and create 20 questions"
    );
    expect(plan.tools.map(tool => tool.id)).toEqual(
      expect.arrayContaining(["files.read", "content.generate"])
    );
    expect(plan.steps.join(" ")).toContain("Read the supplied file");
    expect(plan.approvalRequired).toBe(false);
  });

  it("schedules tasks and detects scheduling intent in agent plan", () => {
    const plan = buildAgentPlan(
      "Schedule a task to check Shopify orders every day at 5pm"
    );
    expect(plan.tools.map(tool => tool.id)).toContain("task.schedule");
    expect(plan.steps.join(" ")).toContain("Schedule the requested task");
  });

  it("executes task scheduling tool correctly", async () => {
    const registry = createDefaultToolRegistry();
    const result = await runAgentLoop(
      {
        userMessage: "Schedule daily report",
        requestId: "req-schedule-1",
        userId: 42,
      },
      async state =>
        state.step === 0
          ? {
              type: "tool_call",
              toolId: "task.schedule",
              arguments: {
                title: "Daily Sales Report",
                schedule: "At 9:00 AM",
                action: "generate_sales_summary",
              },
            }
          : { type: "final", response: "Task scheduled successfully." },
      registry
    );

    expect(result.status).toBe("completed");
    expect(result.toolResults[0]?.data).toMatchObject({
      scheduled: true,
      task: expect.objectContaining({
        title: "Daily Sales Report",
        cronOrSchedule: "At 9:00 AM",
        status: "scheduled",
      }),
    });

    const userTasks = taskScheduler.listTasks(42);
    expect(userTasks.some(t => t.title === "Daily Sales Report")).toBe(true);
  });

  it("pauses before consequential external actions", async () => {
    const result = await runAgentCore(
      "Publish this campaign to Instagram",
      undefined,
      async () => ({ text: "should not run", model: "test" })
    );
    expect(result.plan.approvalRequired).toBe(true);
    expect(result.text).toContain("need your approval");
    expect(result.trace.find(item => item.stage === "decide")?.status).toBe(
      "waiting"
    );
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
      async state =>
        state.step === 0
          ? {
              type: "tool_call",
              toolId: "mock.module.create",
              arguments: { title: "Biology" },
            }
          : { type: "final", response: "Created the module." },
      registry
    );
    expect(
      registry.discover("education.module.create").map(tool => tool.id)
    ).toContain("mock.module.create");
    expect(result.status).toBe("completed");
    expect(result.toolResults[0]?.data).toEqual({
      id: "module_123",
      title: "Biology",
    });
  });

  it("returns a safe provider failure without claiming a tool ran", async () => {
    const result = await runAgentCore(
      "Analyze this report",
      undefined,
      async () => {
        throw new Error("provider unavailable");
      }
    );
    expect(result.providerError).toBe(true);
    expect(result.text).toContain("Check its API key in Settings");
    expect(
      result.trace.find(item => item.stage === "verify")?.detail
    ).toContain("no fabricated tool results");
  });
});
