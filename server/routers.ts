import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { routeHannaRequest } from "./hannaRouting";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export async function executeHannaRequest(prompt: string, context?: string, llm: typeof invokeLLM = invokeLLM) {
  const route = routeHannaRequest(prompt);
  try {
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
  hanna: router({
    ask: publicProcedure
      .input(z.object({ prompt: z.string().min(1).max(6000), context: z.string().optional() }))
      .mutation(({ input }) => executeHannaRequest(input.prompt, input.context)),
  }),
});

export type AppRouter = typeof appRouter;
