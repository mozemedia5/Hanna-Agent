import { describe, expect, it, vi } from "vitest";
import { executeConnectorAction } from "./connectorAdapters";
import {
  approveRequest,
  createApprovalRequest,
  listConnectorCredentials,
  saveConnectorCredential,
} from "./connectorDb";
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

  it("does not allow execution before approval", () => {
    const request = createApprovalRequest(8102, {
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

  it("marks an approval request approved only for its owner", () => {
    const request = createApprovalRequest(8103, {
      connector: "shopify",
      action: "list_products",
      parameters: {},
    });
    expect(approveRequest(9999, request.id)).toBeUndefined();
    expect(approveRequest(8103, request.id)?.status).toBe("approved");
  });

  it("fails safely and explicitly for unimplemented connectors without returning fake success", async () => {
    await expect(
      executeConnectorAction(
        { connector: "cjdropshipping", values: { apiKey: "fake-key" } },
        {
          connector: "cjdropshipping",
          action: "search_products",
          parameters: { keyword: "shoes" },
        }
      )
    ).rejects.toThrow("not implemented yet");
  });
});
