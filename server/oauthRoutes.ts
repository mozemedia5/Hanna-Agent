import crypto from "node:crypto";
import type { Request as ExpressRequest, Response as ExpressResponse } from "express";
import { parseAndVerifyFirebaseToken } from "./_core/context";
import { saveConnectorCredential } from "./connectorDb";
import { resolveCanonicalUserId } from "./userResolver";

function stateSecret() {
  const secret = process.env.OAUTH_STATE_SECRET || process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("OAUTH_STATE_SECRET or CREDENTIAL_ENCRYPTION_KEY must be set in production environment.");
    }
    return "hanna-oauth-state-secret-default-32chars";
  }
  return secret;
}

const usedNonces = new Set<string>();

export function rememberNonce(nonce: string): boolean {
  if (usedNonces.has(nonce)) {
    return false;
  }
  usedNonces.add(nonce);
  // Clean up old nonces periodically
  if (usedNonces.size > 10000) {
    usedNonces.clear();
  }
  return true;
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

export function generateOAuthState(uid: string, provider = "google"): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  const payload = `${uid}:${provider}:${timestamp}:${nonce}`;
  const signature = crypto
    .createHmac("sha256", stateSecret())
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
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

export function verifyOAuthState(state: string, expectedProvider = "google", allowReplayIfRecent = true): { uid: string; valid: boolean } {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 5) {
      return { uid: "", valid: false };
    }

    const [uid, provider, timestampStr, nonce, signature] = parts;
    if (provider !== expectedProvider) return { uid: "", valid: false };

    const payload = `${uid}:${provider}:${timestampStr}:${nonce}`;
    const expectedSig = crypto
      .createHmac("sha256", stateSecret())
      .update(payload)
      .digest("hex");

    if (signature !== expectedSig) return { uid: "", valid: false };

    const timestamp = Number.parseInt(timestampStr, 10);
    // Expire state after 15 minutes
    if (Date.now() - timestamp > 15 * 60 * 1000) return { uid: "", valid: false };

    // Prevent state replay unless allowReplayIfRecent is true for recent requests (< 5 min)
    const isNewNonce = rememberNonce(nonce);
    if (!isNewNonce) {
      if (allowReplayIfRecent && Date.now() - timestamp < 5 * 60 * 1000) {
        return { uid, valid: true };
      }
      return { uid: "", valid: false };
    }

    return { uid, valid: true };
  } catch {
    return { uid: "", valid: false };
  }
}

/** Express handler to initiate Google OAuth Authorization Flow */
export async function handleGoogleOAuthAuthorize(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const token = (req.query.id_token as string) || req.headers.authorization?.slice(7);
  const decoded = token ? parseAndVerifyFirebaseToken(token) : null;
  const rawUid = decoded?.user_id || decoded?.sub;

  if (!rawUid) {
    res.status(401).json({ error: "Authentication required to initiate Google OAuth connection." });
    return;
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    res.status(500).json({ error: "Google OAuth Client ID is not configured on server (GOOGLE_OAUTH_CLIENT_ID)." });
    return;
  }

  const canonicalUserId = await resolveCanonicalUserId(rawUid);
  const redirectUri = getCanonicalGoogleRedirectUri();
  const state = generateOAuthState(canonicalUserId, "google");

  const scope = [
    "openid",
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

  // Set HTTP-only cookie for state verification resilience
  res.setHeader(
    "Set-Cookie",
    `hanna_oauth_state=${encodeURIComponent(state)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900`
  );

  res.redirect(authUrl.toString());
}

/** Express handler for Google OAuth Callback */
export async function handleGoogleOAuthCallback(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const code = req.query.code as string;
  const stateFromQuery = req.query.state as string;
  const error = req.query.error as string;

  const cookies = parseCookies(req.headers.cookie);
  const stateFromCookie = cookies["hanna_oauth_state"];

  const state = stateFromQuery || stateFromCookie;

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

  let verification = verifyOAuthState(state, "google");
  if ((!verification.valid || !verification.uid) && stateFromCookie && stateFromCookie !== stateFromQuery) {
    verification = verifyOAuthState(stateFromCookie, "google");
  }

  const { uid: stateUserId, valid } = verification;
  if (!valid || !stateUserId) {
    res.redirect(`${appBaseUrl()}/?connector_error=${encodeURIComponent("state_mismatch")}`);
    return;
  }

  const canonicalUserId = await resolveCanonicalUserId(stateUserId);

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

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

    // Perform Google Account UserInfo Verification Step
    let googleEmail = "";
    let googleSub = "";
    try {
      const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userinfoRes.ok) {
        const userinfo = await userinfoRes.json();
        googleEmail = userinfo.email || "";
        googleSub = userinfo.sub || "";
      }
    } catch (err) {
      console.warn("[GoogleOAuth] UserInfo verification warning:", err);
    }

    const googleConnectors = [
      "google-workspace",
      "gmail",
      "google-drive",
      "google-docs",
      "google-sheets",
      "google-slides",
      "google-calendar",
    ] as const;

    const nowIso = new Date().toISOString();
    for (const connectorId of googleConnectors) {
      await saveConnectorCredential(canonicalUserId, connectorId, {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: tokenData.token_type || "Bearer",
        expires_in: String(tokenData.expires_in || 3600),
        obtained_at: String(Date.now()),
        account: googleEmail || "authorized_google_account",
        google_user_id: googleSub,
        is_connected: "true",
        verified: "true",
        last_verified_at: nowIso,
      });
    }

    // Clear state cookie
    res.setHeader("Set-Cookie", "hanna_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");

    res.redirect(`${appBaseUrl()}/?connector_success=google-workspace`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Google OAuth callback failed";
    res.redirect(`${appBaseUrl()}/?connector_error=${encodeURIComponent(msg)}`);
  }
}

export {
  handleShopifyOAuthAuthorize,
  handleShopifyOAuthCallback,
} from "./shopifyOAuthRoutes";

export function getCanonicalGitHubRedirectUri(): string {
  if (process.env.GITHUB_REDIRECT_URI && process.env.GITHUB_REDIRECT_URI.trim()) {
    return process.env.GITHUB_REDIRECT_URI.trim();
  }
  return `${appBaseUrl()}/api/oauth/github/callback`;
}

/** Express handler to initiate GitHub Connector OAuth Authorization Flow */
export async function handleGitHubOAuthAuthorize(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const token = (req.query.id_token as string) || req.headers.authorization?.slice(7);
  const decoded = token ? parseAndVerifyFirebaseToken(token) : null;
  const rawUid = decoded?.user_id || decoded?.sub;

  if (!rawUid) {
    res.status(401).json({ error: "Authentication required to initiate GitHub OAuth connection." });
    return;
  }

  const clientId = process.env.GITHUB_CLIENT_ID || process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    res.status(500).json({ error: "GitHub OAuth Client ID is not configured on server (GITHUB_CLIENT_ID)." });
    return;
  }

  const canonicalUserId = await resolveCanonicalUserId(rawUid);
  const redirectUri = getCanonicalGitHubRedirectUri();
  const state = generateOAuthState(canonicalUserId, "github");
  const scope = "repo read:user user:email";

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", state);

  res.redirect(authUrl.toString());
}

/** Express handler for GitHub Connector OAuth Callback */
export async function handleGitHubOAuthCallback(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const error = req.query.error as string;

  if (error) {
    res.redirect(`${appBaseUrl()}/?connector_error=${encodeURIComponent(error)}`);
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

  const { uid: stateUserId, valid } = verifyOAuthState(state, "github");
  if (!valid || !stateUserId) {
    res.redirect(`${appBaseUrl()}/?connector_error=${encodeURIComponent("state_mismatch")}`);
    return;
  }

  const canonicalUserId = await resolveCanonicalUserId(stateUserId);

  const clientId = process.env.GITHUB_CLIENT_ID || process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET || process.env.GITHUB_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.redirect(`${appBaseUrl()}/?connector_error=${encodeURIComponent("invalid_client_config")}`);
    return;
  }

  try {
    const redirectUri = getCanonicalGitHubRedirectUri();
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      res.redirect(`${appBaseUrl()}/?connector_error=${encodeURIComponent("token_exchange_failure")}`);
      return;
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      const err = tokenData.error_description || "No access token returned by GitHub.";
      res.redirect(`${appBaseUrl()}/?connector_error=${encodeURIComponent(err)}`);
      return;
    }

    // Verify GitHub user connection
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "Hanna-Agent",
      },
    });

    let githubUsername = "";
    if (userRes.ok) {
      const userData = await userRes.json();
      githubUsername = userData.login || "";
    }

    await saveConnectorCredential(canonicalUserId, "github", {
      access_token: accessToken,
      username: githubUsername,
      is_connected: "true",
      verified: "true",
    });

    res.redirect(`${appBaseUrl()}/?connector_success=github`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "GitHub OAuth callback failed";
    res.redirect(`${appBaseUrl()}/?connector_error=${encodeURIComponent(msg)}`);
  }
}
