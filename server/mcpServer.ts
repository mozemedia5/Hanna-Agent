/*
 * Model Context Protocol (MCP) Server
 * Exposes connected plugins and tools via JSON-RPC 2.0 (tools/list, tools/call)
 */

import { integrations } from "../shared/integrations";
import { executeConnectorAction } from "./connectorAdapters";
import { getConnectorCredential, type ConnectorCredential } from "./connectorDb";

export type McpToolSchema = {
  name: string;
  description: string;
  category: string;
  provider: string;
  capabilities: string[];
  inputSchema: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
};

export type McpRequest =
  | { jsonrpc: "2.0"; id: number | string; method: "tools/list" }
  | {
      jsonrpc: "2.0";
      id: number | string;
      method: "tools/call";
      params: { name: string; arguments?: Record<string, unknown> };
    };

export const CANONICAL_TOOL_MAPPINGS: Record<
  string,
  {
    provider: string;
    action: string;
    description: string;
    properties: Record<string, { type: string; description: string }>;
  }
> = {
  get_product_details: {
    provider: "shopify",
    action: "get_product_details",
    description:
      "Shopify Core Engine: Extract product nodes, catalog metadata, inventory, and CJ/AutoDS sync status.",
    properties: {
      product_id: { type: "string", description: "Shopify product ID or handle" },
    },
  },
  fetch_recent_products: {
    provider: "shopify",
    action: "fetch_recent_products",
    description: "Shopify Core Engine: Fetch recently pushed inventory items.",
    properties: {
      limit: {
        type: "number",
        description: "Maximum number of recent products to return",
      },
    },
  },
  update_product_metafield: {
    provider: "shopify",
    action: "update_product_metafield",
    description: "Shopify Core Engine: Update product metafield entry.",
    properties: {
      product_id: { type: "string", description: "Target Shopify product ID" },
      key: { type: "string", description: "Metafield key identifier" },
      value: { type: "string", description: "Metafield string or JSON value" },
    },
  },
  generate_avatar_video: {
    provider: "heygen",
    action: "generate_avatar_video",
    description:
      "HeyGen Digital Twin Media: Construct highly realistic avatar video ads.",
    properties: {
      script: {
        type: "string",
        description: "Spoken video script or product copy",
      },
      avatar_id: { type: "string", description: "HeyGen AI avatar model ID" },
      template_id: {
        type: "string",
        description: "Video template or framing identifier",
      },
    },
  },
  check_video_status: {
    provider: "heygen",
    action: "check_video_status",
    description:
      "HeyGen Digital Twin Media: Poll render status and video asset URL.",
    properties: {
      video_id: {
        type: "string",
        description: "Generated video render job ID",
      },
    },
  },
  generate_ads_from_url: {
    provider: "creatify",
    action: "generate_ads_from_url",
    description:
      "Creatify AI Creative Studio: Convert public Shopify URL into rapid static/video ad variations.",
    properties: {
      url: { type: "string", description: "Product landing page URL" },
      target_audience: {
        type: "string",
        description: "Target demographic or interest profile",
      },
      campaign_goal: {
        type: "string",
        description: "Campaign conversion objective",
      },
    },
  },
  get_creative_assets: {
    provider: "creatify",
    action: "get_creative_assets",
    description:
      "Creatify AI Creative Studio: Retrieve generated social ad variations and video assets.",
    properties: {
      campaign_id: {
        type: "string",
        description: "Creatify creative campaign ID",
      },
    },
  },
  send_marketing_email: {
    provider: "gmail",
    action: "send_marketing_email",
    description:
      "Gmail Advanced Marketing Hub: Send targeted conversational or marketing email.",
    properties: {
      to: { type: "string", description: "Recipient customer email address" },
      subject: { type: "string", description: "Email subject line" },
      html_body: { type: "string", description: "HTML email body content" },
      tracking_pixel_id: {
        type: "string",
        description: "Tracking pixel ID for conversion tracking",
      },
    },
  },
  draft_advanced_sequence: {
    provider: "gmail",
    action: "draft_advanced_sequence",
    description:
      "Gmail Advanced Marketing Hub: Auto-generate post-purchase promotional sequence.",
    properties: {
      customer_segment: {
        type: "string",
        description: "Customer segment identifier",
      },
    },
  },
  authorize_api_payment: {
    provider: "integrated-payment",
    action: "authorize_api_payment",
    description:
      "Integrated Payment Framework: Authorize API action payment within spending cap.",
    properties: {
      vendor: { type: "string", description: "Target API service vendor name" },
      amount: { type: "number", description: "Payment amount in USD" },
      currency: { type: "string", description: "Currency code (default USD)" },
    },
  },
  get_wallet_balance: {
    provider: "integrated-payment",
    action: "get_wallet_balance",
    description:
      "Integrated Payment Framework: Fetch live API ad spend wallet balance and ledger.",
    properties: {},
  },
  create_ad_campaign: {
    provider: "meta-ads",
    action: "create_ad_campaign",
    description:
      "Meta Ads Manager Suite: Create optimized advertising campaign.",
    properties: {
      objective: {
        type: "string",
        description: "Ad campaign objective (OUTCOME_SALES, CONVERSIONS)",
      },
      budget: {
        type: "number",
        description: "Daily or lifetime campaign budget in USD",
      },
    },
  },
  upload_ad_creative: {
    provider: "meta-ads",
    action: "upload_ad_creative",
    description:
      "Meta Ads Manager Suite: Upload video or image creative asset.",
    properties: {
      video_url: {
        type: "string",
        description: "High-resolution video asset URL",
      },
      image_url: {
        type: "string",
        description: "Thumbnail or static image URL",
      },
    },
  },
  launch_ad_set: {
    provider: "meta-ads",
    action: "launch_ad_set",
    description:
      "Meta Ads Manager Suite: Launch targeted ad set with creatives.",
    properties: {
      targeting_criteria: {
        type: "object",
        description: "Demographic and interest targeting rules",
      },
      creatives_list: {
        type: "array",
        description: "List of uploaded ad creative IDs",
      },
    },
  },
  fetch_ad_performance_analytics: {
    provider: "meta-ads",
    action: "fetch_ad_performance_analytics",
    description:
      "Meta Ads Manager Suite: Fetch campaign ROAS, CTR, impressions, and conversions.",
    properties: {
      campaign_id: { type: "string", description: "Meta campaign ID" },
    },
  },
  publish_ugc_post: {
    provider: "omnichannel-social",
    action: "publish_ugc_post",
    description:
      "Omnichannel Social Media Manager: Multi-network UGC video and post publisher.",
    properties: {
      platform: {
        type: "string",
        description:
          "Target social network (tiktok, instagram, facebook, threads, x)",
      },
      media_url: { type: "string", description: "Video or image media URL" },
      caption: { type: "string", description: "Post caption copy" },
      hashtags: { type: "array", description: "Hashtag list" },
    },
  },
  schedule_social_post: {
    provider: "omnichannel-social",
    action: "schedule_social_post",
    description:
      "Omnichannel Social Media Manager: Schedule cross-platform social media post.",
    properties: {
      platform: { type: "string", description: "Target social network" },
      timestamp: { type: "string", description: "ISO schedule timestamp" },
      media_url: { type: "string", description: "Media URL" },
    },
  },
};

export function listMcpTools(): McpToolSchema[] {
  const tools: McpToolSchema[] = [];

  // 1. Add canonical tools first
  for (const [toolName, info] of Object.entries(CANONICAL_TOOL_MAPPINGS)) {
    tools.push({
      name: toolName,
      description: info.description,
      category: "mcp",
      provider: info.provider,
      capabilities: [info.action],
      inputSchema: {
        type: "object",
        properties: info.properties,
      },
    });
  }

  // 2. Add provider.capability scoped tools
  for (const integration of integrations) {
    for (const capability of integration.capabilities) {
      const actionName = capability.replace(/[:/]/g, "_");
      const scopedName = `${integration.id}.${actionName}`;
      if (!tools.some(t => t.name === scopedName)) {
        tools.push({
          name: scopedName,
          description: `${integration.name}: ${integration.description} (Capability: ${capability})`,
          category: integration.category,
          provider: integration.id,
          capabilities: [capability],
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query or target entity filter",
              },
              id: { type: "string", description: "Resource or entity ID" },
              parameters: {
                type: "object",
                description: "Action arguments and context",
              },
            },
          },
        });
      }
    }
  }

  return tools;
}

export async function handleMcpRequest(
  request: McpRequest,
  userId?: number
): Promise<Record<string, unknown>> {
  if (request.method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        tools: listMcpTools(),
      },
    };
  }

  if (request.method === "tools/call") {
    const { name, arguments: args = {} } = request.params;

    let connectorId = "";
    let actionName = "";

    if (CANONICAL_TOOL_MAPPINGS[name]) {
      connectorId = CANONICAL_TOOL_MAPPINGS[name].provider;
      actionName = CANONICAL_TOOL_MAPPINGS[name].action;
    } else {
      const parts = name.split(".");
      connectorId = parts[0] || "";
      actionName = parts.slice(1).join(".");
    }

    if (!connectorId || !actionName) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32602, message: `Invalid tool name: '${name}'.` },
      };
    }

    let credential: ConnectorCredential | undefined;
    if (userId) {
      credential = await getConnectorCredential(userId, connectorId as any);
    }
    if (!credential) {
      credential = {
        connector: connectorId as any,
        values: { oauth_authenticated: "true" },
      };
    }

    try {
      const result = await executeConnectorAction(credential, {
        connector: connectorId as any,
        action: actionName,
        parameters: args,
      });

      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: false,
        },
      };
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32603,
          message: err instanceof Error ? err.message : "MCP execution failed.",
        },
      };
    }
  }

  return {
    jsonrpc: "2.0",
    id: (request as any).id ?? null,
    error: { code: -32601, message: "Method not found" },
  };
}
