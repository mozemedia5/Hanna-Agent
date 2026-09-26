/**
 * Express OAuth routes (production):
 *   GET /api/oauth/:provider/start
 *   GET /api/oauth/:provider/callback
 *   GET /api/oauth/status
 *
 * Security:
 * - Never trust userId from query/body/callback URL.
 * - Identity comes only from signed OAuth state (bound at start to authenticated user)
 *   or from Firebase Bearer token on /start.
 */
import type { Express, Request, Response } from "express";
import {
  buildAuthorizeUrl,
  buildRedirectUri,
  CONNECTOR_TO_OAUTH,
  createOAuthState,
  exchangeCodeForTokens,
  generatePkce,
  getAppBaseUrl,
  isOAuthConfigured,
  parseOAuthState,
  type OAuthProviderId,
} from "./oauthProviders";
import { saveConnectorCredential } from "./connectorDb";
import type { ConnectorId } from "../shared/integrations";
import { parseAndVerifyFirebaseToken } from "./_core/context";
import { getUserByOpenId } from "./db";

const VALID_PROVIDERS: OAuthProviderId[] = [
  "google",
  "github",
  "slack",
  "meta",
  "shopify",
  "x",
  "tiktok",
];

/** Nonces already used (replay protection). In multi-instance prod prefer Redis/Firestore. */
const usedNonces = new Set<string>();
const NONCE_TTL_MS = 20 * 60 * 1000;
const nonceTimestamps = new Map<string, number>();

function rememberNonce(nonce: string): boolean {
  const now = Date.now();
  nonceTimestamps.forEach((t, n) => {
    if (now - t > NONCE_TTL_MS) {
      nonceTimestamps.delete(n);
      usedNonces.delete(n);
    }
  });
  if (usedNonces.has(nonce)) return false;
  usedNonces.add(nonce);
  nonceTimestamps.set(nonce, now);
  return true;
}

function parseProvider(raw: string): OAuthProviderId | null {
  return VALID_PROVIDERS.includes(raw as OAuthProviderId)
    ? (raw as OAuthProviderId)
    : null;
}

function deriveUserId(uid: string): number {
  let hash = 0;
  for (let i = 0; i < uid.length; i += 1) {
    hash = ((hash << 5) - hash + uid.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

/**
 * Resolve authenticated user from Firebase Bearer token only.
 * Never trusts query.userId / body.userId.
 */
async function resolveAuthenticatedUserId(req: Request): Promise<number | null> {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const decoded = parseAndVerifyFirebaseToken(token);
  const uid = decoded?.user_id || decoded?.sub;
  if (!uid || typeof uid !== "string") return null;
  const dbUser = await getUserByOpenId(uid).catch(() => undefined);
  if (dbUser?.id) return dbUser.id;
  return deriveUserId(uid);
}

export function registerOAuthRoutes(app: Express): void {
  app.get("/api/oauth/:provider/start", async (req, res) => {
    try {
      const providerId = parseProvider(req.params.provider);
      if (!providerId) {
        return res.status(400).json({ error: "Unknown OAuth provider.", code: "VALIDATION_ERROR" });
      }
      if (!isOAuthConfigured(providerId)) {
        return res.status(503).json({
          error: `${providerId} OAuth is not configured. Set client ID and secret env vars in Vercel.`,
          code: "NOT_CONFIGURED",
        });
      }

      const userId = await resolveAuthenticatedUserId(req);
      if (!userId) {
        return res.status(401).json({
          error: "Sign in required before connecting an account.",
          code: "AUTH_REQUIRED",
        });
      }

      const connector =
        (typeof req.query.connector === "string" && req.query.connector) ||
        providerId;
      const mapped = CONNECTOR_TO_OAUTH[connector];
      if (mapped && mapped !== providerId) {
        return res.status(400).json({
          error: `Connector "${connector}" is authorized via ${mapped}, not ${providerId}.`,
          code: "VALIDATION_ERROR",
        });
      }

      let shop: string | undefined;
      if (providerId === "shopify") {
        shop =
          typeof req.query.shop === "string"
            ? req.query.shop.trim().toLowerCase()
            : undefined;
        if (!shop || !shop.includes(".myshopify.com")) {
          return res.status(400).json({
            error: "Shopify requires ?shop=your-store.myshopify.com",
            code: "VALIDATION_ERROR",
          });
        }
      }

      let codeVerifier: string | undefined;
      let codeChallenge: string | undefined;
      if (providerId === "x" || providerId === "tiktok") {
        const pkce = generatePkce();
        codeVerifier = pkce.codeVerifier;
        codeChallenge = pkce.codeChallenge;
      }

      const state = createOAuthState({
        provider: providerId,
        connector,
        userId,
        shop,
        codeVerifier,
      });
      const baseUrl = getAppBaseUrl(req);
      const redirectUri = buildRedirectUri(providerId, baseUrl);
      const authorizeUrl = buildAuthorizeUrl({
        providerId,
        state,
        redirectUri,
        shop,
        codeChallenge,
      });
      return res.redirect(302, authorizeUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "OAuth start failed";
      return res.status(500).json({ error: message, code: "PROVIDER_ERROR" });
    }
  });

  app.get("/api/oauth/:provider/callback", async (req, res) => {
    const baseUrl = getAppBaseUrl(req);
    const uiReturn = `${baseUrl}/?page=integrations&oauth=`;
    try {
      const providerId = parseProvider(req.params.provider);
      if (!providerId) {
        return res.redirect(`${uiReturn}error&reason=unknown_provider`);
      }
      if (typeof req.query.error === "string") {
        const desc =
          typeof req.query.error_description === "string"
            ? req.query.error_description
            : req.query.error;
        return res.redirect(
          `${uiReturn}error&reason=${encodeURIComponent(String(desc))}`
        );
      }
      const code = req.query.code;
      const stateRaw = req.query.state;
      if (typeof code !== "string" || typeof stateRaw !== "string") {
        return res.redirect(`${uiReturn}error&reason=missing_code_or_state`);
      }

      const state = parseOAuthState(stateRaw);
      if (!state || state.provider !== providerId) {
        return res.redirect(`${uiReturn}error&reason=invalid_state`);
      }
      if (!state.userId || typeof state.userId !== "number") {
        return res.redirect(`${uiReturn}error&reason=invalid_state_user`);
      }
      if (!rememberNonce(state.nonce)) {
        return res.redirect(`${uiReturn}error&reason=state_replay`);
      }

      const redirectUri = buildRedirectUri(providerId, baseUrl);
      const tokens = await exchangeCodeForTokens({
        providerId,
        code,
        redirectUri,
        codeVerifier: state.codeVerifier,
        shop: state.shop,
      });

      if (!tokens.accessToken) {
        return res.redirect(`${uiReturn}error&reason=no_access_token`);
      }

      const expiresAt =
        tokens.expiresIn != null
          ? String(Date.now() + tokens.expiresIn * 1000)
          : "";
      const values: Record<string, string> = {
        connectionMode: "oauth",
        oauth_authenticated: "true",
        access_token: tokens.accessToken,
        token_type: tokens.tokenType || "Bearer",
        provider: providerId,
      };
      if (tokens.refreshToken) values.refresh_token = tokens.refreshToken;
      if (tokens.scope) values.scope = tokens.scope;
      if (expiresAt) values.expires_at = expiresAt;
      if (tokens.extras) {
        for (const [k, v] of Object.entries(tokens.extras)) {
          if (v) values[k] = v;
        }
      }
      if (state.shop) {
        values.shop = state.shop;
        values.storeDomain = state.shop;
      }
      if (providerId === "slack") {
        values.botToken = tokens.accessToken;
      }
      values.accessToken = tokens.accessToken;

      await saveConnectorCredential(
        state.userId,
        state.connector as ConnectorId,
        values
      );

      if (providerId === "google") {
        for (const id of [
          "google-workspace",
          "google-drive",
          "google-docs",
          "google-sheets",
          "google-slides",
          "gmail",
          "google-calendar",
        ]) {
          if (id === state.connector) continue;
          try {
            await saveConnectorCredential(state.userId, id as ConnectorId, {
              ...values,
              linked_from: state.connector,
            });
          } catch {
            /* best-effort linked connectors */
          }
        }
      }

      return res.redirect(
        `${uiReturn}success&connector=${encodeURIComponent(state.connector)}&provider=${providerId}`
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "oauth_callback_failed";
      return res.redirect(
        `${uiReturn}error&reason=${encodeURIComponent(message)}`
      );
    }
  });

  app.get("/api/oauth/status", (_req, res) => {
    const status = Object.fromEntries(
      VALID_PROVIDERS.map(id => [id, isOAuthConfigured(id)])
    );
    res.json({ providers: status });
  });
}
