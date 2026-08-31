export type IntegrationCategory =
  | "commerce"
  | "content_creation"
  | "communication"
  | "social"
  | "workspace"
  | "developer"
  | "media"
  | "custom_mcp";

export type ConnectorId =
  | "shopify"
  | "cjdropshipping"
  | "autods"
  | "zendrop"
  | "takeapp"
  | "heygen"
  | "synthesia"
  | "elevenlabs"
  | "jules"
  | "stitch"
  | "v0"
  | "tiktok"
  | "instagram"
  | "youtube"
  | "pinterest"
  | "linktree"
  | "whatsapp"
  | "slack"
  | "github"
  | "vercel"
  | "google-workspace"
  | "openai"
  | "anthropic"
  | "gemini"
  | "google-trends"
  | "meta-ads"
  | "google-ads"
  | "gmail"
  | "mcp-custom";

export type IntegrationDefinition = {
  id: ConnectorId;
  name: string;
  category: IntegrationCategory;
  credentialFields: string[];
  capabilities: string[];
  requiresApproval: boolean;
  description: string;
  supportsMcp?: boolean;
};

export const integrations: IntegrationDefinition[] = [
  // Commerce & Dropshipping
  {
    id: "shopify",
    name: "Shopify",
    category: "commerce",
    credentialFields: ["accessToken", "storeDomain"],
    capabilities: ["read_products", "write_products", "read_orders"],
    requiresApproval: true,
    description: "Connect your Shopify store to manage products, catalog, and orders.",
  },
  {
    id: "cjdropshipping",
    name: "CJ Dropshipping",
    category: "commerce",
    credentialFields: ["apiKey", "email"],
    capabilities: ["search_products", "import_products", "sync_orders"],
    requiresApproval: true,
    description: "Automate product sourcing, inventory sync, and order fulfillment via CJ Dropshipping API.",
  },
  {
    id: "autods",
    name: "AutoDS",
    category: "commerce",
    credentialFields: ["apiKey", "storeId"],
    capabilities: ["sync_inventory", "auto_order", "price_monitor"],
    requiresApproval: true,
    description: "Automate dropshipping product imports, price updates, and automated ordering.",
  },
  {
    id: "zendrop",
    name: "Zendrop",
    category: "commerce",
    credentialFields: ["apiKey"],
    capabilities: ["catalog_search", "order_fulfill"],
    requiresApproval: true,
    description: "Fast US dropshipping fulfillment, custom branding, and automated order processing.",
  },
  {
    id: "takeapp",
    name: "Take.app",
    category: "commerce",
    credentialFields: ["apiKey", "storeSlug"],
    capabilities: ["read_orders", "manage_catalog", "whatsapp_checkout"],
    requiresApproval: true,
    description: "WhatsApp-first store platform to manage storefront orders and instant checkout links.",
  },

  // Content Creation & AI Media
  {
    id: "heygen",
    name: "HeyGen",
    category: "content_creation",
    credentialFields: ["apiKey"],
    capabilities: ["generate_avatar_video", "translate_video", "list_avatars"],
    requiresApproval: true,
    description: "Generate studio-grade AI avatar videos, video translations, and custom digital humans.",
  },
  {
    id: "synthesia",
    name: "Synthesia",
    category: "content_creation",
    credentialFields: ["apiKey"],
    capabilities: ["generate_video", "list_templates", "list_voices"],
    requiresApproval: true,
    description: "Create AI videos with lifelike avatars and natural text-to-speech voiceovers.",
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    category: "content_creation",
    credentialFields: ["apiKey"],
    capabilities: ["text_to_speech", "voice_clone", "sound_effects"],
    requiresApproval: false,
    description: "Realistic AI speech generation, voice cloning, and audio content creation.",
  },
  {
    id: "jules",
    name: "Jules AI",
    category: "content_creation",
    credentialFields: ["apiKey"],
    capabilities: ["agent_code_gen", "task_execution"],
    requiresApproval: true,
    description: "Autonomous AI software engineering agent integration.",
  },
  {
    id: "stitch",
    name: "Stitch AI",
    category: "content_creation",
    credentialFields: ["apiKey"],
    capabilities: ["ui_design_gen", "component_export"],
    requiresApproval: false,
    description: "AI UI/UX design generation and design system component stitching.",
  },
  {
    id: "v0",
    name: "v0 by Vercel",
    category: "content_creation",
    credentialFields: ["apiKey"],
    capabilities: ["generate_react_ui", "code_refactor"],
    requiresApproval: false,
    description: "Generative UI system powered by AI for React and Tailwind CSS components.",
  },

  // Social & Content Channels
  {
    id: "tiktok",
    name: "TikTok",
    category: "social",
    credentialFields: ["accessToken"],
    capabilities: ["profile:read", "content:publish", "analytics:read"],
    requiresApproval: true,
    description: "Publish short-form videos, analyze video performance, and manage creator profile.",
  },
  {
    id: "instagram",
    name: "Instagram",
    category: "social",
    credentialFields: ["accessToken", "businessAccountId"],
    capabilities: ["media:read", "content:publish", "insights:read"],
    requiresApproval: true,
    description: "Publish Instagram Reels/Posts, reply to comments, and view engagement analytics.",
  },
  {
    id: "youtube",
    name: "YouTube",
    category: "media",
    credentialFields: ["oauthRefreshToken"],
    capabilities: ["videos:read", "videos:upload", "shorts:publish"],
    requiresApproval: true,
    description: "Upload YouTube videos/Shorts, manage channel metadata, and view video analytics.",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    category: "social",
    credentialFields: ["accessToken", "boardId"],
    capabilities: ["pins:create", "boards:read", "analytics:read"],
    requiresApproval: true,
    description: "Publish visual Pins, manage moodboards, and track drive-to-store traffic.",
  },
  {
    id: "linktree",
    name: "Linktree",
    category: "social",
    credentialFields: ["apiKey"],
    capabilities: ["links:read", "links:update", "analytics:read"],
    requiresApproval: true,
    description: "Update bio links, featured product URLs, and analyze link click-through rates.",
  },

  // Communication & Messaging
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    category: "communication",
    credentialFields: ["accessToken", "phoneNumberId"],
    capabilities: ["messages:send", "templates:read", "broadcast:send"],
    requiresApproval: true,
    description: "Send automated WhatsApp order updates, support messages, and campaign broadcasts.",
  },
  {
    id: "slack",
    name: "Slack",
    category: "communication",
    credentialFields: ["botToken"],
    capabilities: ["channels:read", "groups:read", "chat:write"],
    requiresApproval: true,
    description: "Send team notifications, broadcast operational updates, and read channel messages.",
  },

  // Developer & Workspace
  {
    id: "github",
    name: "GitHub",
    category: "developer",
    credentialFields: ["personalAccessToken"],
    capabilities: ["repo:read", "issues:write", "pulls:write"],
    requiresApproval: true,
    description: "Manage repositories, create issues/pull requests, and trigger CI workflows.",
  },
  {
    id: "vercel",
    name: "Vercel",
    category: "developer",
    credentialFields: ["token"],
    capabilities: ["projects:read", "deployments:read", "deployments:create"],
    requiresApproval: true,
    description: "Deploy frontend applications, monitor build logs, and manage domain settings.",
  },
  {
    id: "google-workspace",
    name: "Google Workspace",
    category: "workspace",
    credentialFields: ["oauthRefreshToken"],
    capabilities: ["drive:read", "docs:read", "sheets:read", "calendar:read"],
    requiresApproval: true,
    description: "Access Google Docs, Sheets, Drive files, and Calendar schedule.",
  },

  // AI Model Providers
  {
    id: "openai",
    name: "OpenAI",
    category: "developer",
    credentialFields: ["apiKey"],
    capabilities: ["chat:completion", "image:generate", "audio:transcribe"],
    requiresApproval: false,
    description: "Access GPT-4o, DALL-E, Whisper, and the full OpenAI model suite.",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    category: "developer",
    credentialFields: ["apiKey"],
    capabilities: ["chat:completion", "long-context", "code-analysis"],
    requiresApproval: false,
    description: "Access Claude models for advanced reasoning, coding, and long-context analysis.",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    category: "developer",
    credentialFields: ["apiKey"],
    capabilities: ["chat:completion", "multimodal", "grounding"],
    requiresApproval: false,
    description: "Access Gemini models for multimodal AI, long-context, and Google integration.",
  },

  // Google Services
  {
    id: "google-trends",
    name: "Google Trends",
    category: "workspace",
    credentialFields: ["apiKey"],
    capabilities: ["trends:read", "explore:read", "suggestions:read"],
    requiresApproval: false,
    description: "Query Google Trends data for keyword research, market analysis, and content planning.",
  },
  {
    id: "gmail",
    name: "Gmail",
    category: "communication",
    credentialFields: ["oauthRefreshToken"],
    capabilities: ["mail:read", "mail:send", "labels:read"],
    requiresApproval: true,
    description: "Read, send, and manage Gmail messages for automated outreach and support workflows.",
  },

  // Advertising
  {
    id: "meta-ads",
    name: "Meta Ads Manager",
    category: "social",
    credentialFields: ["accessToken", "adAccountId"],
    capabilities: ["campaigns:read", "campaigns:create", "insights:read"],
    requiresApproval: true,
    description: "Manage Facebook and Instagram ad campaigns, audiences, and performance reporting.",
  },
  {
    id: "google-ads",
    name: "Google Ads",
    category: "social",
    credentialFields: ["developerToken", "customerId"],
    capabilities: ["campaigns:read", "campaigns:manage", "reports:read"],
    requiresApproval: true,
    description: "Manage Google Search and Display ad campaigns with performance reporting.",
  },

  // Custom MCP Server
  {
    id: "mcp-custom",
    name: "Custom MCP Server",
    category: "custom_mcp",
    credentialFields: ["serverUrl", "token"],
    capabilities: ["custom:tool", "mcp:discover"],
    requiresApproval: true,
    description: "Connect any custom app or service via Model Context Protocol (MCP) tool discovery.",
    supportsMcp: true,
  },
];

export function getIntegration(id: string) {
  return integrations.find(integration => integration.id === id);
}
