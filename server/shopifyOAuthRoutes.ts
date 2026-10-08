import type { Request as ExpressRequest, Response as ExpressResponse } from "express";
import { parseAndVerifyFirebaseToken } from "./_core/context";
import { saveConnectorCredential } from "./connectorDb";
import { SHOPIFY_OAUTH_SCOPES_STRING } from "./shopifyConfig";
import {
  exchangeShopifyCode,
  generateShopifyOAuthState,
  getCanonicalShopifyRedirectUri,
  getShopifyCredentials,
  normalizeShopifyDomain,
  parseShopifyScopes,
  verifyShopifyHmac,
  verifyShopifyOAuthState,
} from "./shopifyOAuth";
import { resolveCanonicalUserId } from "./userResolver";

function appBaseUrl(): string {
  return (process.env.APP_BASE_URL || "https://hanna-agent.vercel.app").replace(/\/$/, "");
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach(cookie => {
    const parts = cookie.split("=");
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      cookies[name] = decodeURIComponent(val);
    }
  });
  return cookies;
}

/** Express handler to initiate Shopify OAuth Authorization Flow (GET /api/oauth/shopify/authorize) */
export async function handleShopifyOAuthAuthorize(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const token = (req.query.id_token as string) || req.headers.authorization?.slice(7);
  const decoded = token ? parseAndVerifyFirebaseToken(token) : null;
  const rawUid = decoded?.user_id || decoded?.sub;

  if (!rawUid) {
    res.status(401).json({ error: "Authentication required to initiate Shopify OAuth connection." });
    return;
  }

  const rawShop = (req.query.shop as string) || (req.query.store as string) || (req.query.storeDomain as string);
  const normShop = normalizeShopifyDomain(rawShop);

  if (!normShop) {
    res.status(400).json({ error: "Invalid or missing Shopify store domain. Must be a valid '*.myshopify.com' hostname." });
    return;
  }

  const { clientId } = getShopifyCredentials();
  if (!clientId) {
    res.status(500).json({ error: "Shopify Client ID is not configured on server (SHOPIFY_CLIENT_ID)." });
    return;
  }

  const canonicalUserId = await resolveCanonicalUserId(rawUid);
  const redirectUri = getCanonicalShopifyRedirectUri();
  const state = generateShopifyOAuthState(canonicalUserId, normShop);

  const authUrl = new URL(`https://${normShop}/admin/oauth/authorize`);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("scope", SHOPIFY_OAUTH_SCOPES_STRING);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  res.setHeader(
    "Set-Cookie",
    `hanna_shopify_oauth_state=${encodeURIComponent(state)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900`
  );

  res.redirect(authUrl.toString());
}

/** Express handler for Shopify OAuth Callback (GET /api/oauth/shopify/callback) */
export async function handleShopifyOAuthCallback(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const code = req.query.code as string;
  const rawShop = req.query.shop as string;
  const stateFromQuery = req.query.state as string;
  const error = req.query.error as string;
  const errorDescription = req.query.error_description as string;

  const cookies = parseCookies(req.headers.cookie);
  const stateFromCookie = cookies["hanna_shopify_oauth_state"];
  const state = stateFromQuery || stateFromCookie;

  if (error) {
    const diagCode = error === "access_denied" ? "access_denied" : "oauth_error";
    res.redirect(`${appBaseUrl()}/integrations?connector_error=${encodeURIComponent(errorDescription || diagCode)}`);
    return;
  }

  if (!code) {
    res.redirect(`${appBaseUrl()}/integrations?connector_error=${encodeURIComponent("missing_code")}`);
    return;
  }

  const normShop = normalizeShopifyDomain(rawShop);
  if (!normShop) {
    res.redirect(`${appBaseUrl()}/integrations?connector_error=${encodeURIComponent("invalid_shop")}`);
    return;
  }

  if (!state) {
    res.redirect(`${appBaseUrl()}/integrations?connector_error=${encodeURIComponent("missing_state")}`);
    return;
  }

  let verification = await verifyShopifyOAuthState(state, normShop);
  if ((!verification.valid || !verification.uid) && stateFromCookie && stateFromCookie !== stateFromQuery) {
    verification = await verifyShopifyOAuthState(stateFromCookie, normShop);
  }

  if (!verification.valid || !verification.uid) {
    const diag = verification.reason || "state_mismatch";
    res.redirect(`${appBaseUrl()}/integrations?connector_error=${encodeURIComponent(diag)}`);
    return;
  }

  const isHmacValid = verifyShopifyHmac(req.query as Record<string, string | string[] | undefined>);
  if (!isHmacValid) {
    res.redirect(`${appBaseUrl()}/integrations?connector_error=${encodeURIComponent("invalid_hmac")}`);
    return;
  }

  const canonicalUserId = await resolveCanonicalUserId(verification.uid);

  try {
    const tokenData = await exchangeShopifyCode(normShop, code);
    const { grantedScopes, missingScopes } = parseShopifyScopes(tokenData.scope);

    const now = Date.now();
    const expiresInSec = Number(tokenData.expires_in || 86400); // Shopify expiring token default
    const expiresAtMs = now + expiresInSec * 1000;
    const refreshExpiresInSec = Number(tokenData.refresh_token_expires_in || 0);

    const credentialValues: Record<string, string> = {
      storeDomain: normShop,
      accessToken: tokenData.access_token,
      access_token: tokenData.access_token,
      refreshToken: tokenData.refresh_token || "",
      refresh_token: tokenData.refresh_token || "",
      expiresAt: String(expiresAtMs),
      expires_in: String(expiresInSec),
      obtainedAt: String(now),
      obtained_at: String(now),
      grantedScopes: JSON.stringify(grantedScopes),
      scope: tokenData.scope,
      missingScopes: JSON.stringify(missingScopes),
      is_connected: "true",
      verified: "true",
      connectedAt: new Date().toISOString(),
    };

    if (refreshExpiresInSec > 0) {
      credentialValues.refreshTokenExpiresAt = String(now + refreshExpiresInSec * 1000);
    }

    await saveConnectorCredential(canonicalUserId, "shopify", credentialValues);

    // Clear state cookie
    res.setHeader("Set-Cookie", "hanna_shopify_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");

    res.redirect(`${appBaseUrl()}/integrations?connector_success=shopify&shop=${encodeURIComponent(normShop)}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Shopify OAuth callback failed";
    res.redirect(`${appBaseUrl()}/integrations?connector_error=${encodeURIComponent(msg)}`);
  }
}
