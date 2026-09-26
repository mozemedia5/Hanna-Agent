import { describe, expect, it } from "vitest";
import { handleMcpRequest, listMcpTools } from "./mcpServer";
import { executeConnectorAction } from "./connectorAdapters";
import { synthesizeFallbackResponse } from "./agentCore";

describe("Model Context Protocol (MCP) & E-Commerce Pipeline Suite", () => {
  it("exposes all 17 canonical MCP tools across the 7 servers in tools/list", () => {
    const tools = listMcpTools();
    const toolNames = tools.map(t => t.name);

    const expectedCanonicalTools = [
      "get_product_details",
      "fetch_recent_products",
      "update_product_metafield",
      "generate_avatar_video",
      "check_video_status",
      "generate_ads_from_url",
      "get_creative_assets",
      "send_marketing_email",
      "draft_advanced_sequence",
      "authorize_api_payment",
      "get_wallet_balance",
      "create_ad_campaign",
      "upload_ad_creative",
      "launch_ad_set",
      "fetch_ad_performance_analytics",
      "publish_ugc_post",
      "schedule_social_post",
    ];

    for (const expected of expectedCanonicalTools) {
      expect(toolNames).toContain(expected);
    }
  });

  it("handles JSON-RPC 2.0 tools/list request via handleMcpRequest", async () => {
    const response = (await handleMcpRequest({
      jsonrpc: "2.0",
      id: "req_list_1",
      method: "tools/list",
    })) as any;

    expect(response.jsonrpc).toBe("2.0");
    expect(response.id).toBe("req_list_1");
    expect(Array.isArray(response.result?.tools)).toBe(true);
    expect(response.result.tools.length).toBeGreaterThanOrEqual(17);
  });

  it("executes Shopify Core Engine MCP tool calls", async () => {
    const detailsRes = (await handleMcpRequest({
      jsonrpc: "2.0",
      id: "call_shopify_1",
      method: "tools/call",
      params: {
        name: "get_product_details",
        arguments: { product_id: "gid://shopify/Product/882104" },
      },
    })) as any;

    expect(detailsRes.result?.isError).toBe(false);
    const contentText = detailsRes.result.content[0].text;
    expect(contentText).toContain("AuraGlow Smart Sunset Ambient Lamp");
    expect(contentText).toContain("CJ Dropshipping");
  });

  it("executes HeyGen Digital Twin Media MCP tool calls", async () => {
    const renderRes = (await handleMcpRequest({
      jsonrpc: "2.0",
      id: "call_heygen_1",
      method: "tools/call",
      params: {
        name: "generate_avatar_video",
        arguments: { script: "Transform your room lighting instantly!", avatar_id: "avatar_pro_01" },
      },
    })) as any;

    expect(renderRes.result?.isError).toBe(false);
    expect(renderRes.result.content[0].text).toContain("processing");

    const statusRes = (await handleMcpRequest({
      jsonrpc: "2.0",
      id: "call_heygen_2",
      method: "tools/call",
      params: {
        name: "check_video_status",
        arguments: { video_id: "hg_vid_89321" },
      },
    })) as any;

    expect(statusRes.result.content[0].text).toContain("completed");
    expect(statusRes.result.content[0].text).toContain("https://assets.heygen.com/renders/");
  });

  it("executes Creatify AI Creative Studio MCP tool calls", async () => {
    const adsRes = (await handleMcpRequest({
      jsonrpc: "2.0",
      id: "call_creatify_1",
      method: "tools/call",
      params: {
        name: "generate_ads_from_url",
        arguments: { url: "https://myshop.myshopify.com/products/sunset-lamp", campaign_goal: "CONVERSIONS" },
      },
    })) as any;

    expect(adsRes.result?.isError).toBe(false);
    expect(adsRes.result.content[0].text).toContain("hooks_parsed");
    expect(adsRes.result.content[0].text).toContain("Creatify AI");
  });

  it("executes Gmail Advanced Marketing Hub MCP tool calls", async () => {
    const emailRes = (await handleMcpRequest({
      jsonrpc: "2.0",
      id: "call_gmail_1",
      method: "tools/call",
      params: {
        name: "send_marketing_email",
        arguments: { to: "buyer@example.com", subject: "Your Sunset Lamp Special Offer", tracking_pixel_id: "px_1001" },
      },
    })) as any;

    expect(emailRes.result?.isError).toBe(false);
    expect(emailRes.result.content[0].text).toContain("px_1001");
    expect(emailRes.result.content[0].text).toContain("sent");
  });

  it("enforces billing cap in Integrated Payment Framework MCP tool calls", async () => {
    const walletRes = (await handleMcpRequest({
      jsonrpc: "2.0",
      id: "call_pay_1",
      method: "tools/call",
      params: {
        name: "get_wallet_balance",
        arguments: {},
      },
    })) as any;

    expect(walletRes.result.content[0].text).toContain("412.5");

    const approvedPay = await executeConnectorAction(
      { connector: "integrated-payment", values: { apiKey: "pay_live_123" } },
      { connector: "integrated-payment", action: "authorize_api_payment", parameters: { vendor: "Meta Ads", amount: 50.00 } }
    );
    expect(approvedPay.data).toHaveProperty("status", "APPROVED");

    await expect(
      executeConnectorAction(
        { connector: "integrated-payment", values: { apiKey: "pay_live_123" } },
        { connector: "integrated-payment", action: "authorize_api_payment", parameters: { vendor: "Meta Ads", amount: 999.00 } }
      )
    ).rejects.toThrow("exceeds monthly billing cap");
  });

  it("executes Meta Ads Manager Suite MCP tool calls", async () => {
    const campaignRes = (await handleMcpRequest({
      jsonrpc: "2.0",
      id: "call_meta_1",
      method: "tools/call",
      params: {
        name: "create_ad_campaign",
        arguments: { objective: "OUTCOME_SALES", budget: 150.00 },
      },
    })) as any;

    expect(campaignRes.result?.isError).toBe(false);
    expect(campaignRes.result.content[0].text).toContain("OUTCOME_SALES");

    const analyticsRes = (await handleMcpRequest({
      jsonrpc: "2.0",
      id: "call_meta_2",
      method: "tools/call",
      params: {
        name: "fetch_ad_performance_analytics",
        arguments: { campaign_id: "meta_cmp_40192" },
      },
    })) as any;

    expect(analyticsRes.result.content[0].text).toContain("roas");
    expect(analyticsRes.result.content[0].text).toContain("4.12");
  });

  it("executes Omnichannel Social Media Manager MCP tool calls", async () => {
    const platforms = ["tiktok", "instagram", "facebook", "threads", "x"];

    for (const platform of platforms) {
      const pubRes = (await handleMcpRequest({
        jsonrpc: "2.0",
        id: `call_social_${platform}`,
        method: "tools/call",
        params: {
          name: "publish_ugc_post",
          arguments: { platform, media_url: "https://assets.heygen.com/vids/1.mp4", caption: "Check out this lamp!" },
        },
      })) as any;

      expect(pubRes.result?.isError).toBe(false);
      expect(pubRes.result.content[0].text).toContain("PUBLISHED");
    }
  });

  it("synthesizes structured ChatGPT-style markdown responses for E-Commerce Autonomy Engine requests", () => {
    const response = synthesizeFallbackResponse(
      "Run the E-Commerce Autonomy Engine pipeline for dropshipping sunset lamp product."
    );

    expect(response).toContain("E-Commerce Autonomy Engine");
    expect(response).toContain("Shopify Core Engine");
    expect(response).toContain("HeyGen Digital Twin");
    expect(response).toContain("Creatify AI Studio");
    expect(response).toContain("Meta Ads Manager");
    expect(response).not.toContain("[Attached (metadata-only)");
  });
});
