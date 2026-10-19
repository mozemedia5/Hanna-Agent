import { describe, expect, it, vi } from "vitest";
import { executeConnectorAction } from "./connectorAdapters";
import {
  approveRequest,
  createApprovalRequest,
  getConnectorCredential,
  hasApprovalGrant,
  listConnectorCredentials,
  saveConnectorCredential,
} from "./connectorDb";
import { generateOAuthState, verifyOAuthState } from "./oauthRoutes";
import { appRouter } from "./routers";

describe("authenticated Shopify and Slack connectors", () => {
  it("stores connector secrets encrypted and exposes only hints", async () => {
    await saveConnectorCredential(8101, "slack", {
      botToken: "xoxb-secret-token-1234",
    });
    const listed = JSON.stringify(await listConnectorCredentials(8101));
    expect(listed).not.toContain("xoxb-secret-token-1234");
    expect(listed).toContain("…1234");
  });

  it("exposes only safe account labels for linked Google and Shopify accounts", async () => {
    await saveConnectorCredential(8103, "gmail", {
      account: "owner@example.com",
      access_token: "google-secret-token",
      is_connected: "true",
    });
    await saveConnectorCredential(8103, "shopify", {
      storeDomain: "owner-shop.myshopify.com",
      accessToken: "shopify-secret-token",
      is_connected: "true",
    });
    const listed = await listConnectorCredentials(8103);
    expect(listed.find(item => item.connector === "gmail")?.accountDisplay).toBe("owner@example.com");
    expect(listed.find(item => item.connector === "shopify")?.accountDisplay).toBe("owner-shop.myshopify.com");
    expect(JSON.stringify(listed)).not.toContain("google-secret-token");
    expect(JSON.stringify(listed)).not.toContain("shopify-secret-token");
  });

  it("does not allow execution before approval", async () => {
    const request = await createApprovalRequest(8102, {
      connector: "slack",
      action: "send_message",
      parameters: { channel: "C123", text: "hello" },
    });
    expect(request.status).toBe("pending");
  });

  it("executes Shopify product lookup with the access token only on the server", async () => {
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(
        (init?.headers as Record<string, string>)["X-Shopify-Access-Token"]
      ).toBe("shpat-secret");
      return new Response(
        JSON.stringify({
          data: {
            products: {
              nodes: [{ id: "gid://shopify/Product/1", title: "Notebook" }],
            },
          },
        }),
        { status: 200 }
      );
    });
    const result = await executeConnectorAction(
      {
        connector: "shopify",
        values: {
          storeDomain: "example.myshopify.com",
          accessToken: "shpat-secret",
        },
      },
      {
        connector: "shopify",
        action: "list_products",
        parameters: { first: 10 },
      },
      fetcher as typeof fetch
    );
    expect(result.verification.status).toBe("verified");
    expect(result.summary).toContain("1 Shopify products");
  });

  it("dispatches Shopify catalog search through Storefront MCP without an API key", async () => {
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe("https://example.myshopify.com/api/ucp/mcp");
      expect((init?.headers as Record<string, string>)["content-type"]).toBe("application/json");
      const body = JSON.parse(String(init?.body));
      expect(body.method).toBe("tools/call");
      expect(body.params.name).toBe("search_catalog");
      expect(body.params.arguments.catalog.query).toBe("mugs");
      return new Response(JSON.stringify({ result: { structuredContent: { products: [{ id: "gid://shopify/Product/9" }] } } }), { status: 200 });
    });
    const result = await executeConnectorAction(
      { connector: "shopify", values: { connectionMode: "mcp", storeDomain: "example.myshopify.com" } },
      { connector: "shopify", action: "search_products", parameters: { query: "mugs", first: 10 } },
      fetcher as typeof fetch
    );
    expect(result.verification.status).toBe("verified");
    expect(result.data).toEqual({ structuredContent: { products: [{ id: "gid://shopify/Product/9" }] } });
  });

  it("rejects Shopify Storefront MCP admin-only actions explicitly", async () => {
    await expect(executeConnectorAction(
      { connector: "shopify", values: { connectionMode: "mcp", storeDomain: "example.myshopify.com" } },
      { connector: "shopify", action: "list_orders", parameters: { first: 10 } },
      vi.fn() as typeof fetch
    )).rejects.toThrow("does not expose the 'list_orders' tool");
  });

  it("executes Shopify order retrieval with a verified response", async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ data: { orders: { nodes: [{ id: "gid://shopify/Order/1", name: "#1001" }] } } }), { status: 200 })
    );
    const result = await executeConnectorAction(
      { connector: "shopify", values: { storeDomain: "example.myshopify.com", accessToken: "shpat-secret" } },
      { connector: "shopify", action: "list_orders", parameters: { first: 5 } },
      fetcher as typeof fetch
    );
    expect(result.data).toEqual([{ id: "gid://shopify/Order/1", name: "#1001" }]);
    expect(result.verification.status).toBe("verified");
  });

  it("executes Slack message posting and verifies Slack's timestamp", async () => {
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => {
      expect((init?.headers as Record<string, string>).authorization).toBe(
        "Bearer xoxb-secret"
      );
      const body = JSON.parse(String(init?.body));
      expect(body.text).toBe("Approved update");
      return new Response(
        JSON.stringify({ ok: true, channel: "C123", ts: "1710000000.000100" }),
        { status: 200 }
      );
    });
    const result = await executeConnectorAction(
      { connector: "slack", values: { botToken: "xoxb-secret" } },
      {
        connector: "slack",
        action: "send_message",
        parameters: { channel: "C123", text: "Approved update" },
      },
      fetcher as typeof fetch
    );
    expect(result.verification.detail).toContain("1710000000.000100");
  });

  it("executes a protected Shopify action only after preview and approval", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 8104,
        openId: "connector-owner",
        name: "Owner",
        email: null,
        loginMethod: "firebase",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
      res: {} as any,
    });
    await caller.integrations.saveCredential({
      connector: "shopify",
      values: {
        storeDomain: "example.myshopify.com",
        accessToken: "shpat-router-secret",
      },
    });
    const approval = await caller.integrations.previewAction({
      connector: "shopify",
      action: "list_products",
      parameters: { first: 1 },
    });
    await expect(
      caller.integrations.executeApproved({ approvalId: approval.id })
    ).rejects.toThrow("explicitly approved");
    await caller.integrations.approveAction({ approvalId: approval.id });
    const fetcher = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            data: {
              products: {
                nodes: [{ id: "gid://shopify/Product/2", title: "Verified" }],
              },
            },
          }),
          { status: 200 }
        )
    );
    vi.stubGlobal("fetch", fetcher);
    const result = await caller.integrations.executeApproved({
      approvalId: approval.id,
    });
    expect(result.status).toBe("completed");
    expect(result.verification.status).toBe("verified");
    vi.unstubAllGlobals();
  });

  it("allows a real connector action once/always and persists only the granted scope", async () => {
    const userId = 8110;
    const caller = appRouter.createCaller({
      user: {
        id: userId,
        openId: "connector-scope-owner",
        name: "Owner",
        email: null,
        loginMethod: "firebase",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
      res: {} as any,
    });
    await caller.integrations.saveCredential({
      connector: "shopify",
      values: { storeDomain: "example.myshopify.com", accessToken: "shpat-scope-secret" },
    });
    const approval = await caller.integrations.previewAction({
      connector: "shopify",
      action: "list_orders",
      parameters: { first: 1 },
    });
    const fetcher = vi.fn(async () => new Response(
      JSON.stringify({ data: { orders: { nodes: [{ id: "gid://shopify/Order/42", name: "#1042" }] } } }),
      { status: 200 }
    ));
    vi.stubGlobal("fetch", fetcher);

    const result = await caller.integrations.resolveApproval({
      approvalId: approval.id,
      decision: "always",
    });
    expect(result.status).toBe("completed");
    expect(result.data).toEqual([{ id: "gid://shopify/Order/42", name: "#1042" }]);
    expect(await hasApprovalGrant(userId, "shopify", "list_orders")).toBe(true);
    expect(await hasApprovalGrant(userId, "shopify", "list_products")).toBe(false);
    vi.unstubAllGlobals();
  });

  it("denies a real connector request without executing its adapter", async () => {
    const userId = 8111;
    const caller = appRouter.createCaller({
      user: {
        id: userId,
        openId: "connector-denial-owner",
        name: "Owner",
        email: null,
        loginMethod: "firebase",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
      res: {} as any,
    });
    const approval = await caller.integrations.previewAction({
      connector: "shopify",
      action: "list_products",
      parameters: { first: 1 },
    });
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const result = await caller.integrations.resolveApproval({
      approvalId: approval.id,
      decision: "deny",
    });
    expect(result.status).toBe("denied");
    expect(fetcher).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("marks an approval request approved only for its owner", async () => {
    const request = await createApprovalRequest(8103, {
      connector: "shopify",
      action: "list_products",
      parameters: {},
    });
    expect(await approveRequest(9999, request.id)).toBeUndefined();
    expect((await approveRequest(8103, request.id))?.status).toBe("approved");
  });

  it("rejects catalog-only connector actions instead of fabricating success", async () => {
    await expect(
      executeConnectorAction(
        { connector: "cjdropshipping", values: { connectionMode: "oauth" } },
        {
          connector: "cjdropshipping",
          action: "search_products",
          parameters: { keyword: "shoes" },
        }
      )
    ).rejects.toThrow("does not implement");

    await expect(executeConnectorAction(
      { connector: "vercel", values: { accessToken: "token" } },
      { connector: "vercel", action: "deployments_list", parameters: {} }
    )).rejects.toThrow("does not implement");
  });

  it("uses real authenticated GitHub API results for the prepared repository overview", async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.includes("/user/repos")) {
        return new Response(JSON.stringify([{ full_name: "moze/Hanna-Agent", html_url: "https://github.com/moze/Hanna-Agent", updated_at: "2026-10-19T00:00:00Z" }]), { status: 200 });
      }
      if (url.includes("/issues?")) {
        return new Response(JSON.stringify([{ number: 4, title: "Fix OAuth", html_url: "https://github.com/moze/Hanna-Agent/issues/4", labels: [], created_at: "2026-10-18T00:00:00Z" }]), { status: 200 });
      }
      if (url.includes("/pulls?")) {
        return new Response(JSON.stringify([{ number: 5, title: "Improve connector page", html_url: "https://github.com/moze/Hanna-Agent/pull/5", updated_at: "2026-10-19T00:00:00Z", draft: false }]), { status: 200 });
      }
      return new Response("Not found", { status: 404 });
    });
    const result = await executeConnectorAction(
      { connector: "github", values: { access_token: "github-live-token" } },
      { connector: "github", action: "github_overview", parameters: { repositoryCount: 1 } },
      fetcher as typeof fetch
    );
    expect(result.verification.status).toBe("verified");
    expect(result.summary).toContain("1 GitHub repositories");
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect((result.data as any).repositories[0].openIssues[0].title).toBe("Fix OAuth");
    expect((result.data as any).repositories[0].openPullRequests[0].title).toBe("Improve connector page");
  });

  it("does not claim Google Workspace, Gmail, or Calendar success without an authenticated API response", async () => {
    await expect(executeConnectorAction(
      { connector: "google-workspace", values: { connectionMode: "oauth", account: "user@workspace.com" } },
      { connector: "google-workspace", action: "drive_search", parameters: { query: "Strategy" } }
    )).rejects.toThrow("not connected");

    await expect(executeConnectorAction(
      { connector: "gmail", values: { connectionMode: "oauth", account: "user@gmail.com" } },
      { connector: "gmail", action: "mail_search", parameters: { query: "is:unread" } }
    )).rejects.toThrow("not connected");

    await expect(executeConnectorAction(
      { connector: "google-calendar", values: { connectionMode: "oauth", account: "user@gmail.com" } },
      { connector: "google-calendar", action: "calendar_read", parameters: {} }
    )).rejects.toThrow("not connected");
  });

  it("verifies Google OAuth state and isolates each Google service credential", async () => {
    const testUserId = `user123-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const state = generateOAuthState(testUserId, "google");
    const verified = verifyOAuthState(state, "google");
    expect(verified.valid).toBe(true);
    expect(verified.uid).toBe(testUserId);

    await saveConnectorCredential(testUserId, "google-workspace", {
      access_token: "test_access_token_123",
      is_connected: "true",
    });

    expect(await getConnectorCredential(testUserId, "gmail")).toBeUndefined();
    await saveConnectorCredential(testUserId, "gmail", { access_token: "gmail_token_456", is_connected: "true" });
    const gmailCred = await getConnectorCredential(testUserId, "gmail");
    expect(gmailCred?.values.access_token).toBe("gmail_token_456");
  });
});
