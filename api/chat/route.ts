import type { Request as ExpressRequest, Response as ExpressResponse } from "express";
import { routeHannaRequest } from "../../server/hannaRouting";
import {
  buildAgentPlan,
  buildAgentTrace,
  createDefaultToolRegistry,
  runAgentLoop,
  synthesizeFallbackResponse,
} from "../../server/agentCore";
import { getConnectorCredential, listConnectorCredentials } from "../../server/connectorDb";
import { executeConnectorAction } from "../../server/connectorAdapters";
import { listMcpTools } from "../../server/mcpServer";
import { getProviderCredentialForRequest } from "../../server/providerDb";
import { invokeGeminiAgentTurn, invokeUserProvider } from "../../server/providerAdapters";
import { consumeDailyTokens, type HannaTier } from "../../server/usage";

export type IntentRouteType = "route_a" | "route_b";

export type IntentAnalysisResult = {
  route: IntentRouteType;
  confidence: number;
  reason: string;
  detectedTools: string[];
  capabilities: string[];
};

/**
 * Intent Router (Lightweight Pass):
 * Intercepts incoming prompts before processing and evaluates intent.
 */
export function analyzePromptIntent(
  prompt: string,
  hasConnectedApps = false,
  agenticModeFlag = false
): IntentAnalysisResult {
  if (agenticModeFlag) {
    return {
      route: "route_b",
      confidence: 1.0,
      reason: "User explicitly enabled agentic invocation mode.",
      detectedTools: ["agent.orchestrator"],
      capabilities: ["agentic_loop"],
    };
  }

  const lower = prompt.toLowerCase();

  // Route B trigger patterns
  const actionKeywords = [
    "shopify", "store", "product", "inventory", "order", "customer", "checkout",
    "github", "repo", "commit", "push", "pull request", "issue", "branch",
    "slack", "channel", "message", "workspace", "send slack",
    "gmail", "email", "send mail", "draft mail", "inbox",
    "google workspace", "drive", "docs", "sheets", "slides", "google calendar", "schedule meeting",
    "meta ads", "google ads", "facebook ads", "ad campaign", "roas", "ctr",
    "heygen", "synthesia", "creatify", "tiktok", "instagram", "facebook", "telegram", "outlook", "vercel",
    "schedule task", "run agent loop", "execute tool", "create product", "update product", "sync inventory",
    "file alteration", "write file", "deploy", "mcp tool"
  ];

  const matched = actionKeywords.filter(kw => lower.includes(kw));

  if (matched.length > 0) {
    return {
      route: "route_b",
      confidence: 0.95,
      reason: `Prompt demands ecosystem actions or tool integrations matching: ${matched.join(", ")}`,
      detectedTools: matched,
      capabilities: ["tool_execution", "mcp_integration", "react_loop"],
    };
  }

  if (hasConnectedApps && /(check|sync|update|post|send|fetch|get|list|create|delete)/.test(lower)) {
    return {
      route: "route_b",
      confidence: 0.85,
      reason: "Prompt requires interaction with active connected workspace apps.",
      detectedTools: ["connected_apps"],
      capabilities: ["app_connector"],
    };
  }

  // Purely conversational or simple question -> Route A
  return {
    route: "route_a",
    confidence: 0.9,
    reason: "Prompt is conversational or informational standard Q&A.",
    detectedTools: [],
    capabilities: ["single_pass_stream"],
  };
}

/**
 * Route A: Standard Streaming Handler
 * Handles single-pass direct streaming SSE connection.
 * Includes Action Interceptor Handover: if an implicit external action is detected,
 * throws a pivot event to transfer execution window directly to Route B.
 */
export async function executeRouteAStream(
  prompt: string,
  context: string | undefined,
  userId: number | undefined,
  model: string | undefined,
  sendSSE: (event: string, data: unknown) => void
): Promise<void> {
  const lower = prompt.toLowerCase();

  // Action Interceptor Pivot Check
  if (/(connect|execute|update|send slack|post message|shopify store|deploy vercel|create ad)/.test(lower)) {
    sendSSE("pivot", {
      targetRoute: "route_b",
      reason: "Action Interceptor detected implicit external app execution requirement.",
      prompt,
    });
    return;
  }

  sendSSE("status", { state: "streaming_route_a", message: "Connecting to standard streaming endpoint..." });

  try {
    const provider = await getProviderCredentialForRequest(userId, prompt, model);
    if (!provider.apiKey) {
      throw new Error("Default AI API key not configured.");
    }

    const tier: HannaTier = model === "Hanna Pro" ? "pro" : "lite";
    const quota = consumeDailyTokens(userId ? String(userId) : "guest", Math.ceil(prompt.length / 4), tier);
    if (!quota.allowed) {
      throw new Error(`Daily token limit reached. Allowance refreshes at ${quota.resetAt}.`);
    }

    const fullResponseText = await invokeUserProvider({
      ...provider,
      prompt,
      context,
    });

    // Stream text in natural chunks
    const chunkSize = 16;
    for (let i = 0; i < fullResponseText.length; i += chunkSize) {
      const chunk = fullResponseText.slice(i, i + chunkSize);
      sendSSE("token", { chunk });
      await new Promise(resolve => setTimeout(resolve, 15));
    }

    sendSSE("final", {
      text: fullResponseText,
      model: `${provider.provider} · ${provider.model}`,
      route: "route_a",
    });
  } catch (err) {
    const fallbackText = synthesizeFallbackResponse(prompt, context);
    sendSSE("fallback", {
      text: fallbackText,
      error: err instanceof Error ? err.message : "Route A execution failed.",
      route: "route_a_fallback",
    });
  }
}

/**
 * Route B: Agentic Loop (ReAct / Coordinator Pattern) SSE Handler
 * State-managed orchestrator loop (Plan -> Act -> Observe -> Reflect)
 * emitting step-by-step trace events, tool executions, and dynamic markdown breakdowns.
 */
export async function executeRouteBLoop(
  prompt: string,
  context: string | undefined,
  userId: number | undefined,
  model: string | undefined,
  sendSSE: (event: string, data: unknown) => void
): Promise<void> {
  sendSSE("status", { state: "executing_route_b", message: "Initializing ReAct Agentic Orchestrator Loop..." });

  const basePlan = buildAgentPlan(prompt);
  sendSSE("plan", { plan: basePlan });

  try {
    const provider = await getProviderCredentialForRequest(userId, prompt, model);
    if (!provider.apiKey) {
      throw new Error("Default AI API key not configured.");
    }

    const connectedSummaries = userId ? await listConnectorCredentials(userId) : [];
    const connectedCredentials = userId
      ? (await Promise.all(
          connectedSummaries.map(s => getConnectorCredential(userId, s.connector))
        )).filter((c): c is NonNullable<typeof c> => Boolean(c))
      : [];

    const registry = createDefaultToolRegistry();

    // Register active user app connectors into execution registry
    for (const summary of connectedSummaries) {
      const cred = connectedCredentials.find(c => c.connector === summary.connector);
      if (!cred) continue;

      registry.register({
        id: `connector.${summary.connector}.execute`,
        label: `${summary.connector} Execution Wrapper`,
        description: `Execute actions in ${summary.connector} with secure user OAuth token injection.`,
        category: "connector",
        provider: summary.connector,
        requiresApproval: false,
        scopes: [`${summary.connector}:execute`],
        availability: "available",
        execute: async (args) => {
          sendSSE("tool_start", { connector: summary.connector, action: args.action || "execute", args });
          const actionName = String(args.action || "list_products");
          const result = await executeConnectorAction(cred, {
            connector: summary.connector,
            action: actionName,
            parameters: (args.parameters as Record<string, unknown>) || args,
          });
          sendSSE("tool_result", { connector: summary.connector, action: actionName, result });
          return result;
        },
      });
    }

    sendSSE("trace", { stage: "understand", detail: "Intent analyzed and scoped tools loaded." });
    sendSSE("trace", { stage: "plan", detail: `${basePlan.steps.length} execution plan steps constructed.` });

    const execution = await runAgentLoop(
      {
        userMessage: prompt,
        history: context ? [context] : [],
        requestId: `req_agent_${Date.now()}`,
        userId,
      },
      async state => {
        sendSSE("trace", { stage: "decide", detail: `Executing step ${state.step + 1} decision evaluation...` });
        const toolResultsCtx = state.toolResults.length
          ? `\n\nVerified Tool Outputs:\n${JSON.stringify(state.toolResults, null, 2)}`
          : "";

        const turn = await invokeGeminiAgentTurn({
          ...provider,
          prompt: `${prompt}${toolResultsCtx}`,
          context: context || "Execute ReAct loop step by step.",
          tools: registry.list().map(t => ({
            name: t.id,
            description: t.description,
            parameters: (t.inputSchema as Record<string, unknown>) || { type: "object", properties: {} },
          })),
        });

        if (turn.functionCall) {
          sendSSE("trace", { stage: "execute", detail: `Calling tool: ${turn.functionCall.name}` });
          return {
            type: "tool_call" as const,
            toolId: turn.functionCall.name,
            arguments: turn.functionCall.args,
          };
        }

        return {
          type: "final" as const,
          response: turn.text || "Agent loop completed successfully.",
        };
      },
      registry,
      { maxSteps: 6, maxToolCalls: 6, timeoutMs: 45_000 }
    );

    sendSSE("trace", { stage: "synthesize", detail: "Synthesizing dynamic markdown component breakdown..." });

    const finalResponse = execution.response || synthesizeFallbackResponse(prompt, context, basePlan);

    // Emit dynamic markdown component breakdown card
    sendSSE("markdown_card", {
      type: "agent_breakdown",
      title: "Agentic Loop Execution Summary",
      steps: basePlan.steps,
      toolsUsed: connectedSummaries.map(c => c.connector),
      trace: buildAgentTrace(basePlan),
    });

    // Stream final text tokens
    const chunkSize = 16;
    for (let i = 0; i < finalResponse.length; i += chunkSize) {
      sendSSE("token", { chunk: finalResponse.slice(i, i + chunkSize) });
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    sendSSE("final", {
      text: finalResponse,
      model: `${provider.provider} · ${provider.model}`,
      route: "route_b",
      trace: buildAgentTrace(basePlan),
      plan: basePlan,
    });
  } catch (err) {
    const fallbackText = synthesizeFallbackResponse(prompt, context, basePlan);
    sendSSE("fallback", {
      text: fallbackText,
      error: err instanceof Error ? err.message : "Route B agentic execution failed.",
      route: "route_b_fallback",
    });
  }
}

/** Express route handler for /api/chat */
export async function handleApiChatRoute(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  const { prompt, context, userId, model, agenticMode } = req.body || {};

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    res.status(400).json({ error: "Prompt string is required." });
    return;
  }

  // Setup Server-Sent Events (SSE) headers
  res.setHeader("content-type", "text/event-stream");
  res.setHeader("cache-control", "no-cache, no-transform");
  res.setHeader("connection", "keep-alive");
  res.setHeader("x-accel-buffering", "no");

  const sendSSE = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const connectedSummaries = userId ? await listConnectorCredentials(Number(userId)) : [];
  const intent = analyzePromptIntent(prompt, connectedSummaries.length > 0, Boolean(agenticMode));

  sendSSE("intent", intent);

  if (intent.route === "route_a") {
    await executeRouteAStream(prompt, context, userId ? Number(userId) : undefined, model, sendSSE);
  } else {
    await executeRouteBLoop(prompt, context, userId ? Number(userId) : undefined, model, sendSSE);
  }

  res.end();
}

/** Standard Web / Vercel POST route handler export */
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const { prompt, context, userId, model, agenticMode } = body || {};

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return new Response(JSON.stringify({ error: "Prompt string is required." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendSSE = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const connectedSummaries = userId ? await listConnectorCredentials(Number(userId)) : [];
      const intent = analyzePromptIntent(prompt, connectedSummaries.length > 0, Boolean(agenticMode));

      sendSSE("intent", intent);

      if (intent.route === "route_a") {
        await executeRouteAStream(prompt, context, userId ? Number(userId) : undefined, model, sendSSE);
      } else {
        await executeRouteBLoop(prompt, context, userId ? Number(userId) : undefined, model, sendSSE);
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
