import { EventEmitter } from "events";

export type ManusOperationalProfile = "Lite" | "Pro" | "Max";

export type ManusToolType = "Web Browser" | "Code Interpreter" | "File System" | "External API" | "Google Sheets" | "Stripe" | "Facebook Ads";

export interface ManusStep {
  id: string;
  order: number;
  label: string;
  tool: ManusToolType;
  status: "pending" | "running" | "validating" | "completed" | "failed";
  durationSeconds?: number;
  output?: string;
  error?: string;
}

export interface ManusTelemetryFrame {
  taskId: string;
  timestamp: number;
  speechStatus: string;
  stepProgressText: string;
  activeConnector: ManusToolType;
  cursor: { x: number; y: number; actionLabel?: string };
  activeTab: "browser" | "code" | "terminal" | "files";
  steps: ManusStep[];
  logs: string[];
  isCompleted: boolean;
  finalOutput?: string;
}

export interface ManusTaskState {
  id: string;
  userId: string;
  prompt: string;
  profile: ManusOperationalProfile;
  armChips: string[];
  status: "initializing" | "running" | "validating" | "completed" | "failed";
  steps: ManusStep[];
  logs: string[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  finalResult?: string;
}

// In-memory store for persistent cloud task states
const taskStore = new Map<string, ManusTaskState>();

// Global telemetry event emitter for WebSockets & Server-Sent Events (SSE)
export const manusEventEmitter = new EventEmitter();

/**
 * 1. Manus Planner: Decomposes a high-level goal prompt into an ordered sequence of actionable steps.
 */
export class ManusPlanner {
  public static createPlan(prompt: string, profile: ManusOperationalProfile, armChips: string[] = []): ManusStep[] {
    const isHeavy = profile === "Max" || armChips.length > 2;

    const baseSteps: ManusStep[] = [
      {
        id: "step-1",
        order: 1,
        label: "Decompose task & inspect workspace context",
        tool: "File System",
        status: "pending",
      },
      {
        id: "step-2",
        order: 2,
        label: "Execute targeted web search & competitive analysis",
        tool: "Web Browser",
        status: "pending",
      },
      {
        id: "step-3",
        order: 3,
        label: "Run analytical code transformation & data processing",
        tool: "Code Interpreter",
        status: "pending",
      },
      {
        id: "step-4",
        order: 4,
        label: "Synthesize structured output spreadsheet & report",
        tool: "Google Sheets",
        status: "pending",
      },
    ];

    if (isHeavy) {
      baseSteps.push({
        id: "step-5",
        order: 5,
        label: "Multi-agent consensus audit & validation",
        tool: "External API",
        status: "pending",
      });
    }

    return baseSteps;
  }
}

/**
 * 2. Manus Critic: Validates step execution output against criteria before proceeding.
 */
export class ManusCritic {
  public static validateStepOutput(step: ManusStep, resultData: string): { isValid: boolean; critique: string } {
    if (!resultData || resultData.trim().length === 0) {
      return { isValid: false, critique: `Step ${step.label} produced empty output.` };
    }

    if (step.tool === "Code Interpreter" && resultData.includes("SyntaxError")) {
      return { isValid: false, critique: `Code execution encountered syntax error in step ${step.label}.` };
    }

    return { isValid: true, critique: `Step ${step.label} validated successfully.` };
  }
}

/**
 * 3. Manus Executor: Asynchronous persistent server-side execution loop.
 */
export class ManusExecutor {
  public static async executeTask(
    taskId: string,
    userId: string,
    prompt: string,
    profile: ManusOperationalProfile,
    armChips: string[] = []
  ): Promise<ManusTaskState> {
    const steps = ManusPlanner.createPlan(prompt, profile, armChips);

    const task: ManusTaskState = {
      id: taskId,
      userId,
      prompt,
      profile,
      armChips,
      status: "running",
      steps,
      logs: [`[INIT] Task ${taskId} registered in server-side cloud sandbox.`],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    taskStore.set(taskId, task);

    // Run execution asynchronously on server (persists regardless of browser connection)
    void ManusExecutor.runExecutionLoop(task);

    return task;
  }

  private static async runExecutionLoop(task: ManusTaskState) {
    for (let i = 0; i < task.steps.length; i++) {
      const step = task.steps[i];
      step.status = "running";
      task.updatedAt = Date.now();

      // Emit live telemetry for starting step
      const startSpeech = `Step ${i + 1}/${task.steps.length}: ${step.label}...`;
      task.logs.push(`[EXEC] Running ${step.tool} for step ${step.id}: ${step.label}`);

      ManusExecutor.broadcastTelemetry(task, startSpeech, `${i + 1}/${task.steps.length}`, step.tool, {
        x: 25 + i * 15,
        y: 30 + i * 10,
        actionLabel: `Executing ${step.tool}...`,
      });

      // Simulate tool execution delay in cloud sandbox
      await new Promise(res => setTimeout(res, 800));

      // Generate step output
      const rawOutput = `Output from ${step.tool} execution for "${task.prompt.slice(0, 30)}"`;

      // Pass output through Critic/Validator
      step.status = "validating";
      const validation = ManusCritic.validateStepOutput(step, rawOutput);

      if (validation.isValid) {
        step.status = "completed";
        step.output = rawOutput;
        step.durationSeconds = 1;
        task.logs.push(`[CRITIC] ${validation.critique}`);
      } else {
        step.status = "failed";
        step.error = validation.critique;
        task.status = "failed";
        task.logs.push(`[ERROR] Step ${step.id} failed validation.`);
        taskStore.set(task.id, task);
        return;
      }

      taskStore.set(task.id, task);
    }

    // All steps complete
    task.status = "completed";
    task.completedAt = Date.now();
    task.finalResult = `### Manus AI Autonomous Task Execution Complete\n\n**Goal**: "${task.prompt}"\n**Execution Mode**: ${task.profile}\n\nAll ${task.steps.length} hierarchical plan steps completed and validated by Critic loop. Output files saved to server-side sandbox.`;

    task.logs.push(`[COMPLETE] Task ${task.id} finalized successfully.`);
    taskStore.set(task.id, task);

    ManusExecutor.broadcastTelemetry(
      task,
      "Task Complete. Output files generated and validated.",
      "Complete",
      "Google Sheets",
      { x: 50, y: 50, actionLabel: "Complete" },
      true
    );
  }

  public static getTaskState(taskId: string): ManusTaskState | undefined {
    return taskStore.get(taskId);
  }

  private static broadcastTelemetry(
    task: ManusTaskState,
    speechStatus: string,
    stepProgressText: string,
    activeConnector: ManusToolType,
    cursor: { x: number; y: number; actionLabel?: string },
    isCompleted = false
  ) {
    const frame: ManusTelemetryFrame = {
      taskId: task.id,
      timestamp: Date.now(),
      speechStatus,
      stepProgressText,
      activeConnector,
      cursor,
      activeTab: activeConnector === "Code Interpreter" ? "code" : activeConnector === "Web Browser" ? "browser" : "files",
      steps: task.steps,
      logs: task.logs,
      isCompleted,
      finalOutput: task.finalResult,
    };

    manusEventEmitter.emit(`telemetry:${task.id}`, frame);
  }
}
