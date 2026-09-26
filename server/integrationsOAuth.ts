import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  CONNECTOR_TO_OAUTH,
  isOAuthConfigured,
  type OAuthProviderId,
} from "./oauthProviders";

/** Build OAuth start URL for a signed-in user */
export function buildStartOAuthResult(
  userId: number,
  connector: string,
  shop?: string
) {
  const provider = CONNECTOR_TO_OAUTH[connector] as OAuthProviderId | undefined;
  if (!provider) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${connector} does not support browser OAuth. Use API key or MCP credentials instead.`,
    });
  }
  if (!isOAuthConfigured(provider)) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `${provider} OAuth is not configured on the server. Set the client ID and secret environment variables.`,
    });
  }
  if (provider === "shopify" && !shop?.includes(".myshopify.com")) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Shopify OAuth requires shop domain (e.g. your-store.myshopify.com).",
    });
  }
  const params = new URLSearchParams({
    connector,
    userId: String(userId),
  });
  if (shop) params.set("shop", shop.trim().toLowerCase());
  return {
    provider,
    url: `/api/oauth/${provider}/start?${params.toString()}`,
  };
}

export function getOAuthStatusMap() {
  const providers = [
    "google",
    "github",
    "slack",
    "meta",
    "shopify",
    "x",
    "tiktok",
  ] as const;
  return Object.fromEntries(
    providers.map(id => [id, isOAuthConfigured(id as OAuthProviderId)])
  );
}

export const startOAuthInput = z.object({
  connector: z.string().min(1),
  shop: z.string().optional(),
});
