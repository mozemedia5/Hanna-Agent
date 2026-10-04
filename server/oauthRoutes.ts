import crypto from "node:crypto";
import type { Request as ExpressRequest, Response as ExpressResponse } from "express";
import { parseAndVerifyFirebaseToken } from "./_core/context";
import { saveConnectorCredential } from "./connectorDb";

function stateSecret() {
  return (
    process.env.OAUTH_STATE_SECRET ||
    process.env.CREDENTIAL_ENCRYPTION_KEY ||
    "hanna-oauth-state-secret-default-32chars"
  );
}

function appBaseUrl() {
  return (process.env.APP_BASE_URL || "https://hanna-agent.vercel.app").replace(/\/$/, "");
}

export function getCanonicalGoogleRedirectUri(): string {
  if (process.env.GOOGLE_REDIRECT_URI && process.env.GOOGLE_REDIRECT_URI.trim()) {
    return process.env.GOOGLE_REDIRECT_URI.trim();
  }
  return `${appBaseUrl()}/api/oauth/google/callback`;
}


export function generateOAuthState(uid: string): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  const payload = `${uid}:${timestamp}:${nonce}`;
  const signature = crypto
    .createHmac("sha256", stateSecret())
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function verifyOAuthState(state: string): { uid: string; valid: boolean } {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 4) return { uid: "", valid: false };

    const [uid, timestampStr, nonce, signature] = parts;
    const payload = `${uid}:${timestampStr}:${nonce}`;
    const expectedSig = crypto
      .createHmac("sha256", stateSecret())
      .update(payload)
      .digest("hex");

    if (signature !== expectedSig) return { uid: "", valid: false };

    const timestamp = Number.parseInt(timestampStr, 10);
    // Expire state after 15 minutes
    if (Date.now() - timestamp > 15 * 60 * 1000) return { uid: "", valid: false };

    return { uid, valid: true };
  } catch {
    return { uid: "", valid: false };
  }
}

/** Express handler to initiate Google OAuth Authorization Flow */
export async function handleGoogleOAuthAuthorize(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const token = req.query.id_token as string || req.headers.authorization?.slice(7);
  const decoded = token ? parseAndVerifyFirebaseToken(token) : null;
  const uid = decoded?.user_id || decoded?.sub;

  if (!uid) {
    res.status(401).json({ error: "Authentication required to initiate Google OAuth connection." });
    return;
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) {
    res.status(500).json({ error: "Google OAuth Client ID is not configured on server (GOOGLE_OAUTH_CLIENT_ID)." });
    return;
  }

  const redirectUri = getCanonicalGoogleRedirectUri();
  const state = generateOAuthState(uid);

  const scope = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/documents.readonly",
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar.events",
  ].join(" ");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  res.redirect(authUrl.toString());
}

/** Express handler for Google OAuth Callback */
export async function handleGoogleOAuthCallback(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const error = req.query.error as string;

  if (error) {
    const diagCode = error === "access_denied" ? "access_denied" : "oauth_error";
    res.redirect(`${appBaseUrl()}/?connector_error=${encodeURIComponent(diagCode)}`);
    return;
  }

  if (!code) {
    res.redirect(`${appBaseUrl()}/?connector_error=${encodeURIComponent("missing_code")}`);
    return;
  }

  if (!state) {
    res.redirect(`${appBaseUrl()}/?connector_error=${encodeURIComponent("missing_state")}`);
    return;
  }

  const { uid, valid } = verifyOAuthState(state);
  if (!valid || !uid) {
    res.redirect(`${appBaseUrl()}/?connector_error=${encodeURIComponent("state_mismatch")}`);
    return;
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.redirect(`${appBaseUrl()}/?connector_error=${encodeURIComponent("invalid_client_config")}`);
    return;
  }

  try {
    const redirectUri = getCanonicalGoogleRedirectUri();
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      const diagCode = errText.includes("redirect_uri_mismatch")
        ? "redirect_uri_mismatch"
        : errText.includes("invalid_grant")
        ? "invalid_grant"
        : "token_exchange_failure";
      res.redirect(`${appBaseUrl()}/?connector_error=${encodeURIComponent(diagCode)}`);
      return;
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || "";

    if (!accessToken) {
      res.redirect(`${appBaseUrl()}/?connector_error=${encodeURIComponent("No access token returned by Google.")}`);
      return;
    }

    await saveConnectorCredential(uid, "google-workspace", {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: tokenData.token_type || "Bearer",
      expires_in: String(tokenData.expires_in || 3600),
      is_connected: "true",
    });

    await saveConnectorCredential(uid, "gmail", {
      access_token: accessToken,
      refresh_token: refreshToken,
      is_connected: "true",
    });

    res.redirect(`${appBaseUrl()}/?connector_success=google-workspace`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Google OAuth callback failed";
    res.redirect(`${appBaseUrl()}/?connector_error=${encodeURIComponent(msg)}`);
  }
}
