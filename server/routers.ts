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

// Full agent loop will be restored in a follow-up; OAuth + integrations are live.

export async function executeHannaRequest(
  prompt: string,
  context?: string,
  userId?: number,
  requestedModel?: string,
  clientIp?: string,
  agenticModeInput: boolean = false
) {
  return {
    text: "Hanna router recovered with OAuth connectors enabled. Full agent loop restore is next.",
    model: "hanna-recovery",
    providerError: false,
  };
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
    ask: publicProcedure
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
          ctx.user?.id,
          input.model,
          undefined,
          input.agenticMode
        )
      ),
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
  }),
});

export type AppRouter = typeof appRouter;
