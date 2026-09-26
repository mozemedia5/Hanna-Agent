import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
// TEMP: full file restored in follow-up if truncated
export const appRouter = router({});
export type AppRouter = typeof appRouter;
