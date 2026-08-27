import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { deleteProviderCredential, getProviderCredentialById, getProviderCredentialForRequest, listProviderCredentials, providerCatalog, upsertProviderCredential } from "./providerDb";
import { invokeUserProvider } from "./providerAdapters";
import { getWorkspaceSettings, updateWorkspaceSettings } from "./settingsDb";
import { runAgentCore } from "./agentCore";
import { integrations } from "@shared/integrations";
import { executeConnectorAction } from "./connectorAdapters";
import { approveRequest, completeRequest, createApprovalRequest, deleteConnectorCredential, getApprovalRequest, getConnectorCredential, listConnectorCredentials, saveConnectorCredential, type ConnectorAction, type ConnectorId } from "./connectorDb";

export async function executeHannaRequest(prompt: string, context?: string, userId?: number) {
  return runAgentCore(prompt, context, async ({ context: requestContext, plan }) => {
    if (!userId) throw new Error("No authenticated provider owner");
    const personalProvider = await getProviderCredentialForRequest(userId, prompt);
    if (!personalProvider) throw new Error("No user-owned provider configured");
    const text = await invokeUserProvider({ ...personalProvider, prompt: `${plan.steps.join("\n") }\n\n${prompt}`, context: requestContext });
    return { text, model: `${personalProvider.provider} · ${personalProvider.model}` };
  });
}

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
  }),
  providers: router({
    catalog: publicProcedure.query(() => providerCatalog),
    list: protectedProcedure.query(({ ctx }) => listProviderCredentials(ctx.user.id)),
    save: protectedProcedure.input(z.object({ provider: z.string().min(1), displayName: z.string().min(1).max(120), apiKey: z.string().min(8).max(4000), endpoint: z.string().url().max(255).optional() })).mutation(({ ctx, input }) => upsertProviderCredential(ctx.user.id, input.provider, input.displayName, input.apiKey, input.endpoint)),
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
    saveCredential: protectedProcedure.input(z.object({ connector: z.enum(["shopify", "slack"]), values: z.record(z.string(), z.string().min(1).max(4000)) })).mutation(({ ctx, input }) => saveConnectorCredential(ctx.user.id, input.connector as ConnectorId, input.values)),
    removeCredential: protectedProcedure.input(z.object({ connector: z.enum(["shopify", "slack"]) })).mutation(({ ctx, input }) => deleteConnectorCredential(ctx.user.id, input.connector)),
    previewAction: protectedProcedure.input(z.object({ connector: z.enum(["shopify", "slack"]), action: z.enum(["list_products", "update_product_title", "list_channels", "send_message"]), parameters: z.record(z.string(), z.unknown()) })).mutation(({ ctx, input }) => createApprovalRequest(ctx.user.id, input as ConnectorAction)),
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
  settings: router({
    get: protectedProcedure.query(({ ctx }) => getWorkspaceSettings(ctx.user.id)),
    update: protectedProcedure.input(z.object({ theme: z.enum(["light", "dark"]).optional(), defaultProvider: z.string().max(64).optional(), autoRouting: z.boolean().optional() })).mutation(({ ctx, input }) => updateWorkspaceSettings(ctx.user.id, input)),
  }),
  hanna: router({
    ask: publicProcedure.input(z.object({ prompt: z.string().min(1).max(6000), context: z.string().optional() })).mutation(({ ctx, input }) => executeHannaRequest(input.prompt, input.context, ctx.user?.id)),
  }),
});

export type AppRouter = typeof appRouter;
