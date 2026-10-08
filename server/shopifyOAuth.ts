import crypto from "node:crypto";
import { SHOPIFY_OAUTH_SCOPES, SHOPIFY_OAUTH_SCOPES_STRING } from "./shopifyConfig";
import { getAdminFirestore } from "./firestore";
import { getStoredConnectorCredentials, saveStoredConnectorCredential } from "./persistentStore";
import { saveConnectorCredential, type ConnectorValues } from "./connectorDb";
import { resolveCanonicalUserId } from "./userResolver";

function stateSecret(): string {
  const secret = process.env.OAUTH_STATE_SECRET || process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("OAUTH_STATE_SECRET or CREDENTIAL_ENCRYPTION_KEY must be set in production environment.");
    }
    return "hanna-shopify-oauth-state-secret-default-32chars";
  }
  return secret;
}

function appBaseUrl(): string {
  return (process.env.APP_BASE_URL || "https://hanna-agent.vercel.app").replace(/\/$/, "");
}

export function getCanonicalShopifyRedirectUri(): string {
  if (process.env.SHOPIFY_REDIRECT_URI && process.env.SHOPIFY_REDIRECT_URI.trim()) {
    return process.env.SHOPIFY_REDIRECT_URI.trim();
  }
  return `${appBaseUrl()}/api/oauth/shopify/callback`;
}

export function getShopifyCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.SHOPIFY_CLIENT_ID || process.env.SHOPIFY_OAUTH_CLIENT_ID || "";
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET || process.env.SHOPIFY_OAUTH_CLIENT_SECRET || "";
  return { clientId, clientSecret };
}

/**
 * Strictly normalizes and validates a merchant's Shopify store domain.
 * Must match a valid *.myshopify.com hostname.
 * Arbitrary domains (e.g. google.com, attacker.com) are rejected.
 */
export function normalizeShopifyDomain(rawShop: string | undefined | null): string | null {
  if (!rawShop || typeof rawShop !== "string") return null;

  let cleaned = rawShop.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  if (!cleaned.includes(".")) {
    cleaned = `${cleaned}.myshopify.com`;
  }

  const shopifyRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  if (!shopifyRegex.test(cleaned)) {
    return null;
  }

  return cleaned;
}

const usedShopifyNonces = new Set<string>();

async function consumeNonceDurable(canonicalUserId: string, nonce: string): Promise<boolean> {
  const firestore = getAdminFirestore();
  if (firestore) {
    try {
      const docRef = firestore.collection("users").doc(canonicalUserId).collection("oauth_nonces").doc(nonce);
      const snapshot = await docRef.get();
      if (snapshot.exists) {
        return false; // already used!
      }
      await docRef.set({
        usedAt: new Date(),
        nonce,
      });
      return true;
    } catch (err) {
      console.warn("[ShopifyOAuth] Durable nonce check error, falling back to in-memory:", err);
    }
  }

  if (usedShopifyNonces.has(nonce)) {
    return false;
  }
  usedShopifyNonces.add(nonce);
  if (usedShopifyNonces.size > 10000) {
    usedShopifyNonces.clear();
  }
  return true;
}

export function generateShopifyOAuthState(canonicalUserId: string, shop: string): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  const provider = "shopify";
  const payload = `${canonicalUserId}:${provider}:${shop}:${timestamp}:${nonce}`;
  const signature = crypto
    .createHmac("sha256", stateSecret())
    .update(payload)
    .digest("hex");

  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export type StateVerificationResult = {
  uid: string;
  shop: string;
  valid: boolean;
  reason?: string;
};

export async function verifyShopifyOAuthState(
  state: string | undefined | null,
  expectedShop?: string
): Promise<StateVerificationResult> {
  if (!state || typeof state !== "string") {
    return { uid: "", shop: "", valid: false, reason: "missing_state" };
  }

  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 6) {
      return { uid: "", shop: "", valid: false, reason: "malformed_state" };
    }

    const [uid, provider, shop, timestampStr, nonce, signature] = parts;

    if (provider !== "shopify") {
      return { uid: "", shop: "", valid: false, reason: "invalid_provider" };
    }

    const payload = `${uid}:${provider}:${shop}:${timestampStr}:${nonce}`;
    const expectedSig = crypto
      .createHmac("sha256", stateSecret())
      .update(payload)
      .digest("hex");

    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expectedSig, "hex");
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { uid: "", shop: "", valid: false, reason: "invalid_signature" };
    }

    const timestamp = Number.parseInt(timestampStr, 10);
    // State expires after 15 minutes
    if (Date.now() - timestamp > 15 * 60 * 1000) {
      return { uid: "", shop: "", valid: false, reason: "expired_state" };
    }

    if (expectedShop) {
      const normExpected = normalizeShopifyDomain(expectedShop);
      const normStateShop = normalizeShopifyDomain(shop);
      if (!normExpected || !normStateShop || normExpected !== normStateShop) {
        return { uid: "", shop: "", valid: false, reason: "shop_mismatch" };
      }
    }

    const canonicalUserId = await resolveCanonicalUserId(uid);
    const isNewNonce = await consumeNonceDurable(canonicalUserId, nonce);
    if (!isNewNonce) {
      return { uid: "", shop: "", valid: false, reason: "replayed_state" };
    }

    return { uid: canonicalUserId, shop, valid: true };
  } catch (err) {
    return { uid: "", shop: "", valid: false, reason: "state_error" };
  }
}

/**
 * Validates Shopify HMAC using constant-time comparison and Shopify app client secret.
 */
export function verifyShopifyHmac(query: Record<string, string | string[] | undefined>): boolean {
  const hmac = query.hmac;
  if (!hmac || typeof hmac !== "string") return false;

  const { clientSecret } = getShopifyCredentials();
  if (!clientSecret) return false;

  const params: string[] = [];
  const sortedKeys = Object.keys(query).sort();

  for (const key of sortedKeys) {
    if (key === "hmac" || key === "signature") continue;
    const value = query[key];
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      params.push(`${key}=${value.join(",")}`);
    } else {
      params.push(`${key}=${value}`);
    }
  }

  const message = params.join("&");
  const calculatedHmac = crypto
    .createHmac("sha256", clientSecret)
    .update(message)
    .digest("hex");

  const hmacBuf = Buffer.from(hmac, "hex");
  const calcBuf = Buffer.from(calculatedHmac, "hex");

  if (hmacBuf.length !== calcBuf.length) return false;
  return crypto.timingSafeEqual(hmacBuf, calcBuf);
}

export type ShopifyTokenExchangeResponse = {
  access_token: string;
  scope: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  associated_user_scope?: string;
  associated_user?: Record<string, unknown>;
};

export async function exchangeShopifyCode(
  shop: string,
  code: string,
  fetcher: typeof fetch = fetch
): Promise<ShopifyTokenExchangeResponse> {
  const { clientId, clientSecret } = getShopifyCredentials();
  if (!clientId || !clientSecret) {
    throw new Error("Shopify Client ID and Secret are not configured on server.");
  }

  const normShop = normalizeShopifyDomain(shop);
  if (!normShop) {
    throw new Error("Invalid Shopify store domain.");
  }

  const url = `https://${normShop}/admin/oauth/access_token`;
  const response = await fetcher(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      expiring: 1, // Requests expiring offline token pair with refresh token
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Shopify token exchange failed (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as ShopifyTokenExchangeResponse;
  if (!data.access_token) {
    throw new Error("Shopify token exchange returned response missing access_token.");
  }

  return data;
}

export function parseShopifyScopes(scopeString: string): {
  grantedScopes: string[];
  missingScopes: string[];
} {
  const grantedScopes = (scopeString || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const missingScopes = SHOPIFY_OAUTH_SCOPES.filter(
    s => !grantedScopes.includes(s)
  );

  return { grantedScopes, missingScopes };
}

// In-flight refresh promise cache to prevent concurrent refresh requests from corrupting token state
const inFlightRefreshes = new Map<string, Promise<ConnectorValues>>();

export async function ensureFreshShopifyToken(
  canonicalUserId: string,
  credentialValues: ConnectorValues,
  fetcher: typeof fetch = fetch
): Promise<ConnectorValues> {
  const { accessToken, access_token, refreshToken, refresh_token, expiresAt, expires_in, obtainedAt, obtained_at, storeDomain } = credentialValues;
  const currentAccess = accessToken || access_token || "";
  const currentRefresh = refreshToken || refresh_token || "";
  const domain = storeDomain || credentialValues.shop || "";

  if (!currentRefresh) {
    return credentialValues;
  }

  let expiresAtMs = 0;
  if (expiresAt) {
    expiresAtMs = Number.parseInt(expiresAt, 10);
  } else if (expires_in) {
    const obtained = Number.parseInt(obtainedAt || obtained_at || "0", 10);
    const secs = Number.parseInt(expires_in, 10);
    expiresAtMs = obtained + secs * 1000;
  }

  const nowMs = Date.now();
  // If token is still valid for > 5 minutes, return existing values
  if (expiresAtMs > 0 && expiresAtMs - nowMs > 300_000) {
    return credentialValues;
  }

  const lockKey = `${canonicalUserId}:${domain}`;
  if (inFlightRefreshes.has(lockKey)) {
    return inFlightRefreshes.get(lockKey)!;
  }

  const refreshPromise = (async () => {
    try {
      const { clientId, clientSecret } = getShopifyCredentials();
      if (!clientId || !clientSecret || !domain) {
        return credentialValues;
      }

      const normShop = normalizeShopifyDomain(domain);
      if (!normShop) return credentialValues;

      const refreshUrl = `https://${normShop}/admin/oauth/access_token`;
      const res = await fetcher(refreshUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: currentRefresh,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn("[ShopifyTokenRefresh] Refresh failed:", res.status, errText);
        return credentialValues;
      }

      const data = await res.json();
      if (!data.access_token) {
        return credentialValues;
      }

      const now = Date.now();
      const expiresInSec = Number(data.expires_in || 86400); // Shopify access tokens typically last 24h
      const newExpiresAt = now + expiresInSec * 1000;
      const refreshExpiresInSec = Number(data.refresh_token_expires_in || 0);

      const updatedValues: ConnectorValues = {
        ...credentialValues,
        accessToken: data.access_token,
        access_token: data.access_token,
        refreshToken: data.refresh_token || currentRefresh,
        refresh_token: data.refresh_token || currentRefresh,
        expiresAt: String(newExpiresAt),
        expires_in: String(expiresInSec),
        obtainedAt: String(now),
        obtained_at: String(now),
        storeDomain: normShop,
        is_connected: "true",
        verified: "true",
      };

      if (refreshExpiresInSec > 0) {
        updatedValues.refreshTokenExpiresAt = String(now + refreshExpiresInSec * 1000);
      }

      await saveConnectorCredential(canonicalUserId, "shopify", updatedValues);
      return updatedValues;
    } finally {
      inFlightRefreshes.delete(lockKey);
    }
  })();

  inFlightRefreshes.set(lockKey, refreshPromise);
  return refreshPromise;
}
