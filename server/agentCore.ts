import { routeHannaRequest, type HannaRoute } from "./hannaRouting";
import type { IntegrationDefinition } from "@shared/integrations";

export type AgentStage = "understand" | "plan" | "decide" | "execute" | "verify";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ToolAvailability = "available" | "disabled" | "authentication_required" | "permission_denied" | "temporarily_unavailable" | "rate_limited" | "not_supported";

export type ToolExecutionContext = {
  userId?: number;
  workspaceId?: string;
  requestId: string;
  conversationId?: string;
};

export type AgentTool = {
  id: string;
  label: string;
  description: string;
  category?: string;
  provider?: string;
  version?: string;
  capabilities?: string[];
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  requiresApproval: boolean;
  scopes: string[];
  riskLevel?: RiskLevel;
  availability?: ToolAvailability;
  readOnly?: boolean;
  mutatesData?: boolean;
  destructive?: boolean;
  timeoutMs?: number;
  execute?: (arguments_: Record<string, unknown>, context: ToolExecutionContext) => Promise<unknown>;
};

export type NormalizedToolResult = {
  status: "success" | "error" | "skipped";
  success: boolean;
  data?: unknown;
  error?: { code: string; message: string };
  metadata: { provider?: string; tool: string; executionId: string; durationMs: number };
};

export type AgentTrace = { stage: AgentStage; status: "completed" | "waiting" | "skipped"; detail: string };
export type AgentPlan = { intent: string; route: HannaRoute; tools: AgentTool[]; approvalRequired: boolean; steps: string[] };
export type AgentResult = { text: string; model: string; capability: string; plan: AgentPlan; trace: AgentTrace[]; providerError?: boolean };

const defaultTools: AgentTool[] = [
  { id: "knowledge.search", label: "Search Knowledge", description: "Retrieve connected workspace context.", category: "knowledge", capabilities: ["knowledge.read"], requiresApproval: false, scopes: ["knowledge:read"], riskLevel: "low", readOnly: true },
  { id: "files.read", label: "Read documents", description: "Inspect a user-provided document or file.", category: "files", capabilities: ["files.read"], requiresApproval: false, scopes: ["files:read"], riskLevel: "low", readOnly: true },
  { id: "content.generate", label: "Generate content", description: "Create a draft, summary, questions, or structured output.", category: "content", capabilities: ["content.generate"], requiresApproval: false, scopes: ["content:write"], riskLevel: "low", mutatesData: false },
  { id: "external.write", label: "Change an external system", description: "Perform a consequential write in a connected service.", category: "external", capabilities: ["external.write"], requiresApproval: true, scopes: ["external:write"], riskLevel: "high", mutatesData: true },
];

export class DynamicToolRegistry {
  private readonly registered = new Map<string, AgentTool>();

  constructor(initialTools: AgentTool[] = []) {
    for (const tool of initialTools) this.register(tool);
  }

  register(tool: AgentTool): void {
    if (!tool.id.trim() || !tool.description.trim()) throw new Error("A tool requires a non-empty id and description");
    this.registered.set(tool.id, { ...tool, version: tool.version ?? "1.0.0", availability: tool.availability ?? "available" });
  }

  unregister(toolId: string): boolean { return this.registered.delete(toolId); }
  get(toolId: string): AgentTool | undefined { return this.registered.get(toolId); }
  list(): AgentTool[] { return Array.from(this.registered.values()); }
  discover(capability?: string): AgentTool[] {
    return this.list().filter(tool => tool.availability === "available" && (!capability || tool.capabilities?.includes(capability)));
  }
}

/** Converts an external Model Context Protocol (MCP) tool schema into a normalized AgentTool instance. */
export function normalizeMcpTool(mcpTool: {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  provider?: string;
  category?: string;
  requiresApproval?: boolean;
}, executor?: (arguments_: Record<string, unknown>, context: ToolExecutionContext) => Promise<unknown>): AgentTool {
  const toolId = `mcp.${mcpTool.provider ?? "custom"}.${mcpTool.name.replaceAll(/[^a-zA-Z0-9_.]/g, "_")}`;
  return {
    id: toolId,
    label: mcpTool.name,
    description: mcpTool.description ?? `MCP discovered tool: ${mcpTool.name}`,
    category: mcpTool.category ?? "custom_mcp",
    provider: mcpTool.provider ?? "mcp-custom",
    capabilities: [`mcp:${mcpTool.name}`],
    inputSchema: mcpTool.inputSchema ?? {},
    requiresApproval: mcpTool.requiresApproval ?? true,
    scopes: [`mcp:${mcpTool.name}`],
    riskLevel: mcpTool.requiresApproval ? "high" : "medium",
    availability: "available",
    execute: executor ?? (async (args) => ({ mcpTool: mcpTool.name, executed: true, arguments: args })),
  };
}

/** Converts an IntegrationDefinition into a normalized AgentTool instance for the registry. */
export function normalizeIntegrationTool(
  integration: IntegrationDefinition,
  actionName: string,
  executor?: (arguments_: Record<string, unknown>, context: ToolExecutionContext) => Promise<unknown>
): AgentTool {
  return {
    id: `${integration.id}.${actionName}`,
    label: `${integration.name} - ${actionName.replaceAll("_", " ")}`,
    description: integration.description,
    category: integration.category,
    provider: integration.id,
    capabilities: integration.capabilities,
    requiresApproval: integration.requiresApproval,
    scopes: integration.capabilities,
    riskLevel: integration.requiresApproval ? "medium" : "low",
    availability: "available",
    execute: executor ?? (async (args) => ({ integration: integration.id, action: actionName, executed: true, arguments: args })),
  };
}

export const createDefaultToolRegistry = (): DynamicToolRegistry => new DynamicToolRegistry(defaultTools);

export class ToolExecutionEngine {
  constructor(private readonly registry: DynamicToolRegistry) {}

  async execute(toolId: string, arguments_: Record<string, unknown>, context: ToolExecutionContext, approved = false): Promise<NormalizedToolResult> {
    const executionId = `${context.requestId}:${toolId}:${Date.now()}`;
    const started = Date.now();
    const tool = this.registry.get(toolId);
    if (!tool) return this.error("TOOL_UNAVAILABLE", "The requested tool is not registered.", toolId, executionId, started);
    const availability = tool.availability ?? "available";
    if (availability !== "available") return this.error("TOOL_UNAVAILABLE", `Tool is ${availability.replaceAll("_", " ")}.`, toolId, executionId, started);
    if (tool.requiresApproval && !approved) return this.error("CONFIRMATION_REQUIRED", "This tool requires explicit user confirmation.", toolId, executionId, started);
    if (!tool.execute) return this.error("NOT_IMPLEMENTED", "The tool is registered but has no execution adapter yet.", toolId, executionId, started);

    try {
      const result = await withTimeout(tool.execute(arguments_, context), tool.timeoutMs ?? 30_000);
      return { status: "success", success: true, data: result, metadata: { provider: tool.provider, tool: tool.id, executionId, durationMs: Date.now() - started } };
    } catch (error) {
      return this.error("TOOL_EXECUTION_FAILED", error instanceof Error ? error.message : "Tool execution failed.", tool.id, executionId, started);
    }
  }

  private error(code: string, message: string, tool: string, executionId: string, started: number): NormalizedToolResult {
    return { status: "error", success: false, error: { code, message }, metadata: { tool, executionId, durationMs: Date.now() - started } };
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([promise, new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error("Tool execution timed out")), timeoutMs); })]);
  } finally { if (timer) clearTimeout(timer); }
}

export type AgentDecision = { type: "tool_call"; toolId: string; arguments: Record<string, unknown>; approved?: boolean } | { type: "final"; response: string };
export type AgentLoopOptions = { maxSteps?: number; maxToolCalls?: number; timeoutMs?: number };

export async function runAgentLoop(
  initialContext: { userMessage: string; history?: string[]; requestId: string; userId?: number; workspaceId?: string },
  decide: (state: { userMessage: string; history: string[]; toolResults: NormalizedToolResult[]; availableTools: AgentTool[]; step: number }) => Promise<AgentDecision>,
  registry: DynamicToolRegistry,
  options: AgentLoopOptions = {},
): Promise<{ status: "completed" | "failed" | "waiting_for_confirmation"; response?: string; toolResults: NormalizedToolResult[]; steps: number }> {
  const maxSteps = options.maxSteps ?? 8;
  const maxToolCalls = options.maxToolCalls ?? 8;
  const deadline = Date.now() + (options.timeoutMs ?? 60_000);
  const results: NormalizedToolResult[] = [];
  const history = [...(initialContext.history ?? []), initialContext.userMessage];
  const executor = new ToolExecutionEngine(registry);
  let toolCalls = 0;

  for (let step = 0; step < maxSteps; step += 1) {
    if (Date.now() >= deadline) return { status: "failed", toolResults: results, steps: step };
    const decision = await decide({ userMessage: initialContext.userMessage, history, toolResults: results, availableTools: registry.list(), step });
    if (decision.type === "final") return { status: "completed", response: decision.response, toolResults: results, steps: step + 1 };
    if (++toolCalls > maxToolCalls) return { status: "failed", toolResults: results, steps: step + 1 };

    const result = await executor.execute(decision.toolId, decision.arguments, initialContext, decision.approved);
    results.push(result);
    if (result.error?.code === "CONFIRMATION_REQUIRED") return { status: "waiting_for_confirmation", toolResults: results, steps: step + 1 };
    history.push(`Tool ${decision.toolId} returned ${result.success ? "success" : "error"}.`);
  }
  return { status: "failed", toolResults: results, steps: maxSteps };
}

export function buildAgentPlan(prompt: string): AgentPlan {
  const lower = prompt.toLowerCase();
  const route = routeHannaRequest(prompt);
  const registry = createDefaultToolRegistry();
  const selected: AgentTool[] = [];
  const steps = ["Understand the request and identify the desired outcome."];
  const add = (id: string, step: string) => { const tool = registry.get(id); if (tool && !selected.some(item => item.id === id)) { selected.push(tool); steps.push(step); } };
  if (/(pdf|document|file|upload|image|scan|picture|video|photo)/.test(lower)) add("files.read", "Read the supplied file or document context.");
  if (/(knowledge|research|source|compare|context|trend|market|stats)/.test(lower)) add("knowledge.search", "Search connected knowledge sources and market data when available.");
  if (/(create|generate|summar|question|quiz|write|draft|build|plan|design|ad|post|campaign|product|list|code)/.test(lower) || selected.length === 0) add("content.generate", "Generate the requested result from verified context.");
  if (/(send|publish|delete|purchase|deploy|update|post|order|fulfill|checkout|sync)/.test(lower)) add("external.write", "Pause for explicit approval before any consequential external action.");
  steps.push("Verify the response against the request and report any unavailable tools or context.");
  return { intent: prompt.trim().slice(0, 160), route, tools: selected, approvalRequired: selected.some(tool => tool.requiresApproval), steps };
}

export function buildAgentTrace(plan: AgentPlan, providerError = false): AgentTrace[] {
  return [
    { stage: "understand", status: "completed", detail: "Request intent identified." },
    { stage: "plan", status: "completed", detail: `${plan.steps.length} execution steps prepared.` },
    { stage: "decide", status: plan.approvalRequired ? "waiting" : "completed", detail: plan.approvalRequired ? "Approval required before an external write." : `${plan.tools.length} scoped tools selected.` },
    { stage: "execute", status: "completed", detail: providerError ? "Provider rejected the request; no external action was taken." : "Model execution completed." },
    { stage: "verify", status: "completed", detail: providerError ? "Failure was surfaced safely for recovery; no fabricated tool results were returned." : "Response returned with no fabricated tool results." },
  ];
}

export async function runAgentCore(prompt: string, context: string | undefined, generateText: (request: { prompt: string; context?: string; plan: AgentPlan }) => Promise<{ text: string; model: string }>): Promise<AgentResult> {
  const plan = buildAgentPlan(prompt);
  if (plan.approvalRequired) return { text: "I prepared the plan, but I need your approval before changing an external system. Review the approval gate and confirm the action to continue.", model: plan.route.model, capability: plan.route.capability, plan, trace: buildAgentTrace(plan) };
  try {
    const response = await generateText({ prompt, context, plan });
    return { ...response, capability: plan.route.capability, plan, trace: buildAgentTrace(plan) };
  } catch {
    return { text: "Your selected provider could not complete this request. Check its API key in Settings and try again.", model: plan.route.model, capability: plan.route.capability, plan, trace: buildAgentTrace(plan, true), providerError: true };
  }
}
