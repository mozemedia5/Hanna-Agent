import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { integrations } from "../shared/integrations";
import {
  deleteConnectorCredential,
  listConnectorCredentials,
  saveConnectorCredential,
  createApprovalRequest,
  approveRequest,
  getApprovalRequest,
  getConnectorCredential,
  completeRequest,
  type ConnectorId,
  type ConnectorAction,
} from "./connectorDb";
import { executeConnectorAction } from "./connectorAdapters";
import {
  buildStartOAuthResult,
  getOAuthStatusMap,
  startOAuthInput,
} from "./integrationsOAuth";
import { performAiHealthCheck } from "./aiHealth";
import { getProviderCredentialForRequest } from "./providerDb";
import { invokeUserProvider } from "./providerAdapters";
import { HANNA_UI_MODELS, resolveProviderAndModel } from "./aiConfig";
import {
  consumeDailyTokens,
  estimatePromptCredits,
  getDailyQuota,
  resolveTierFromModel,
  type HannaTier,
} from "./usage";
import { taskScheduler } from "./agentCore";

function resolveApiKeyForProvider(
  provider: string,
  userKey: string
): string {
  if (userKey && userKey.trim()) return userKey.trim();
  if (provider === "gemini") return (process.env.GEMINI_API_KEY || "").trim();
  if (provider === "llama")
    return (
      process.env.GROQ_API_KEY ||
      process.env.LLAMA_API_KEY ||
      ""
    ).trim();
  if (provider === "openai") return (process.env.OPENAI_API_KEY || "").trim();
  if (provider === "anthropic")
    return (process.env.ANTHROPIC_API_KEY || "").trim();
  return "";
}

export async function executeHannaRequest(
  prompt: string,
  context?: string,
  userId?: number,
  requestedModel?: string,
  clientIp?: string,
  _agenticModeInput: boolean = false
) {
  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Please sign in to use Hanna AI.",
    });
  }

  const tier: HannaTier = resolveTierFromModel(requestedModel);
  const cost = estimatePromptCredits(prompt, context);
  const quota = consumeDailyTokens(String(userId), cost, tier);
  if (!quota.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Daily credit limit reached (${quota.used}/${quota.limit}). Resets at ${quota.resetAt}. Upgrade for more credits.`,
    });
  }

  const resolved = resolveProviderAndModel(requestedModel);
  let providerBundle = await getProviderCredentialForRequest(
    userId,
    prompt,
    requestedModel
  );

  // Prefer server GROQ key when Hanna Fast/Advanced/etc. is selected
  if (resolved.provider === "llama") {
    const groqKey = resolveApiKeyForProvider("llama", providerBundle.apiKey);
    providerBundle = {
      provider: "llama",
      apiKey: groqKey,
      model: resolved.model,
      endpoint: providerBundle.endpoint || "",
    };
  } else if (resolved.provider === "gemini") {
    providerBundle = {
      ...providerBundle,
      provider: "gemini",
      apiKey: resolveApiKeyForProvider("gemini", providerBundle.apiKey),
      model: resolved.model,
    };
  }

  if (!providerBundle.apiKey) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        resolved.provider === "llama"
          ? "Hanna Fast models are not configured (missing GROQ_API_KEY)."
          : "Hanna AI is not configured (missing GEMINI_API_KEY).",
    });
  }

  // Inject connected connectors into context so the model can follow up on them
  const connected = await listConnectorCredentials(userId);
  const connectorLine =
    connected.length > 0
      ? `[Connected plugins: ${connected
          .map(c => {
            const def = integrations.find(i => i.id === c.connector);
            return `${c.connector}${def ? ` (${def.capabilities.slice(0, 4).join(", ")})` : ""}`;
          })
          .join("; ")}]`
      : "[Connected plugins: none — ask user to connect tools in Plugins if needed]";

  const enrichedContext = [context?.trim(), connectorLine]
    .filter(Boolean)
    .join("\n\n");

  try {
    const text = await invokeUserProvider({
      provider: providerBundle.provider,
      apiKey: providerBundle.apiKey,
      model: providerBundle.model,
      prompt,
      context: enrichedContext,
      endpoint: providerBundle.endpoint,
    });
    return {
      text,
      model: `${providerBundle.provider} · ${providerBundle.model}`,
      providerError: false,
      credits: {
        used: quota.used,
        limit: quota.limit,
        remaining: quota.remaining,
        tier: quota.tier,
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Provider error";
    return {
      text: `I could not complete that request (${msg}). Please try again or switch model.`,
      model: providerBundle.model,
      providerError: true,
      credits: {
        used: quota.used,
        limit: quota.limit,
        remaining: quota.remaining,
        tier: quota.tier,
      },
    };
  }
}

export const appRouter = router({
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
    startOAuth: protectedProcedure
      .input(startOAuthInput)
      .mutation(({ ctx, input }) =>
        buildStartOAuthResult(ctx.user.id, input.connector, input.shop)
      ),
    oauthStatus: publicProcedure.query(() => getOAuthStatusMap()),
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
        return result;
      }),
  }),
  hanna: router({
    /** Chat requires authentication — no anonymous AI usage */
    ask: protectedProcedure
      .input(
        z.object({
          prompt: z.string().min(1).max(6000),
          context: z.string().optional(),
          model: z.string().max(120).optional(),
          agenticMode: z.boolean().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        executeHannaRequest(
          input.prompt,
          input.context,
          ctx.user.id,
          input.model,
          undefined,
          input.agenticMode
        )
      ),
    models: publicProcedure.query(() => HANNA_UI_MODELS),
    credits: protectedProcedure
      .input(z.object({ model: z.string().optional() }).optional())
      .query(({ ctx, input }) => {
        const tier = resolveTierFromModel(input?.model);
        return getDailyQuota(String(ctx.user.id), tier);
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
    scheduleTask: protectedProcedure
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
          userId: ctx.user.id,
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
    executeScheduledTasks: protectedProcedure.mutation(async ({ ctx }) => {
      const result = await taskScheduler.runDueTasks(async task => {
        const prompt = String(
          task.parameters?.prompt || task.description || task.title
        );
        const res = await executeHannaRequest(
          prompt,
          "Scheduled Task Execution",
          task.userId || ctx.user.id
        );
        return res.text || "Scheduled task executed successfully.";
      });
      return { success: true, executedCount: result.executedCount };
    }),
    listScheduledTasks: protectedProcedure.query(({ ctx }) => ({
      tasks: taskScheduler.listTasks(ctx.user.id),
    })),
  }),
  affiliate: router({
    trackClick: publicProcedure
      .input(z.object({ code: z.string().min(2).max(64) }))
      .mutation(({ input }) => ({
        ok: true,
        code: input.code,
        trackedAt: new Date().toISOString(),
      })),
    getLink: protectedProcedure.query(({ ctx }) => {
      const code = `hn_${ctx.user.id.toString(36)}`;
      const base =
        process.env.APP_BASE_URL ||
        process.env.VERCEL_URL ||
        "https://hanna.ai";
      const origin = base.startsWith("http") ? base : `https://${base}`;
      return {
        code,
        url: `${origin.replace(/\/$/, "")}/?ref=${code}`,
        rewardCredits: 500,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
