/**
 * OAuth 2.0 provider configuration and helpers for Hanna Agent connectors.
 * Full implementation — tokens exchanged server-side only.
 */
import crypto from "node:crypto";

export type OAuthProviderId =
  | "google"
  | "github"
  | "slack"
  | "meta"
  | "shopify"
  | "x"
  | "tiktok";

export const CONNECTOR_TO_OAUTH: Record<string, OAuthProviderId> = {
  "google-workspace": "google",
  "google-drive": "google",
  "google-docs": "google",
  "google-sheets": "google",
  "google-slides": "google",
  gmail: "google",
  "google-calendar": "google",
  "google-ads": "google",
  youtube: "google",
  github: "github",
  slack: "slack",
  instagram: "meta",
  facebook: "meta",
  "meta-ads": "meta",
  threads: "meta",
  whatsapp: "meta",
  shopify: "shopify",
  x: "x",
  twitter: "x",
  tiktok: "tiktok",
  "tiktok-ads": "tiktok",
};

export type OAuthProviderConfig = {
  id: OAuthProviderId;
  name: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
  authorizeParams?: Record<string, string>;
  useBasicAuth?: boolean;
};

const BASE_SCOPES: Record<OAuthProviderId, string[]> = {
  google: [
    "openid", "email", "profile",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/documents.readonly",
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/adwords",
  ],
  github: ["read:user", "repo", "read:org"],
  slack: ["channels:read", "groups:read", "chat:write", "users:read"],
  meta: [
    "pages_show_list", "pages_read_engagement", "instagram_basic",
    "instagram_content_publish", "ads_management", "ads_read", "business_management",
  ],
  shopify: ["read_products", "write_products", "read_orders", "read_customers"],
  x: ["tweet.read", "tweet.write", "users.read", "offline.access"],
  tiktok: ["user.info.basic", "video.list", "video.publish"],
};

export function getOAuthProviderConfig(providerId: OAuthProviderId): OAuthProviderConfig {
  const scopes = BASE_SCOPES[providerId];
  const map: Record<OAuthProviderId, OAuthProviderConfig> = {
    google: {
      id: "google", name: "Google",
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token", scopes,
      clientIdEnv: "GOOGLE_OAUTH_CLIENT_ID", clientSecretEnv: "GOOGLE_OAUTH_CLIENT_SECRET",
      authorizeParams: { access_type: "offline", prompt: "consent", include_granted_scopes: "true" },
    },
    github: {
      id: "github", name: "GitHub",
      authorizeUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token", scopes,
      clientIdEnv: "GITHUB_OAUTH_CLIENT_ID", clientSecretEnv: "GITHUB_OAUTH_CLIENT_SECRET",
    },
    slack: {
      id: "slack", name: "Slack",
      authorizeUrl: "https://slack.com/oauth/v2/authorize",
      tokenUrl: "https://slack.com/api/oauth.v2.access", scopes,
      clientIdEnv: "SLACK_OAUTH_CLIENT_ID", clientSecretEnv: "SLACK_OAUTH_CLIENT_SECRET",
    },
    meta: {
      id: "meta", name: "Meta",
      authorizeUrl: "https://www.facebook.com/v21.0/dialog/oauth",
      tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token", scopes,
      clientIdEnv: "META_OAUTH_CLIENT_ID", clientSecretEnv: "META_OAUTH_CLIENT_SECRET",
    },
    shopify: {
      id: "shopify", name: "Shopify", authorizeUrl: "", tokenUrl: "", scopes,
      clientIdEnv: "SHOPIFY_OAUTH_CLIENT_ID", clientSecretEnv: "SHOPIFY_OAUTH_CLIENT_SECRET",
    },
    x: {
      id: "x", name: "X",
      authorizeUrl: "https://twitter.com/i/oauth2/authorize",
      tokenUrl: "https://api.twitter.com/2/oauth2/token", scopes,
      clientIdEnv: "X_OAUTH_CLIENT_ID", clientSecretEnv: "X_OAUTH_CLIENT_SECRET", useBasicAuth: true,
    },
    tiktok: {
      id: "tiktok", name: "TikTok",
      authorizeUrl: "https://www.tiktok.com/v2/auth/authorize/",
      tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/", scopes,
      clientIdEnv: "TIKTOK_OAUTH_CLIENT_KEY", clientSecretEnv: "TIKTOK_OAUTH_CLIENT_SECRET",
    },
  };
  return map[providerId];
}

export function isOAuthConfigured(providerId: OAuthProviderId): boolean {
  const config = getOAuthProviderConfig(providerId);
  return Boolean(process.env[config.clientIdEnv] && process.env[config.clientSecretEnv]);
}

export function getAppBaseUrl(req?: { headers?: Record<string, string | string[] | undefined> }): string {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const host = req?.headers?.host;
  if (typeof host === "string") {
    const proto = (typeof req?.headers?.["x-forwarded-proto"] === "string" ? req.headers["x-forwarded-proto"] : null) || "http";
    return `${proto}://${host}`;
  }
  return "https://hanna-agent.vercel.app";
}

export function buildRedirectUri(providerId: OAuthProviderId, baseUrl?: string): string {
  const base = (baseUrl || getAppBaseUrl()).replace(/\/$/, "");
  return `${base}/api/oauth/${providerId}/callback`;
}

export type OAuthStatePayload = {
  provider: OAuthProviderId;
  connector: string;
  userId: number;
  shop?: string;
  codeVerifier?: string;
  nonce: string;
  exp: number;
};

function stateSecret(): string {
  const secret =
    process.env.OAUTH_STATE_SECRET ||
    process.env.CREDENTIAL_ENCRYPTION_KEY ||
    process.env.HANNA_ENCRYPTION_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      throw new Error(
        "OAUTH_STATE_SECRET or CREDENTIAL_ENCRYPTION_KEY must be set in production."
      );
    }
    return "hanna-oauth-dev-secret-change-me";
  }
  return secret;
}

export function createOAuthState(payload: Omit<OAuthStatePayload, "nonce" | "exp">): string {
  const full: OAuthStatePayload = { ...payload, nonce: crypto.randomBytes(12).toString("hex"), exp: Date.now() + 15 * 60 * 1000 };
  const body = Buffer.from(JSON.stringify(full)).toString("base64url");
  const sig = crypto.createHmac("sha256", stateSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function parseOAuthState(state: string): OAuthStatePayload | null {
  const [body, sig] = state.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", stateSecret()).update(body).digest("base64url");
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch { return null; }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as OAuthStatePayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

export function generatePkce(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
  return { codeVerifier, codeChallenge };
}

export function buildAuthorizeUrl(params: {
  providerId: OAuthProviderId; state: string; redirectUri: string; shop?: string; codeChallenge?: string;
}): string {
  const config = getOAuthProviderConfig(params.providerId);
  const clientId = process.env[config.clientIdEnv];
  if (!clientId) throw new Error(`${config.name} OAuth is not configured. Set ${config.clientIdEnv}.`);

  if (params.providerId === "shopify") {
    const shop = params.shop?.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!shop || !shop.includes(".myshopify.com")) throw new Error("Shopify OAuth requires shop domain like your-store.myshopify.com");
    const url = new URL(`https://${shop}/admin/oauth/authorize`);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("scope", config.scopes.join(","));
    url.searchParams.set("redirect_uri", params.redirectUri);
    url.searchParams.set("state", params.state);
    return url.toString();
  }

  const url = new URL(config.authorizeUrl);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("state", params.state);
  url.searchParams.set("response_type", "code");
  if (params.providerId === "slack") url.searchParams.set("scope", config.scopes.join(","));
  else if (params.providerId === "tiktok") {
    url.searchParams.set("client_key", clientId);
    url.searchParams.set("scope", config.scopes.join(","));
    url.searchParams.delete("client_id");
  } else url.searchParams.set("scope", config.scopes.join(" "));
  if (config.authorizeParams) for (const [k, v] of Object.entries(config.authorizeParams)) url.searchParams.set(k, v);
  if (params.codeChallenge) {
    url.searchParams.set("code_challenge", params.codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
  }
  return url.toString();
}

export type TokenExchangeResult = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  scope?: string;
  extras?: Record<string, string>;
};

export async function exchangeCodeForTokens(params: {
  providerId: OAuthProviderId; code: string; redirectUri: string; codeVerifier?: string; shop?: string;
}): Promise<TokenExchangeResult> {
  const config = getOAuthProviderConfig(params.providerId);
  const clientId = process.env[config.clientIdEnv];
  const clientSecret = process.env[config.clientSecretEnv];
  if (!clientId || !clientSecret) throw new Error(`${config.name} OAuth client credentials are not configured.`);

  let tokenUrl = config.tokenUrl;
  if (params.providerId === "shopify") {
    const shop = params.shop?.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!shop) throw new Error("Shopify shop domain missing from OAuth state.");
    tokenUrl = `https://${shop}/admin/oauth/access_token`;
  }

  const body = new URLSearchParams();
  body.set("code", params.code);
  body.set("redirect_uri", params.redirectUri);
  body.set("grant_type", "authorization_code");
  if (params.providerId === "tiktok") {
    body.set("client_key", clientId);
    body.set("client_secret", clientSecret);
  } else if (!config.useBasicAuth) {
    body.set("client_id", clientId);
    body.set("client_secret", clientSecret);
  }
  if (params.codeVerifier) body.set("code_verifier", params.codeVerifier);

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };
  if (config.useBasicAuth) {
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
  }

  const response = await fetch(tokenUrl, { method: "POST", headers, body: body.toString() });
  const data = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error((data.error_description as string) || (data.error as string) || (data.message as string) || `Token exchange failed (${response.status})`);
  }

  if (params.providerId === "slack") {
    const accessToken = (data.access_token as string) || ((data.authed_user as Record<string, string>)?.access_token);
    if (!accessToken) throw new Error("Slack did not return an access token.");
    const team = data.team as { id?: string; name?: string } | undefined;
    return {
      accessToken,
      refreshToken: data.refresh_token as string | undefined,
      scope: data.scope as string | undefined,
      tokenType: (data.token_type as string) || "Bearer",
      extras: { teamId: team?.id || "", teamName: team?.name || "", botUserId: (data.bot_user_id as string) || "" },
    };
  }
  if (params.providerId === "shopify") {
    const accessToken = data.access_token as string;
    if (!accessToken) throw new Error("Shopify did not return an access token.");
    return { accessToken, scope: data.scope as string | undefined, extras: { shop: params.shop || "" } };
  }
  if (params.providerId === "tiktok") {
    const accessToken = (data.access_token as string) || ((data.data as Record<string, string>)?.access_token);
    if (!accessToken) throw new Error("TikTok did not return an access token.");
    return {
      accessToken,
      refreshToken: (data.refresh_token as string) || ((data.data as Record<string, string>)?.refresh_token),
      expiresIn: (data.expires_in as number) || ((data.data as Record<string, number>)?.expires_in),
      scope: data.scope as string | undefined,
    };
  }
  const accessToken = data.access_token as string;
  if (!accessToken) throw new Error(`${config.name} did not return an access token.`);
  return {
    accessToken,
    refreshToken: data.refresh_token as string | undefined,
    expiresIn: data.expires_in as number | undefined,
    tokenType: (data.token_type as string) || "Bearer",
    scope: data.scope as string | undefined,
  };
}

export async function refreshAccessToken(params: {
  providerId: OAuthProviderId; refreshToken: string;
}): Promise<TokenExchangeResult> {
  const config = getOAuthProviderConfig(params.providerId);
  const clientId = process.env[config.clientIdEnv];
  const clientSecret = process.env[config.clientSecretEnv];
  if (!clientId || !clientSecret) throw new Error(`${config.name} OAuth client credentials are not configured.`);
  if (!config.tokenUrl) throw new Error(`${config.name} does not support token refresh via this endpoint.`);

  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", params.refreshToken);
  const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" };
  if (config.useBasicAuth) {
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
  } else if (params.providerId === "tiktok") {
    body.set("client_key", clientId);
    body.set("client_secret", clientSecret);
  } else {
    body.set("client_id", clientId);
    body.set("client_secret", clientSecret);
  }
  const response = await fetch(config.tokenUrl, { method: "POST", headers, body: body.toString() });
  const data = (await response.json()) as Record<string, unknown>;
  if (!response.ok) throw new Error((data.error_description as string) || (data.error as string) || "Token refresh failed");
  const accessToken = data.access_token as string;
  if (!accessToken) throw new Error("Refresh response missing access_token.");
  return {
    accessToken,
    refreshToken: (data.refresh_token as string | undefined) || params.refreshToken,
    expiresIn: data.expires_in as number | undefined,
    tokenType: (data.token_type as string) || "Bearer",
    scope: data.scope as string | undefined,
  };
}
