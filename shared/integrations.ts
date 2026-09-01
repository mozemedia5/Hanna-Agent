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
  docUrl: string;
  instructions: string[];
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
    docUrl: "https://shopify.dev/docs/apps/auth/admin-app-access-tokens",
    instructions: [
      "Go to your Shopify Admin panel -> Settings -> Apps and sales channels.",
      "Click 'Develop apps' and create an app named 'Hanna Agent'.",
      "Under 'Admin API access scopes', grant permissions for Read/Write Products and Orders.",
      "Install the app and copy your Admin API Access Token starting with 'shpat_'.",
      "Enter your myshopify.com domain (e.g. myshop.myshopify.com) and token below."
    ],
  },
  {
    id: "cjdropshipping",
    name: "CJ Dropshipping",
    category: "commerce",
    credentialFields: ["apiKey", "email"],
    capabilities: ["search_products", "import_products", "sync_orders"],
    requiresApproval: true,
    description: "Automate product sourcing, inventory sync, and order fulfillment via CJ Dropshipping API.",
    docUrl: "https://cjdropshipping.com/myCJ.html#/apikey",
    instructions: [
      "Log into your CJ Dropshipping account.",
      "Navigate to My CJ -> Authorization / API -> API Key.",
      "Generate an API key and copy it.",
      "Paste your API key and account email address below."
    ],
  },
  {
    id: "autods",
    name: "AutoDS",
    category: "commerce",
    credentialFields: ["apiKey", "storeId"],
    capabilities: ["sync_inventory", "auto_order", "price_monitor"],
    requiresApproval: true,
    description: "Automate dropshipping product imports, price updates, and automated ordering.",
    docUrl: "https://platform.autods.com/settings/api",
    instructions: [
      "Log into AutoDS platform settings.",
      "Go to Settings -> API Settings.",
      "Generate a new API Secret Token and copy your Store ID.",
      "Paste both credentials in the fields below."
    ],
  },
  {
    id: "zendrop",
    name: "Zendrop",
    category: "commerce",
    credentialFields: ["apiKey"],
    capabilities: ["catalog_search", "order_fulfill"],
    requiresApproval: true,
    description: "Fast US dropshipping fulfillment, custom branding, and automated order processing.",
    docUrl: "https://app.zendrop.com/settings/api",
    instructions: [
      "Log into Zendrop Dashboard.",
      "Go to Settings -> API Integrations.",
      "Generate an API Key for external automation.",
      "Paste the API key below."
    ],
  },
  {
    id: "takeapp",
    name: "Take.app",
    category: "commerce",
    credentialFields: ["apiKey", "storeSlug"],
    capabilities: ["read_orders", "manage_catalog", "whatsapp_checkout"],
    requiresApproval: true,
    description: "WhatsApp-first store platform to manage storefront orders and instant checkout links.",
    docUrl: "https://take.app/docs/api",
    instructions: [
      "Open your Take.app store dashboard.",
      "Navigate to Developer Settings -> API Access.",
      "Copy your Store Slug and API Key.",
      "Enter both values below."
    ],
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
    docUrl: "https://docs.heygen.com/reference/api-key-1",
    instructions: [
      "Log into HeyGen Space.",
      "Go to Space Settings -> API -> API Key.",
      "Click 'Generate API Key' and copy the token.",
      "Paste your HeyGen API key below."
    ],
  },
  {
    id: "synthesia",
    name: "Synthesia",
    category: "content_creation",
    credentialFields: ["apiKey"],
    capabilities: ["generate_video", "list_templates", "list_voices"],
    requiresApproval: true,
    description: "Create AI videos with lifelike avatars and natural text-to-speech voiceovers.",
    docUrl: "https://docs.synthesia.io/getting-started/api-keys",
    instructions: [
      "Log into your Synthesia account.",
      "Go to Account Settings -> API Keys.",
      "Create a new API Key with full video generation scope.",
      "Paste the API Key below."
    ],
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    category: "content_creation",
    credentialFields: ["apiKey"],
    capabilities: ["text_to_speech", "voice_clone", "sound_effects"],
    requiresApproval: false,
    description: "Realistic AI speech generation, voice cloning, and audio content creation.",
    docUrl: "https://elevenlabs.io/docs/api-reference/text-to-speech",
    instructions: [
      "Log into ElevenLabs.",
      "Click on your profile icon at the bottom left -> Profile & API Keys.",
      "Click 'Show API Key' and copy it.",
      "Paste the API key below."
    ],
  },
  {
    id: "jules",
    name: "Jules AI",
    category: "content_creation",
    credentialFields: ["apiKey"],
    capabilities: ["agent_code_gen", "task_execution"],
    requiresApproval: true,
    description: "Autonomous AI software engineering agent integration.",
    docUrl: "https://jules.google/docs",
    instructions: [
      "Access Google Jules Developer Console.",
      "Go to API & Authentication Settings.",
      "Create a new Agent API key for Jules.",
      "Paste your Jules API Key below."
    ],
  },
  {
    id: "stitch",
    name: "Stitch AI",
    category: "content_creation",
    credentialFields: ["apiKey"],
    capabilities: ["ui_design_gen", "component_export"],
    requiresApproval: false,
    description: "AI UI/UX design generation and design system component stitching.",
    docUrl: "https://stitch.google/docs",
    instructions: [
      "Log into Google Stitch UI Developer Console.",
      "Navigate to API Keys section.",
      "Generate an API Token for component generation.",
      "Paste your Stitch API token below."
    ],
  },
  {
    id: "v0",
    name: "v0 by Vercel",
    category: "content_creation",
    credentialFields: ["apiKey"],
    capabilities: ["generate_react_ui", "code_refactor"],
    requiresApproval: false,
    description: "Generative UI system powered by AI for React and Tailwind CSS components.",
    docUrl: "https://v0.dev/docs/api",
    instructions: [
      "Log into your v0.dev account.",
      "Go to Settings -> API Keys.",
      "Create a new v0 API Secret Token.",
      "Paste the key below."
    ],
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
    docUrl: "https://developers.tiktok.com/doc/overview",
    instructions: [
      "Go to TikTok Developer Portal and create a TikTok App.",
      "Enable Content Posting API and User Info permissions.",
      "Generate a Creator Access Token.",
      "Paste the Access Token below."
    ],
  },
  {
    id: "instagram",
    name: "Instagram",
    category: "social",
    credentialFields: ["accessToken", "businessAccountId"],
    capabilities: ["media:read", "content:publish", "insights:read"],
    requiresApproval: true,
    description: "Publish Instagram Reels/Posts, reply to comments, and view engagement analytics.",
    docUrl: "https://developers.facebook.com/docs/instagram-api",
    instructions: [
      "Open Meta for Developers Console.",
      "Configure Instagram Graph API for your Business Account.",
      "Copy your Business Account ID and User Access Token.",
      "Paste both credentials below."
    ],
  },
  {
    id: "youtube",
    name: "YouTube",
    category: "media",
    credentialFields: ["oauthRefreshToken"],
    capabilities: ["videos:read", "videos:upload", "shorts:publish"],
    requiresApproval: true,
    description: "Upload YouTube videos/Shorts, manage channel metadata, and view video analytics.",
    docUrl: "https://developers.google.com/youtube/v3",
    instructions: [
      "Open Google Cloud Console -> YouTube Data API v3.",
      "Create OAuth 2.0 Credentials with youtube.upload scope.",
      "Generate and copy your OAuth Refresh Token.",
      "Paste the Refresh Token below."
    ],
  },
  {
    id: "pinterest",
    name: "Pinterest",
    category: "social",
    credentialFields: ["accessToken", "boardId"],
    capabilities: ["pins:create", "boards:read", "analytics:read"],
    requiresApproval: true,
    description: "Publish visual Pins, manage moodboards, and track drive-to-store traffic.",
    docUrl: "https://developers.pinterest.com/docs/api/v5",
    instructions: [
      "Log into Pinterest Developers App Console.",
      "Generate an OAuth Access Token with pins:write and boards:read permissions.",
      "Copy your default Board ID.",
      "Fill in both fields below."
    ],
  },
  {
    id: "linktree",
    name: "Linktree",
    category: "social",
    credentialFields: ["apiKey"],
    capabilities: ["links:read", "links:update", "analytics:read"],
    requiresApproval: true,
    description: "Update bio links, featured product URLs, and analyze link click-through rates.",
    docUrl: "https://developer.linktr.ee/docs",
    instructions: [
      "Open Linktree Developer Portal.",
      "Generate an API Access Token for link management.",
      "Copy and paste your API key below."
    ],
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
    docUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api",
    instructions: [
      "Go to Meta for Developers -> WhatsApp -> API Setup.",
      "Copy your System User Permanent Access Token.",
      "Copy your Phone Number ID.",
      "Paste both values below."
    ],
  },
  {
    id: "slack",
    name: "Slack",
    category: "communication",
    credentialFields: ["botToken"],
    capabilities: ["channels:read", "groups:read", "chat:write"],
    requiresApproval: true,
    description: "Send team notifications, broadcast operational updates, and read channel messages.",
    docUrl: "https://api.slack.com/authentication/token-types#bot",
    instructions: [
      "Go to api.slack.com/apps and create an app for your workspace.",
      "Under OAuth & Permissions, add chat:write and channels:read scopes.",
      "Install app to workspace and copy Bot User OAuth Token starting with 'xoxb-'.",
      "Paste token below."
    ],
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
    docUrl: "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens",
    instructions: [
      "Go to GitHub Settings -> Developer settings -> Personal access tokens (Fine-grained or Classic).",
      "Generate a token with repo, read:user, and workflow scopes.",
      "Copy token starting with 'ghp_' or 'github_pat_'.",
      "Paste token below."
    ],
  },
  {
    id: "vercel",
    name: "Vercel",
    category: "developer",
    credentialFields: ["token"],
    capabilities: ["projects:read", "deployments:read", "deployments:create"],
    requiresApproval: true,
    description: "Deploy frontend applications, monitor build logs, and manage domain settings.",
    docUrl: "https://vercel.com/docs/rest-api",
    instructions: [
      "Log into Vercel Account Settings -> Tokens.",
      "Create a new access token with Full Account scope.",
      "Copy and paste your Vercel Token below."
    ],
  },
  {
    id: "google-workspace",
    name: "Google Workspace",
    category: "workspace",
    credentialFields: ["oauthRefreshToken"],
    capabilities: ["drive:read", "docs:read", "sheets:read", "calendar:read"],
    requiresApproval: true,
    description: "Access Google Docs, Sheets, Drive files, and Calendar schedule.",
    docUrl: "https://developers.google.com/workspace",
    instructions: [
      "Go to Google Cloud Console -> APIs & Services -> Credentials.",
      "Create OAuth 2.0 Client ID for Desktop/Web.",
      "Generate a Refresh Token with Google Drive/Docs API scopes enabled.",
      "Paste the Refresh Token below."
    ],
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
    docUrl: "https://platform.openai.com/api-keys",
    instructions: [
      "Log into platform.openai.com.",
      "Go to API Keys in the left navigation menu.",
      "Click 'Create new secret key'.",
      "Copy key starting with 'sk-' and paste below."
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    category: "developer",
    credentialFields: ["apiKey"],
    capabilities: ["chat:completion", "long-context", "code-analysis"],
    requiresApproval: false,
    description: "Access Claude models for advanced reasoning, coding, and long-context analysis.",
    docUrl: "https://docs.anthropic.com/en/api/getting-started",
    instructions: [
      "Log into console.anthropic.com.",
      "Go to Settings -> API Keys.",
      "Create a key starting with 'sk-ant-'.",
      "Paste your API Key below."
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    category: "developer",
    credentialFields: ["apiKey"],
    capabilities: ["chat:completion", "multimodal", "grounding"],
    requiresApproval: false,
    description: "Access Gemini models for multimodal AI, long-context, and Google integration.",
    docUrl: "https://ai.google.dev/gemini-api/docs/api-key",
    instructions: [
      "Go to Google AI Studio (aistudio.google.com).",
      "Click 'Get API Key' -> 'Create API key in new project'.",
      "Copy your key starting with 'AIzaSy...'.",
      "Paste your API Key below."
    ],
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
    docUrl: "https://serpapi.com/google-trends-api",
    instructions: [
      "Get a SerpApi or Google Trends Proxy API Key.",
      "Copy your API Key.",
      "Paste it below."
    ],
  },
  {
    id: "gmail",
    name: "Gmail",
    category: "communication",
    credentialFields: ["oauthRefreshToken"],
    capabilities: ["mail:read", "mail:send", "labels:read"],
    requiresApproval: true,
    description: "Read, send, and manage Gmail messages for automated outreach and support workflows.",
    docUrl: "https://developers.google.com/gmail/api/guides",
    instructions: [
      "Enable Gmail API in Google Cloud Console.",
      "Create OAuth 2.0 Credentials with gmail.modify scope.",
      "Generate OAuth Refresh Token.",
      "Paste token below."
    ],
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
    docUrl: "https://developers.facebook.com/docs/marketing-apis",
    instructions: [
      "Log into Meta Marketing API Console.",
      "Generate Long-lived Access Token with ads_management scope.",
      "Copy your Ad Account ID (e.g. act_123456789).",
      "Paste both credentials below."
    ],
  },
  {
    id: "google-ads",
    name: "Google Ads",
    category: "social",
    credentialFields: ["developerToken", "customerId"],
    capabilities: ["campaigns:read", "campaigns:manage", "reports:read"],
    requiresApproval: true,
    description: "Manage Google Search and Display ad campaigns with performance reporting.",
    docUrl: "https://developers.google.com/google-ads/api/docs/first-call/overview",
    instructions: [
      "Open Google Ads API Center in Manager Account.",
      "Copy Developer Token.",
      "Copy Customer ID (formatted 123-456-7890).",
      "Paste both credentials below."
    ],
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
    docUrl: "https://modelcontextprotocol.io/introduction",
    instructions: [
      "Enter your custom MCP server endpoint URL (e.g. https://mcp.yourdomain.com/sse).",
      "Enter Bearer auth token if required by your MCP server.",
      "Click Connect to discover endpoints."
    ],
    supportsMcp: true,
  },
];

export function getIntegration(id: string) {
  return integrations.find(integration => integration.id === id);
}
