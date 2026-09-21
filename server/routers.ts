import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  deleteProviderCredential,
  getProviderCredentialById,
  getProviderCredentialForRequest,
  listProviderCredentials,
  providerCatalog,
  upsertProviderCredential,
} from "./providerDb";
import {
  invokeGeminiAgentTurn,
  invokeUserProvider,
  type ProviderToolDefinition,
} from "./providerAdapters";
import { getWorkspaceSettings, updateWorkspaceSettings } from "./settingsDb";
import {
  buildAgentPlan,
  buildAgentTrace,
  createDefaultToolRegistry,
  DynamicToolRegistry,
  runAgentLoop,
  synthesizeFallbackResponse,
  taskScheduler,
  type AgentTool,
} from "./agentCore";
import { integrations } from "../shared/integrations";
import { executeConnectorAction } from "./connectorAdapters";
import {
  approveRequest,
  completeRequest,
  createApprovalRequest,
  deleteConnectorCredential,
  getApprovalRequest,
  getConnectorCredential,
  listConnectorCredentials,
  saveConnectorCredential,
  type ConnectorAction,
  type ConnectorCredential,
  type ConnectorId,
} from "./connectorDb";
import {
  deleteConversation,
  getAnalytics,
  getProfile,
  listConversations,
  saveConversation,
  saveProfile,
} from "./firestore";
import { consumeDailyTokens, getDailyQuota, type HannaTier } from "./usage";
import { performAiHealthCheck } from "./aiHealth";
import { analyzePromptIntent } from "../api/chat/route";
import {
  getWorkspaceContributors,
  inviteContributor,
  removeContributor,
  shareChatWithContributors,
  updateContributorCredits,
} from "./contributorsDb";

import { TRPCError } from "@trpc/server";

type AgentConnectorTool = {
  connector: ConnectorId;
  action: string;
  description: string;
  parameters: Record<string, unknown>;
  requiresApproval: boolean;
};

const REAL_CONNECTOR_TOOLS: AgentConnectorTool[] = [
  { connector: "shopify", action: "list_products", description: "List products from the connected Shopify Admin API.", parameters: { type: "object", properties: { first: { type: "number", description: "Maximum number of products." }, query: { type: "string", description: "Optional Shopify search query." } } }, requiresApproval: false },
  { connector: "shopify", action: "search_products", description: "Search products in the connected Shopify Admin API.", parameters: { type: "object", properties: { first: { type: "number" }, query: { type: "string" } } }, requiresApproval: false },
  { connector: "shopify", action: "get_product", description: "Retrieve a Shopify product by its GraphQL ID.", parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }, requiresApproval: false },
  { connector: "shopify", action: "best_sellers", description: "Retrieve Shopify products for best-seller analysis.", parameters: { type: "object", properties: { first: { type: "number" }, query: { type: "string" } } }, requiresApproval: false },
  { connector: "shopify", action: "low_inventory", description: "Find Shopify products below an inventory threshold.", parameters: { type: "object", properties: { first: { type: "number" }, inventoryThreshold: { type: "number" } } }, requiresApproval: false },
  { connector: "shopify", action: "update_product_title", description: "Update a Shopify product title after explicit user confirmation.", parameters: { type: "object", properties: { productId: { type: "string" }, title: { type: "string" } }, required: ["productId", "title"] }, requiresApproval: true },
  { connector: "slack", action: "list_channels", description: "List channels from the connected Slack workspace.", parameters: { type: "object", properties: { limit: { type: "number" } } }, requiresApproval: false },
  { connector: "slack", action: "send_message", description: "Send a Slack message after explicit user confirmation.", parameters: { type: "object", properties: { channel: { type: "string" }, text: { type: "string" }, threadTs: { type: "string" } }, required: ["channel", "text"] }, requiresApproval: true },
  { connector: "google-workspace", action: "workspace_search", description: "Search across Google Workspace files, documents, sheets, and calendar.", parameters: { type: "object", properties: { query: { type: "string", description: "Search query or item title" } } }, requiresApproval: false },
  { connector: "google-drive", action: "drive_search", description: "Search, organize, and manage files in Google Drive.", parameters: { type: "object", properties: { query: { type: "string", description: "Search query or file name" } } }, requiresApproval: false },
  { connector: "google-docs", action: "docs_read", description: "Read, edit, or summarize document content in Google Docs.", parameters: { type: "object", properties: { title: { type: "string", description: "Document title or ID" } } }, requiresApproval: false },
  { connector: "google-sheets", action: "sheets_analyze", description: "Query and analyze tabular data rows in Google Sheets.", parameters: { type: "object", properties: { query: { type: "string", description: "Spreadsheet query or tab name" } } }, requiresApproval: false },
  { connector: "google-slides", action: "slides_read", description: "Retrieve presentation deck slides and speaker notes in Google Slides.", parameters: { type: "object", properties: { title: { type: "string", description: "Presentation title" } } }, requiresApproval: false },
  { connector: "google-ads", action: "ads_campaigns", description: "Fetch campaign metrics and performance reporting from Google Ads.", parameters: { type: "object", properties: { query: { type: "string", description: "Campaign name or date range" } } }, requiresApproval: false },
  { connector: "gmail", action: "mail_search", description: "Find relevant emails and threads in Gmail.", parameters: { type: "object", properties: { query: { type: "string", description: "Search query or sender filter" } } }, requiresApproval: false },
  { connector: "gmail", action: "mail_send", description: "Draft and send an email response via Gmail.", parameters: { type: "object", properties: { to: { type: "string", description: "Recipient email address" }, subject: { type: "string", description: "Email subject line" }, body: { type: "string", description: "Email body text" } }, required: ["to", "subject", "body"] }, requiresApproval: true },
  { connector: "google-calendar", action: "calendar_read", description: "Check availability and upcoming events on Google Calendar.", parameters: { type: "object", properties: { query: { type: "string", description: "Filter query or date range" } } }, requiresApproval: false },
  { connector: "google-calendar", action: "calendar_write", description: "Schedule a new meeting or event on Google Calendar.", parameters: { type: "object", properties: { summary: { type: "string", description: "Event title" }, startTime: { type: "string", description: "ISO start datetime string" }, endTime: { type: "string", description: "ISO end datetime string" } }, required: ["summary"] }, requiresApproval: true },
];

function buildConnectedAgentRegistry(credentials: ConnectorCredential[]): DynamicToolRegistry {
  const registry = createDefaultToolRegistry();
  for (const definition of REAL_CONNECTOR_TOOLS) {
    if (!credentials.some(credential => credential.connector === definition.connector)) continue;
    const toolId = `connector_${definition.connector}_${definition.action}`;
    registry.register({
      id: toolId,
      label: `${definition.connector} ${definition.action.replaceAll("_", " ")}`,
      description: definition.description,
      category: "connector",
      provider: definition.connector,
      capabilities: [definition.action],
      inputSchema: definition.parameters,
      requiresApproval: definition.requiresApproval,
      scopes: [`${definition.connector}:${definition.action}`],
      riskLevel: definition.requiresApproval ? "high" : "low",
      availability: "available",
      readOnly: !definition.requiresApproval,
      mutatesData: definition.requiresApproval,
      execute: async (arguments_) => {
        const credential = credentials.find(item => item.connector === definition.connector);
        if (!credential) throw new Error(`${definition.connector} is not connected.`);
        return executeConnectorAction(credential, {
          connector: definition.connector,
          action: definition.action,
          parameters: arguments_,
        } as ConnectorAction);
      },
    });
  }
  return registry;
}

function providerToolDefinitions(registry: DynamicToolRegistry): ProviderToolDefinition[] {
  return registry.list()
    .filter(tool => Boolean(tool.execute))
    .map(tool => ({
      name: tool.id,
      description: tool.description,
      parameters: (tool.inputSchema ?? { type: "object", properties: {} }) as Record<string, unknown>,
    }));
}

export async function executeHannaRequest(
  prompt: string,
  context?: string,
  userId?: number,
  requestedModel?: string,
  clientIp?: string,
  agenticModeInput: boolean = false
) {
  const connectedSummariesForIntent = userId ? await listConnectorCredentials(userId) : [];
  const intent = analyzePromptIntent(prompt, connectedSummariesForIntent.length > 0, agenticModeInput);
  const agenticMode = intent.route === "route_b";

  if (agenticMode) {
    const approvalPlan = buildAgentPlan(prompt);
    if (approvalPlan.approvalRequired) {
      return {
        text: "I prepared the requested external action, but I need your approval before changing an external system.",
        model: approvalPlan.route.model,
        capability: approvalPlan.route.capability,
        plan: approvalPlan,
        trace: buildAgentTrace(approvalPlan),
        responseType: "MODEL_RESPONSE" as const,
      };
    }
    try {
      const provider = await getProviderCredentialForRequest(
        userId,
        prompt,
        requestedModel
      );
      const tier: HannaTier = requestedModel === "Hanna Pro" ? "pro" : "lite";
      const quotaKey = userId ? String(userId) : `anon_${clientIp || "guest"}`;
      const quota = consumeDailyTokens(quotaKey, Math.ceil(prompt.length / 4), tier);
      if (!quota.allowed) {
        throw new Error(
          userId
            ? `Daily ${tier === "pro" ? "Hanna Pro" : "Hanna Lite"} token limit reached. Connect your own model to continue. Your allowance refreshes at ${quota.resetAt}.`
            : `Daily token limit reached for unauthenticated requests. Sign in or connect your own provider key to continue. Allowance refreshes at ${quota.resetAt}.`
        );
      }
      if (!provider.apiKey) {
        throw new Error(
          "Hanna’s default Gemini API key is not configured. Check its API key in Settings or environment variables."
        );
      }

      const connectedSummaries = userId ? await listConnectorCredentials(userId) : [];
      const connectedCredentials = userId
        ? (await Promise.all(
            connectedSummaries.map(summary => getConnectorCredential(userId, summary.connector))
          )).filter((credential): credential is ConnectorCredential => Boolean(credential))
        : [];
      const registry = buildConnectedAgentRegistry(connectedCredentials);
      const basePlan = buildAgentPlan(prompt);
      const enrichedContext = [
        context?.trim(),
        connectedSummaries.length
          ? `[Connected plugins: ${connectedSummaries.map(item => item.connector).join(", ")}]`
          : "[Connected plugins: none]",
        "[Execution policy: only tools exposed by a connected, implemented adapter may run. Unimplemented catalog entries are never reported as executed.]",
      ].filter(Boolean).join("\\n\\n");

      const execution = await runAgentLoop(
        {
          userMessage: prompt,
          history: context ? [context] : [],
          requestId: `hanna_${Date.now()}`,
          userId,
        },
        async state => {
          const toolResults = state.toolResults.length
            ? `\\n\\nVerified tool results:\\n${state.toolResults.map(result => JSON.stringify({ status: result.status, tool: result.metadata.tool, data: result.data, error: result.error })).join("\\n")}`
            : "";
          const turn = await invokeGeminiAgentTurn({
            ...provider,
            prompt: `${prompt}

Agent step ${state.step + 1}. Choose one available tool only when it is required. After verified results are available, synthesize the final answer. Do not claim an external action succeeded unless a verified tool result says it succeeded.${toolResults}`,
            context: enrichedContext,
            tools: providerToolDefinitions(registry),
          });
          if (turn.functionCall) {
            return {
              type: "tool_call" as const,
              toolId: turn.functionCall.name,
              arguments: turn.functionCall.args,
            };
          }
          return {
            type: "final" as const,
            response: turn.text || "I’m ready to help. Could you clarify the outcome you want?",
          };
        },
        registry,
        { maxSteps: 8, maxToolCalls: 6, timeoutMs: 50_000 }
      );

      const waitingForConfirmation = execution.status === "waiting_for_confirmation";
      const responseText = waitingForConfirmation
        ? "I prepared the requested external action, but I need your explicit confirmation before making a change."
        : execution.response || (execution.status === "failed"
          ? "I could not complete the requested tool workflow. No external action was reported as successful."
          : "I completed the requested workflow and verified its tool results.");
      const plan = {
        ...basePlan,
        tools: registry.list(),
        approvalRequired: waitingForConfirmation,
      };
      return {
        text: responseText,
        model: `${provider.provider} · ${provider.model}`,
        capability: basePlan.route.capability,
        plan,
        trace: buildAgentTrace(plan, execution.status === "failed"),
        providerError: false,
        responseType: "MODEL_RESPONSE" as const,
      };
    } catch (error) {
      const fallbackText = synthesizeFallbackResponse(prompt, context);
      return {
        text: fallbackText,
        model: "hanna-fallback",
        capability: "Error recovery",
        plan: {
          intent: prompt,
          route: { model: "fallback", capability: "Error", reason: "error" },
          tools: [],
          approvalRequired: false,
          steps: [],
        },
        trace: [],
        providerError: true,
        responseType: "PROVIDER_ERROR" as const,
      };
    }
  }

  // Normal Direct Chat Mode
  try {
    const provider = await getProviderCredentialForRequest(
      userId,
      prompt,
      requestedModel
    );

    // Auto-select connected connector tools for user if connected, even if not explicitly invoked in prompt
    if (userId) {
      const connectedConnectors = await listConnectorCredentials(userId);
      if (connectedConnectors.length > 0) {
        // Automatically inject capabilities into prompt context
        const autoConnectorList = connectedConnectors
          .map(c => {
            const def = integrations.find(i => i.id === c.connector);
            return `${c.connector} (${def?.name || c.connector}): ${def?.capabilities.join(", ") || "Active"}`;
          })
          .join("; ");
        context = context
          ? `${context}\n\n[Auto-Selected Active Connectors & Tools: ${autoConnectorList}]`
          : `[Auto-Selected Active Connectors & Tools: ${autoConnectorList}]`;
      }
    }

    const tier: HannaTier = requestedModel === "Hanna Pro" ? "pro" : "lite";
    const quotaKey = userId ? String(userId) : `anon_${clientIp || "guest"}`;
    const quota = consumeDailyTokens(
      quotaKey,
      Math.ceil(prompt.length / 4),
      tier
    );

    if (!quota.allowed) {
      throw new Error(
        userId
          ? `Daily ${tier === "pro" ? "Hanna Pro" : "Hanna Lite"} token limit reached. Connect your own model to continue. Your allowance refreshes at ${quota.resetAt}.`
          : `Daily token limit reached for unauthenticated requests. Sign in or connect your own provider key to continue. Allowance refreshes at ${quota.resetAt}.`
      );
    }
    if (!provider.apiKey)
      throw new Error(
        "Hanna’s default Gemini API key is not configured. Check its API key in Settings or environment variables."
      );

    let enrichedContext = context || "";
    if (userId) {
      const connectedProviders = await listProviderCredentials(userId);
      const connectedConnectors = await listConnectorCredentials(userId);
      const userProfile = await getProfile(String(userId)).catch(() => null);

      const providerNames = connectedProviders.map(
        p => p.displayName || p.provider
      );
      const connectorSummaries = connectedConnectors.map(c => {
        const def = integrations.find(i => i.id === c.connector);
        return `${c.connector}${def ? ` [Capabilities: ${def.capabilities.join(", ")}]` : ""}`;
      });
      const extraLines: string[] = [];

      const userName = userProfile?.displayName?.trim() || "User";
      extraLines.push(`[User Display Name: ${userName}]`);

      if (userProfile?.customInstructions?.trim()) {
        extraLines.push(`[User Personalization Instructions: ${userProfile.customInstructions.trim()}]`);
      }

      if (providerNames.length > 0 || connectorSummaries.length > 0) {
        extraLines.push(
          `[Active Capabilities & Connected Plugin Tools:\n- Connected AI Provider Keys: ${providerNames.length > 0 ? providerNames.join(", ") : "None"}\n- Active Connected Plugins & Tools: ${connectorSummaries.length > 0 ? connectorSummaries.join("; ") : "None"}]`
        );
      }

      if (extraLines.length > 0) {
        const extraSummary = extraLines.join("\n\n");
        enrichedContext = enrichedContext
          ? `${enrichedContext}\n\n${extraSummary}`
          : extraSummary;
      }
    }

    const text = await invokeUserProvider({
      ...provider,
      prompt,
      context: enrichedContext,
    });
    return {
      text,
      model: `${provider.provider} · ${provider.model}`,
      providerError: false,
    };
  } catch (error) {
    const fallbackText = synthesizeFallbackResponse(prompt, context);
    return {
      text: fallbackText,
      model: requestedModel === "Hanna Pro" ? "gemini-3.5-flash" : "gemini-3.5-flash",
      providerError: true,
    };
  }
}

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
  }),
  providers: router({
    catalog: publicProcedure.query(() => providerCatalog),
    list: protectedProcedure.query(({ ctx }) =>
      listProviderCredentials(ctx.user.id)
    ),
    save: protectedProcedure
      .input(
        z.object({
          provider: z.string().min(1),
          displayName: z.string().min(1).max(120),
          apiKey: z.string().min(1).max(4000),
          endpoint: z.string().url().max(255).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        upsertProviderCredential(
          ctx.user.id,
          input.provider,
          input.displayName,
          input.apiKey,
          input.endpoint
        )
      ),
    remove: protectedProcedure
      .input(z.object({ provider: z.string().min(1) }))
      .mutation(({ ctx, input }) =>
        deleteProviderCredential(ctx.user.id, input.provider)
      ),
    testConnection: protectedProcedure
      .input(z.object({ provider: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const credential = await getProviderCredentialById(
          ctx.user.id,
          input.provider
        );
        if (!credential)
          return { success: false, message: "Connect this provider first." };
        try {
          await invokeUserProvider({
            ...credential,
            prompt: "Reply with the single word OK.",
          });
          return { success: true, message: "Provider responded successfully." };
        } catch {
          return {
            success: false,
            message: "The provider rejected the key or endpoint.",
          };
        }
      }),
  }),
  integrations: router({
    catalog: publicProcedure.query(() => integrations),
    listCredentials: protectedProcedure.query(({ ctx }) =>
      listConnectorCredentials(ctx.user.id)
    ),
    saveCredential: protectedProcedure
      .input(
        z.object({
          connector: z.string().min(1),
          values: z.record(z.string(), z.string().min(1).max(4000)),
        })
      )
      .mutation(({ ctx, input }) =>
        saveConnectorCredential(
          ctx.user.id,
          input.connector as ConnectorId,
          input.values
        )
      ),
    removeCredential: protectedProcedure
      .input(z.object({ connector: z.string().min(1) }))
      .mutation(({ ctx, input }) =>
        deleteConnectorCredential(ctx.user.id, input.connector as ConnectorId)
      ),
    previewAction: protectedProcedure
      .input(
        z.object({
          connector: z.string().min(1),
          action: z.string().min(1),
          parameters: z.record(z.string(), z.unknown()),
        })
      )
      .mutation(({ ctx, input }) =>
        createApprovalRequest(ctx.user.id, input as unknown as ConnectorAction)
      ),
    approveAction: protectedProcedure
      .input(z.object({ approvalId: z.string().min(1) }))
      .mutation(({ ctx, input }) => {
        const request = approveRequest(ctx.user.id, input.approvalId);
        if (!request)
          throw new Error(
            "Approval request is missing, expired, or belongs to another user."
          );
        return {
          approvalId: request.id,
          status: request.status,
          connector: request.action.connector,
          action: request.action.action,
        };
      }),
    executeApproved: protectedProcedure
      .input(z.object({ approvalId: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const request = getApprovalRequest(ctx.user.id, input.approvalId);
        if (!request || request.status !== "approved")
          throw new Error(
            "This action must be explicitly approved before execution."
          );
        const credential = await getConnectorCredential(
          ctx.user.id,
          request.action.connector
        );
        if (!credential)
          throw new Error(
            `Connect ${request.action.connector} in Settings before executing this action.`
          );
        const result = await executeConnectorAction(credential, request.action);
        completeRequest(ctx.user.id, request.id);
        return {
          ...result,
          approvalId: request.id,
          status: "completed" as const,
        };
      }),
  }),
  conversations: router({
    list: protectedProcedure.query(({ ctx }) =>
      listConversations(ctx.user.openId)
    ),
    save: protectedProcedure
      .input(
        z.object({
          id: z.string().min(1).max(100),
          title: z.string().min(1).max(200),
          period: z.string().max(64),
          messages: z
            .array(
              z.object({
                id: z.string(),
                role: z.enum(["user", "assistant"]),
                content: z.string().max(20000),
                time: z.string().optional(),
                tokenCount: z.number().int().nonnegative().optional(),
              })
            )
            .max(200),
        })
      )
      .mutation(({ ctx, input }) => saveConversation(ctx.user.openId, input)),
    remove: protectedProcedure
      .input(z.object({ id: z.string().min(1).max(100) }))
      .mutation(({ ctx, input }) =>
        deleteConversation(ctx.user.openId, input.id)
      ),
  }),
  analytics: router({
    summary: protectedProcedure.query(({ ctx }) =>
      getAnalytics(ctx.user.openId)
    ),
    quota: publicProcedure
      .input(z.object({ model: z.string().optional() }).optional())
      .query(({ ctx, input }) => {
        const tier: HannaTier = input?.model === "Hanna Pro" ? "pro" : "lite";
        const uid = ctx.user?.id ? String(ctx.user.id) : "guest";
        return getDailyQuota(uid, tier);
      }),
  }),
  profile: router({
    get: protectedProcedure.query(({ ctx }) => getProfile(ctx.user.openId)),
    save: protectedProcedure
      .input(
        z.object({
          displayName: z.string().trim().min(1).max(120),
          photoURL: z.string().url().or(z.literal("")),
          bio: z.string().max(500),
          customInstructions: z.string().max(1000).optional(),
        })
      )
      .mutation(({ ctx, input }) => saveProfile(ctx.user.openId, input)),
  }),
  settings: router({
    get: protectedProcedure.query(({ ctx }) =>
      getWorkspaceSettings(ctx.user.id)
    ),
    update: protectedProcedure
      .input(
        z.object({
          theme: z.enum(["light", "dark"]).optional(),
          defaultProvider: z.string().max(64).optional(),
          autoRouting: z.boolean().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        updateWorkspaceSettings(ctx.user.id, input)
      ),
  }),
  contributors: router({
    list: protectedProcedure.query(({ ctx }) =>
      getWorkspaceContributors(String(ctx.user.id))
    ),
    invite: protectedProcedure
      .input(
        z.object({
          email: z.string().email(),
          role: z.enum(["head", "admin", "editor", "viewer"]).optional(),
          monthlyCreditLimit: z.number().int().positive().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        inviteContributor(
          String(ctx.user.id),
          input.email,
          input.role,
          input.monthlyCreditLimit
        )
      ),
    remove: protectedProcedure
      .input(z.object({ contributorId: z.string() }))
      .mutation(({ ctx, input }) =>
        removeContributor(String(ctx.user.id), input.contributorId)
      ),
    updateCredits: protectedProcedure
      .input(z.object({ contributorId: z.string(), credits: z.number() }))
      .mutation(({ ctx, input }) =>
        updateContributorCredits(
          String(ctx.user.id),
          input.contributorId,
          input.credits
        )
      ),
    shareChat: protectedProcedure
      .input(
        z.object({
          chatId: z.string(),
          emails: z.array(z.string().email()),
          permission: z.enum(["read", "write"]).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        shareChatWithContributors(
          String(ctx.user.id),
          input.chatId,
          input.emails,
          ctx.user.email || ctx.user.name || "Owner",
          input.permission
        )
      ),
  }),
  hanna: router({
    ask: publicProcedure
      .input(
        z.object({
          prompt: z.string().min(1).max(6000),
          context: z.string().optional(),
          model: z.string().max(120).optional(),
          agenticMode: z.boolean().optional(),
        })
      )
      .mutation(({ ctx, input }) => {
        if (!ctx.user && input.prompt.length > 2000) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Unauthenticated prompts are limited to 2,000 characters. Sign in to send longer prompts.",
          });
        }
        const clientIp = (
          (ctx.req?.headers?.["x-forwarded-for"] as string) ||
          ctx.req?.socket?.remoteAddress ||
          "guest"
        )
          .split(",")[0]
          .trim();

        return executeHannaRequest(
          input.prompt,
          input.context,
          ctx.user?.id,
          input.model,
          clientIp,
          input.agenticMode
        );
      }),
    healthCheck: publicProcedure
      .input(
        z
          .object({
            model: z.string().optional(),
            provider: z.string().optional(),
          })
          .optional()
      )
      .query(({ ctx, input }) =>
        performAiHealthCheck({
          userId: ctx.user?.id,
          model: input?.model,
          provider: input?.provider,
        })
      ),
    scheduleTask: publicProcedure
      .input(
        z.object({
          title: z.string().min(1).max(300),
          prompt: z.string().min(1).max(20000),
          executionTime: z.string().min(1),
          repeat: z.enum(["once", "daily", "weekly", "monthly"]).default("once"),
          tools: z.array(z.string()).default([]),
        })
      )
      .mutation(({ ctx, input }) => {
        const scheduled = taskScheduler.scheduleTask({
          userId: ctx.user?.id,
          title: input.title,
          description: input.prompt,
          cronOrSchedule: `${input.executionTime} (${input.repeat})`,
          action: "scheduled_agent_run",
          parameters: {
            prompt: input.prompt,
            executionTime: input.executionTime,
            repeat: input.repeat,
            tools: input.tools,
          },
        });
        return { success: true, task: scheduled };
      }),
    executeScheduledTasks: publicProcedure.mutation(async ({ ctx }) => {
      const result = await taskScheduler.runDueTasks(async (task) => {
        const prompt = String(task.parameters?.prompt || task.description || task.title);
        const res = await executeHannaRequest(prompt, "Scheduled Task Execution", task.userId);
        return res.text || "Scheduled task executed successfully.";
      });
      return { success: true, executedCount: result.executedCount };
    }),
    listScheduledTasks: publicProcedure.query(({ ctx }) => {
      const tasks = taskScheduler.listTasks(ctx.user?.id);
      return { tasks };
    }),
  }),
});

export type AppRouter = typeof appRouter;
