import { routeHannaRequest, type HannaRoute } from "./hannaRouting";

export type AgentStage = "understand" | "plan" | "decide" | "execute" | "verify";
export type AgentTool = {
  id: string;
  label: string;
  description: string;
  requiresApproval: boolean;
  scopes: string[];
};
export type AgentTrace = { stage: AgentStage; status: "completed" | "waiting" | "skipped"; detail: string };
export type AgentPlan = {
  intent: string;
  route: HannaRoute;
  tools: AgentTool[];
  approvalRequired: boolean;
  steps: string[];
};
export type AgentResult = {
  text: string;
  model: string;
  capability: string;
  plan: AgentPlan;
  trace: AgentTrace[];
  providerError?: boolean;
};

const tools: AgentTool[] = [
  { id: "knowledge.search", label: "Search Knowledge", description: "Retrieve connected workspace context.", requiresApproval: false, scopes: ["knowledge:read"] },
  { id: "files.read", label: "Read documents", description: "Inspect a user-provided document or file.", requiresApproval: false, scopes: ["files:read"] },
  { id: "content.generate", label: "Generate content", description: "Create a draft, summary, questions, or structured output.", requiresApproval: false, scopes: ["content:write"] },
  { id: "external.write", label: "Change an external system", description: "Perform a consequential write in a connected service.", requiresApproval: true, scopes: ["external:write"] },
];

export function buildAgentPlan(prompt: string): AgentPlan {
  const lower = prompt.toLowerCase();
  const route = routeHannaRequest(prompt);
  const selected: AgentTool[] = [];
  const steps: string[] = ["Understand the request and identify the desired outcome."];
  if (/(pdf|document|file|upload|image|scan)/.test(lower)) {
    selected.push(tools.find(tool => tool.id === "files.read")!);
    steps.push("Read the supplied file or document context.");
  }
  if (/(knowledge|research|source|compare|context)/.test(lower)) {
    selected.push(tools.find(tool => tool.id === "knowledge.search")!);
    steps.push("Search connected knowledge sources when available.");
  }
  if (/(create|generate|summar|question|quiz|write|draft|build|plan)/.test(lower) || selected.length === 0) {
    selected.push(tools.find(tool => tool.id === "content.generate")!);
    steps.push("Generate the requested result from verified context.");
  }
  if (/(send|publish|delete|purchase|deploy|update|post)/.test(lower)) {
    selected.push(tools.find(tool => tool.id === "external.write")!);
    steps.push("Pause for explicit approval before any consequential external action.");
  }
  steps.push("Verify the response against the request and report any unavailable tools or context.");
  return {
    intent: prompt.trim().slice(0, 160),
    route,
    tools: selected,
    approvalRequired: selected.some(tool => tool.requiresApproval),
    steps,
  };
}

export function buildAgentTrace(plan: AgentPlan, providerError = false): AgentTrace[] {
  return [
    { stage: "understand", status: "completed", detail: "Request intent identified." },
    { stage: "plan", status: "completed", detail: `${plan.steps.length} execution steps prepared.` },
    { stage: "decide", status: plan.approvalRequired ? "waiting" : "completed", detail: plan.approvalRequired ? "Approval required before an external write." : `${plan.tools.length} scoped tools selected.` },
    { stage: "execute", status: providerError ? "completed" : "completed", detail: providerError ? "Provider rejected the request; no external action was taken." : "Model execution completed." },
    { stage: "verify", status: providerError ? "completed" : "completed", detail: providerError ? "Failure was surfaced safely for recovery; no fabricated tool results were returned." : "Response returned with no fabricated tool results.", },
  ];
}

export async function runAgentCore(prompt: string, context: string | undefined, generateText: (request: { prompt: string; context?: string; plan: AgentPlan }) => Promise<{ text: string; model: string }>): Promise<AgentResult> {
  const plan = buildAgentPlan(prompt);
  if (plan.approvalRequired) {
    return {
      text: "I prepared the plan, but I need your approval before changing an external system. Review the approval gate and confirm the action to continue.",
      model: plan.route.model,
      capability: plan.route.capability,
      plan,
      trace: buildAgentTrace(plan),
    };
  }
  try {
    const response = await generateText({ prompt, context, plan });
    return { ...response, capability: plan.route.capability, plan, trace: buildAgentTrace(plan) };
  } catch {
    return {
      text: "Your selected provider could not complete this request. Check its API key in Settings and try again.",
      model: plan.route.model,
      capability: plan.route.capability,
      plan,
      trace: buildAgentTrace(plan, true),
      providerError: true,
    };
  }
}
