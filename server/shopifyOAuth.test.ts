import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import crypto from "node:crypto";
import {
  normalizeShopifyDomain,
  generateShopifyOAuthState,
  verifyShopifyOAuthState,
  verifyShopifyHmac,
  exchangeShopifyCode,
  parseShopifyScopes,
  ensureFreshShopifyToken,
  getCanonicalShopifyRedirectUri,
} from "./shopifyOAuth";
import { saveConnectorCredential, getConnectorCredential, listConnectorCredentials } from "./connectorDb";

describe("Shopify OAuth Authorization Flow Unit & Integration Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SHOPIFY_CLIENT_ID: "test_shopify_client_id_123",
      SHOPIFY_CLIENT_SECRET: "test_shopify_client_secret_456",
      APP_BASE_URL: "https://hanna-agent.vercel.app",
      CREDENTIAL_ENCRYPTION_KEY: "01234567890123456789012345678901",
      OAUTH_STATE_SECRET: "oauth_state_secret_123456789012",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("1. Redirect URI generation", () => {
    it("generates production redirect URI", () => {
      expect(getCanonicalShopifyRedirectUri()).toBe("https://hanna-agent.vercel.app/api/oauth/shopify/callback");
    });
  });

  describe("2. Shop Domain Normalization and Strict Hostname Validation", () => {
    it("normalizes valid shop domain strings correctly", () => {
      expect(normalizeShopifyDomain("my-store.myshopify.com")).toBe("my-store.myshopify.com");
      expect(normalizeShopifyDomain("MY-STORE.MYSHOPIFY.COM")).toBe("my-store.myshopify.com");
      expect(normalizeShopifyDomain("https://my-store.myshopify.com/admin")).toBe("my-store.myshopify.com");
      expect(normalizeShopifyDomain("my-store")).toBe("my-store.myshopify.com");
    });

    it("rejects arbitrary and malicious domains", () => {
      expect(normalizeShopifyDomain("evil.com")).toBeNull();
      expect(normalizeShopifyDomain("myshopify.com.evil.com")).toBeNull();
      expect(normalizeShopifyDomain("http://attacker.com/my-store.myshopify.com")).toBeNull();
      expect(normalizeShopifyDomain("attacker.com")).toBeNull();
      expect(normalizeShopifyDomain("https://google.com")).toBeNull();
      expect(normalizeShopifyDomain("")).toBeNull();
      expect(normalizeShopifyDomain(null)).toBeNull();
    });
  });

  describe("3. OAuth State Generation and Verification", () => {
    it("generates and verifies valid state bound to user and shop", async () => {
      const state = generateShopifyOAuthState("user_101", "my-store.myshopify.com");
      expect(state).toBeTypeOf("string");

      const result = await verifyShopifyOAuthState(state, "my-store.myshopify.com");
      expect(result.valid).toBe(true);
      expect(result.uid).toBeTruthy();
      expect(result.shop).toBe("my-store.myshopify.com");
    });

    it("rejects state if shop mismatches expected shop", async () => {
      const state = generateShopifyOAuthState("user_101", "store-a.myshopify.com");
      const result = await verifyShopifyOAuthState(state, "store-b.myshopify.com");

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("shop_mismatch");
    });

    it("rejects replayed state (single-use nonce)", async () => {
      const state = generateShopifyOAuthState("user_102", "my-store.myshopify.com");

      const firstTry = await verifyShopifyOAuthState(state, "my-store.myshopify.com");
      expect(firstTry.valid).toBe(true);

      const secondTry = await verifyShopifyOAuthState(state, "my-store.myshopify.com");
      expect(secondTry.valid).toBe(false);
      expect(secondTry.reason).toBe("replayed_state");
    });

    it("rejects tampered or malformed state", async () => {
      const state = generateShopifyOAuthState("user_103", "my-store.myshopify.com");
      const tampered = state.slice(0, -4) + "XXXX";

      const result = await verifyShopifyOAuthState(tampered, "my-store.myshopify.com");
      expect(result.valid).toBe(false);
    });
  });

  describe("4. Shopify HMAC Verification", () => {
    it("validates legitimate Shopify HMAC signatures using constant-time comparison", () => {
      const secret = "test_shopify_client_secret_456";
      const query = {
        code: "test_code_abc",
        shop: "my-store.myshopify.com",
        state: "some_state_value",
        timestamp: "1700000000",
      };

      // Construct HMAC string matching Shopify's format: sorted query params excluding hmac
      const message = "code=test_code_abc&shop=my-store.myshopify.com&state=some_state_value&timestamp=1700000000";
      const validHmac = crypto.createHmac("sha256", secret).update(message).digest("hex");

      const queryWithHmac = { ...query, hmac: validHmac };
      expect(verifyShopifyHmac(queryWithHmac)).toBe(true);
    });

    it("rejects invalid or tampered HMAC signatures", () => {
      const query = {
        code: "test_code_abc",
        shop: "my-store.myshopify.com",
        state: "some_state_value",
        timestamp: "1700000000",
        hmac: "invalid_hmac_hex_string_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      };

      expect(verifyShopifyHmac(query)).toBe(false);
    });
  });

  describe("5. Code Exchange for Expiring Offline Access Token", () => {
    it("exchanges authorization code requesting expiring=1 and handles offline response", async () => {
      const mockFetcher = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: "shpat_test_access_token_789",
          scope: "read_products,write_products,read_orders",
          expires_in: 86400,
          refresh_token: "shprt_test_refresh_token_123",
          refresh_token_expires_in: 7776000,
        }),
      });

      const res = await exchangeShopifyCode("my-store.myshopify.com", "valid_code_123", mockFetcher as any);

      expect(mockFetcher).toHaveBeenCalledWith(
        "https://my-store.myshopify.com/admin/oauth/access_token",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            client_id: "test_shopify_client_id_123",
            client_secret: "test_shopify_client_secret_456",
            code: "valid_code_123",
            expiring: 1,
          }),
        })
      );

      expect(res.access_token).toBe("shpat_test_access_token_789");
      expect(res.refresh_token).toBe("shprt_test_refresh_token_123");
      expect(res.expires_in).toBe(86400);
    });

    it("throws error when code exchange fails", async () => {
      const mockFetcher = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => "invalid_code",
      });

      await expect(
        exchangeShopifyCode("my-store.myshopify.com", "bad_code", mockFetcher as any)
      ).rejects.toThrow("Shopify token exchange failed (400): invalid_code");
    });
  });

  describe("6. Granted Scope Parsing", () => {
    it("parses granted scopes and identifies missing required scopes", () => {
      const scopeStr = "read_products,write_products,read_orders";
      const parsed = parseShopifyScopes(scopeStr);

      expect(parsed.grantedScopes).toContain("read_products");
      expect(parsed.grantedScopes).toContain("write_products");
      expect(parsed.grantedScopes).toContain("read_orders");
      expect(parsed.missingScopes.length).toBeGreaterThan(0);
      expect(parsed.missingScopes).toContain("write_orders");
    });
  });

  describe("7. Credential Encryption and Storage Integration", () => {
    it("stores encrypted Shopify credential and retrieves cleanly without exposing secrets to client", async () => {
      const canonicalUserId = "user_shopify_test_2026";
      const credentialValues = {
        storeDomain: "test-shop.myshopify.com",
        accessToken: "shpat_secret_access_token",
        refreshToken: "shprt_secret_refresh_token",
        expiresAt: String(Date.now() + 86400000),
        grantedScopes: JSON.stringify(["read_products", "write_products"]),
        is_connected: "true",
      };

      await saveConnectorCredential(canonicalUserId, "shopify", credentialValues);

      const retrieved = await getConnectorCredential(canonicalUserId, "shopify");
      expect(retrieved).toBeDefined();
      expect(retrieved?.connector).toBe("shopify");
      expect(retrieved?.values.accessToken).toBe("shpat_secret_access_token");
      expect(retrieved?.values.storeDomain).toBe("test-shop.myshopify.com");

      const summaryList = await listConnectorCredentials(canonicalUserId);
      const shopifySummary = summaryList.find(c => c.connector === "shopify");
      expect(shopifySummary).toBeDefined();
      // Confirm hint masks sensitive token values in summary
      expect(shopifySummary?.fields.accessToken).not.toBe("shpat_secret_access_token");
      expect(shopifySummary?.fields.accessToken).toContain("…");
    });
  });

  describe("8. Token Refresh Handling and Concurrency Safety", () => {
    it("refreshes expired access token using refresh_token grant", async () => {
      const canonicalUserId = "user_refresh_test";
      const oldValues = {
        storeDomain: "refresh-shop.myshopify.com",
        accessToken: "old_access_token",
        refreshToken: "valid_refresh_token",
        expiresAt: String(Date.now() - 10000), // Expired!
        is_connected: "true",
      };

      const mockFetcher = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: "new_fresh_access_token_999",
          expires_in: 86400,
          refresh_token: "new_fresh_refresh_token_888",
          refresh_token_expires_in: 7776000,
        }),
      });

      const updated = await ensureFreshShopifyToken(canonicalUserId, oldValues, mockFetcher as any);

      expect(mockFetcher).toHaveBeenCalledWith(
        "https://refresh-shop.myshopify.com/admin/oauth/access_token",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            client_id: "test_shopify_client_id_123",
            client_secret: "test_shopify_client_secret_456",
            grant_type: "refresh_token",
            refresh_token: "valid_refresh_token",
          }),
        })
      );

      expect(updated.accessToken).toBe("new_fresh_access_token_999");
      expect(updated.refreshToken).toBe("new_fresh_refresh_token_888");
      expect(Number(updated.expiresAt)).toBeGreaterThan(Date.now());
    });

    it("prevents concurrent refresh requests from racing using in-flight lock", async () => {
      const canonicalUserId = "user_concurrent_test";
      const oldValues = {
        storeDomain: "concurrent-shop.myshopify.com",
        accessToken: "old_access_token",
        refreshToken: "valid_refresh_token",
        expiresAt: String(Date.now() - 10000),
      };

      let resolveFetch: (val: any) => void;
      const delayedPromise = new Promise(resolve => {
        resolveFetch = resolve;
      });

      const mockFetcher = vi.fn().mockImplementation(() =>
        delayedPromise.then(() => ({
          ok: true,
          json: async () => ({
            access_token: "concurrent_access_token_555",
            expires_in: 86400,
            refresh_token: "concurrent_refresh_token_666",
          }),
        }))
      );

      // Trigger two concurrent refresh calls simultaneously
      const req1 = ensureFreshShopifyToken(canonicalUserId, oldValues, mockFetcher as any);
      const req2 = ensureFreshShopifyToken(canonicalUserId, oldValues, mockFetcher as any);

      resolveFetch!({});

      const [res1, res2] = await Promise.all([req1, req2]);

      expect(res1.accessToken).toBe("concurrent_access_token_555");
      expect(res2.accessToken).toBe("concurrent_access_token_555");
      // Must only make 1 HTTP call to Shopify
      expect(mockFetcher).toHaveBeenCalledTimes(1);
    });
  });

  describe("9. User Isolation", () => {
    it("ensures User A cannot access User B's Shopify credentials", async () => {
      const userA = "user_A_1001";
      const userB = "user_B_2002";

      // This test covers isolation only; refresh tokens would trigger live Shopify requests.
      await saveConnectorCredential(userA, "shopify", {
        storeDomain: "user-a.myshopify.com",
        accessToken: "token_A",
      });

      await saveConnectorCredential(userB, "shopify", {
        storeDomain: "user-b.myshopify.com",
        accessToken: "token_B",
      });

      const credA = await getConnectorCredential(userA, "shopify");
      const credB = await getConnectorCredential(userB, "shopify");

      expect(credA?.values.storeDomain).toBe("user-a.myshopify.com");
      expect(credA?.values.accessToken).toBe("token_A");

      expect(credB?.values.storeDomain).toBe("user-b.myshopify.com");
      expect(credB?.values.accessToken).toBe("token_B");
    });
  });
});
