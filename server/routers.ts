import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { routeHannaRequest } from "./hannaRouting";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { deleteProviderCredential, getProviderCredentialById, getProviderCredentialForRequest, listProviderCredentials, providerCatalog, upsertProviderCredential } from "./providerDb";
import { invokeUserProvider } from "./providerAdapters";
import { getWorkspaceSettings, updateWorkspaceSettings } from "./settingsDb";

export async function executeHannaRequest(prompt: string, context?: string, userId?: number, llm: typeof invokeLLM = invokeLLM) {
  const route = routeHannaRequest(prompt);
  try {
    if (userId) {
      const personalProvider = await getProviderCredentialForRequest(userId, prompt);
      if (personalProvider) {
        try {
          const text = await invokeUserProvider({ ...personalProvider, prompt, context });
          return { text, model: `${personalProvider.provider} · ${personalProvider.model}`, capability: route.capability };
        } catch {
          return { text: "Your connected provider could not complete this request. Check its API key in Settings and try again.", model: `${personalProvider.provider} · connected`, capability: route.capability };
        }
      }
    }
    const response = await llm({
      model: route.model,
      messages: [
        { role: "system", content: "You are Hanna, a concise and capable agentic AI workspace orchestrator. Answer clearly in Markdown. Never reveal private chain-of-thought. Keep responses practical and under 350 words." },
        { role: "user", content: context ? `Workspace context: ${context}\n\nUser request: ${prompt}` : prompt },
      ],
    });
    const content = response.choices?.[0]?.message?.content;
    return { text: typeof content === "string" ? content : "I’m ready to help. Could you rephrase that request?", model: route.model, capability: route.capability };
  } catch {
    return { text: "I’m unable to reach the selected model right now. Your request is safe—please try again in a moment.", model: route.model, capability: route.capability };
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
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
  settings: router({
    get: protectedProcedure.query(({ ctx }) => getWorkspaceSettings(ctx.user.id)),
    update: protectedProcedure.input(z.object({ theme: z.enum(["light", "dark"]).optional(), defaultProvider: z.string().max(64).optional(), autoRouting: z.boolean().optional() })).mutation(({ ctx, input }) => updateWorkspaceSettings(ctx.user.id, input)),
  }),
  hanna: router({
    ask: publicProcedure
      .input(z.object({ prompt: z.string().min(1).max(6000), context: z.string().optional() }))
      .mutation(({ ctx, input }) => executeHannaRequest(input.prompt, input.context, ctx.user?.id)),
  }),
});

export type AppRouter = typeof appRouter;
