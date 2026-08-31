import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { deleteProviderCredential, getProviderCredentialById, getProviderCredentialForRequest, listProviderCredentials, providerCatalog, upsertProviderCredential } from "./providerDb";
import { invokeUserProvider } from "./providerAdapters";
import { getWorkspaceSettings, updateWorkspaceSettings } from "./settingsDb";
import { runAgentCore } from "./agentCore";
import { integrations } from "@shared/integrations";
import { executeConnectorAction } from "./connectorAdapters";
import { approveRequest, completeRequest, createApprovalRequest, deleteConnectorCredential, getApprovalRequest, getConnectorCredential, listConnectorCredentials, saveConnectorCredential, type ConnectorAction, type ConnectorId } from "./connectorDb";
import { deleteConversation, getProfile, listConversations, saveConversation, saveProfile } from "./firestore";

export async function executeHannaRequest(prompt: string, context?: string, userId?: number) {
  return runAgentCore(prompt, context, async ({ context: requestContext, plan }) => {
    const personalProvider = userId ? await getProviderCredentialForRequest(userId, prompt) : undefined;
    const apiKey = personalProvider?.apiKey || process.env.HANNA_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("Hanna’s default Gemini key is not configured yet.");
    const provider = personalProvider ?? { provider: "gemini", apiKey, model: process.env.HANNA_GEMINI_MODEL || process.env.GEMINI_MODEL || "gemini-3.7-flash", endpoint: "" };
    const text = await invokeUserProvider({ ...provider, prompt: `${plan.steps.join("\n") }\n\n${prompt}`, context: requestContext });
    return { text, model: `${provider.provider} · ${provider.model}` };
  });
}

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
  }),
  providers: router({
    catalog: publicProcedure.query(() => providerCatalog),
    list: protectedProcedure.query(({ ctx }) => listProviderCredentials(ctx.user.id)),
    save: protectedProcedure.input(z.object({ provider: z.string().min(1), displayName: z.string().min(1).max(120), apiKey: z.string().min(1).max(4000), endpoint: z.string().url().max(255).optional() })).mutation(({ ctx, input }) => upsertProviderCredential(ctx.user.id, input.provider, input.displayName, input.apiKey, input.endpoint)),
    remove: protectedProcedure.input(z.object({ provider: z.string().min(1) })).mutation(({ ctx, input }) => deleteProviderCredential(ctx.user.id, input.provider)),
    testConnection: protectedProcedure.input(z.object({ provider: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const credential = await getProviderCredentialById(ctx.user.id, input.provider);
      if (!credential) return { success: false, message: "Connect this provider first." };
      try {
        await invokeUserProvider({ ...credential, prompt: "Reply with the single word OK." });
        return { success: true, message: "Provider responded successfully." };
      } catch {
        return { success: false, message: "The provider rejected the key or endpoint." };
      }
    }),
  }),
  integrations: router({
    catalog: publicProcedure.query(() => integrations),
    listCredentials: protectedProcedure.query(({ ctx }) => listConnectorCredentials(ctx.user.id)),
    saveCredential: protectedProcedure.input(z.object({ connector: z.string().min(1), values: z.record(z.string(), z.string().min(1).max(4000)) })).mutation(({ ctx, input }) => saveConnectorCredential(ctx.user.id, input.connector as ConnectorId, input.values)),
    removeCredential: protectedProcedure.input(z.object({ connector: z.string().min(1) })).mutation(({ ctx, input }) => deleteConnectorCredential(ctx.user.id, input.connector as ConnectorId)),
    previewAction: protectedProcedure.input(z.object({ connector: z.string().min(1), action: z.string().min(1), parameters: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => createApprovalRequest(ctx.user.id, input as unknown as ConnectorAction)),
    approveAction: protectedProcedure.input(z.object({ approvalId: z.string().min(1) })).mutation(({ ctx, input }) => {
      const request = approveRequest(ctx.user.id, input.approvalId);
      if (!request) throw new Error("Approval request is missing, expired, or belongs to another user.");
      return { approvalId: request.id, status: request.status, connector: request.action.connector, action: request.action.action };
    }),
    executeApproved: protectedProcedure.input(z.object({ approvalId: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const request = getApprovalRequest(ctx.user.id, input.approvalId);
      if (!request || request.status !== "approved") throw new Error("This action must be explicitly approved before execution.");
      const credential = await getConnectorCredential(ctx.user.id, request.action.connector);
      if (!credential) throw new Error(`Connect ${request.action.connector} in Settings before executing this action.`);
      const result = await executeConnectorAction(credential, request.action);
      completeRequest(ctx.user.id, request.id);
      return { ...result, approvalId: request.id, status: "completed" as const };
    }),
  }),
  conversations: router({
    list: protectedProcedure.query(({ ctx }) => listConversations(ctx.user.openId)),
    save: protectedProcedure.input(z.object({ id: z.string().min(1).max(100), title: z.string().min(1).max(200), period: z.string().max(64), messages: z.array(z.object({ id: z.string(), role: z.enum(["user", "assistant"]), content: z.string().max(20000), time: z.string().optional() })).max(200) })).mutation(({ ctx, input }) => saveConversation(ctx.user.openId, input)),
    remove: protectedProcedure.input(z.object({ id: z.string().min(1).max(100) })).mutation(({ ctx, input }) => deleteConversation(ctx.user.openId, input.id)),
  }),
  profile: router({
    get: protectedProcedure.query(({ ctx }) => getProfile(ctx.user.openId)),
    save: protectedProcedure.input(z.object({ displayName: z.string().trim().min(1).max(120), photoURL: z.string().url().or(z.literal("")), bio: z.string().max(500), jobTitle: z.string().max(120) })).mutation(({ ctx, input }) => saveProfile(ctx.user.openId, input)),
  }),
  settings: router({
    get: protectedProcedure.query(({ ctx }) => getWorkspaceSettings(ctx.user.id)),
    update: protectedProcedure.input(z.object({ theme: z.enum(["light", "dark"]).optional(), defaultProvider: z.string().max(64).optional(), autoRouting: z.boolean().optional() })).mutation(({ ctx, input }) => updateWorkspaceSettings(ctx.user.id, input)),
  }),
  hanna: router({
    ask: publicProcedure.input(z.object({ prompt: z.string().min(1).max(6000), context: z.string().optional() })).mutation(({ ctx, input }) => executeHannaRequest(input.prompt, input.context, ctx.user?.id)),
  }),
});

export type AppRouter = typeof appRouter;
