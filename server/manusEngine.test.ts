import { describe, it, expect } from "vitest";
import { ManusPlanner, ManusCritic, ManusExecutor, manusEventEmitter } from "./manusEngine";

describe("Manus AI Backend Engine Unit & Integration Tests", () => {
  it("1. ManusPlanner decomposes prompt into sequential step plan based on profile", () => {
    const litePlan = ManusPlanner.createPlan("Analyze ROI", "Lite", []);
    expect(litePlan.length).toBe(4);
    expect(litePlan[0].tool).toBe("File System");
    expect(litePlan[1].tool).toBe("Web Browser");

    const maxPlan = ManusPlanner.createPlan("Analyze ROI & Audit", "Max", ["Slides", "Design", "Code Analysis"]);
    expect(maxPlan.length).toBe(5);
    expect(maxPlan[4].tool).toBe("External API");
  });

  it("2. ManusCritic validates step outputs correctly", () => {
    const step = { id: "step-1", order: 1, label: "Test Step", tool: "Code Interpreter" as const, status: "running" as const };

    const validResult = ManusCritic.validateStepOutput(step, "ROAS = 3.85");
    expect(validResult.isValid).toBe(true);

    const invalidResult = ManusCritic.validateStepOutput(step, "SyntaxError: unexpected token");
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.critique).toContain("syntax error");
  });

  it("3. ManusExecutor creates asynchronous persistent task and emits live telemetry", async () => {
    const taskId = `test_task_${Date.now()}`;
    let emittedFrame: any = null;

    manusEventEmitter.once(`telemetry:${taskId}`, frame => {
      emittedFrame = frame;
    });

    const task = await ManusExecutor.executeTask(taskId, "test_user_123", "Audit ad metrics", "Pro", ["Slides"]);

    expect(task.id).toBe(taskId);
    expect(task.status).toBe("running");
    expect(task.steps.length).toBeGreaterThan(0);

    // Wait briefly for telemetry emission
    await new Promise(res => setTimeout(res, 100));

    expect(emittedFrame).not.toBeNull();
    expect(emittedFrame.taskId).toBe(taskId);
    expect(emittedFrame.activeConnector).toBe("File System");

    const retrievedState = ManusExecutor.getTaskState(taskId);
    expect(retrievedState).toBeDefined();
    expect(retrievedState?.userId).toBe("test_user_123");
  });
});
