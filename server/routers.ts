import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { deleteProviderCredential, getProviderCredentialById, getProviderCredentialForRequest, listProviderCredentials, providerCatalog, upsertProviderCredential } from "./providerDb";
import { invokeUserProvider } from "./providerAdapters";
import { getWorkspaceSettings, updateWorkspaceSettings } from "./settingsDb";
import { runAgentCore } from "./agentCore";
import { integrations } from "@shared/integrations";

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
  integrations: router({ catalog: publicProcedure.query(() => integrations) }),
  settings: router({
    get: protectedProcedure.query(({ ctx }) => getWorkspaceSettings(ctx.user.id)),
    update: protectedProcedure.input(z.object({ theme: z.enum(["light", "dark"]).optional(), defaultProvider: z.string().max(64).optional(), autoRouting: z.boolean().optional() })).mutation(({ ctx, input }) => updateWorkspaceSettings(ctx.user.id, input)),
  }),
  hanna: router({
    ask: publicProcedure.input(z.object({ prompt: z.string().min(1).max(6000), context: z.string().optional() })).mutation(({ ctx, input }) => executeHannaRequest(input.prompt, input.context, ctx.user?.id)),
  }),
});

export type AppRouter = typeof appRouter;
