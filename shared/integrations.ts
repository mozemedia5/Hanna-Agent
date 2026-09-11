export type IntegrationCategory =
  | "commerce"
  | "content_creation"
  | "communication"
  | "social"
  | "workspace"
  | "developer"
  | "media"
  | "marketing"
  | "finance"
  | "security"
  | "custom_mcp";

export type ConnectorId =
  | "shopify"
  | "woocommerce"
  | "beacons"
  | "creatify"
  | "invideo"
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
  | "lovable"
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
  | "gmail"
  | "google-calendar"
  | "google-maps"
  | "openai"
  | "anthropic"
  | "gemini"
  | "meta-ads"
  | "google-ads"
  | "mcp-custom"
  | "hubspot"
  | "mailchimp"
  | "stripe"
  | "notion"
  | "airtable"
  | "intercom"
  | "jira"
  | "zendesk"
  | "salesforce"
  | "quickbooks"
  | "twilio"
  | "zapier"
  | "asana"
  | "canva"
  | "clickup"
  | "cloudflare"
  | "dropbox"
  | "firecrawl"
  | "huggingface"
  | "linear"
  | "make"
  | "metabase"
  | "openrouter"
  | "paypal"
  | "perplexity"
  | "posthog"
  | "supabase"
  | "todoist"
  | "trello"
  | "webflow"
  | "wordpress"
  | "xero"
  | "zoom"
  | "monday"
  | "n8n"
  | "apify"
  | "klaviyo"
  | "typeform";

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
  supportsOAuth?: boolean;
};

export const integrations: IntegrationDefinition[] = [
  // Commerce & Dropshipping
  {
    id: "shopify",
    name: "Shopify",
    category: "commerce",
    credentialFields: ["storeDomain"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["read_products", "write_products", "read_orders", "write_orders"],
    requiresApproval: true,
    description: "Connect your Shopify store via One-Click OAuth authorization or Storefront MCP endpoint to automate product catalog, inventory, and order fulfillment.",
    docUrl: "https://shopify.dev/docs/apps/build/storefront-mcp/servers/storefront",
    instructions: [
      "Click 'Connect with OAuth' to instantly authorize Hanna with your Shopify store.",
      "Alternatively, enter your Shopify store admin domain (e.g., myshop.myshopify.com).",
      "Click Connect to activate store automation.",
    ],
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    category: "commerce",
    credentialFields: ["storeUrl"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["read_products", "write_products", "read_orders", "manage_inventory"],
    requiresApproval: true,
    description: "Automate WooCommerce store catalog, product sync, customer orders, and inventory monitoring.",
    docUrl: "https://woocommerce.com/document/woocommerce-rest-api/",
    instructions: [
      "Click 'Connect with OAuth' to authenticate with your WooCommerce WordPress dashboard.",
      "Or enter your store URL to establish a secure MCP connection.",
    ],
  },
  {
    id: "beacons",
    name: "Beacons",
    category: "social",
    credentialFields: ["username"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["links:manage", "store:sync", "analytics:read"],
    requiresApproval: true,
    description: "Manage link-in-bio storefronts, digital products, and creator customer reach.",
    docUrl: "https://beacons.ai/developer",
    instructions: [
      "Click 'Connect with OAuth' to grant Hanna access to your Beacons creator workspace.",
      "Or enter your Beacons creator username.",
    ],
  },
  {
    id: "creatify",
    name: "Creatify",
    category: "content_creation",
    credentialFields: ["accountEmail"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["generate_ugc_video", "product_to_video", "list_templates"],
    requiresApproval: true,
    description: "Automate short-form UGC marketing video creation from product URLs and script prompts.",
    docUrl: "https://creatify.ai/docs/api",
    instructions: [
      "Click 'Connect with OAuth' to link your Creatify AI account.",
      "Grant video generation permissions to complete setup.",
    ],
  },
  {
    id: "invideo",
    name: "InVideo",
    category: "content_creation",
    credentialFields: ["accountEmail"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["script_to_video", "render_video", "list_voices"],
    requiresApproval: true,
    description: "Create AI promo videos, YouTube Shorts, and viral E-Commerce ad clips.",
    docUrl: "https://invideo.io/docs/api",
    instructions: [
      "Click 'Connect with OAuth' to authorize InVideo Studio integration.",
    ],
  },
  {
    id: "cjdropshipping",
    name: "CJ Dropshipping",
    category: "commerce",
    credentialFields: ["email"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["search_products", "import_products", "sync_orders"],
    requiresApproval: true,
    description: "Automate product sourcing, inventory sync, and order fulfillment via CJ Dropshipping.",
    docUrl: "https://cjdropshipping.com/myCJ.html#/apikey",
    instructions: [
      "Click 'Connect with OAuth' to authorize CJ Dropshipping fulfillment.",
    ],
  },
  {
    id: "autods",
    name: "AutoDS",
    category: "commerce",
    credentialFields: ["storeId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["sync_inventory", "auto_order", "price_monitor"],
    requiresApproval: true,
    description: "Automate dropshipping product imports, price updates, and automated ordering.",
    docUrl: "https://platform.autods.com/settings/api",
    instructions: [
      "Click 'Connect with OAuth' to link your AutoDS store workspace.",
    ],
  },
  {
    id: "zendrop",
    name: "Zendrop",
    category: "commerce",
    credentialFields: ["storeDomain"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["catalog_search", "order_fulfill"],
    requiresApproval: true,
    description: "Fast US dropshipping fulfillment, custom branding, and automated order processing.",
    docUrl: "https://app.zendrop.com/settings/api",
    instructions: [
      "Click 'Connect with OAuth' to connect your Zendrop account.",
    ],
  },
  {
    id: "takeapp",
    name: "Take.app",
    category: "commerce",
    credentialFields: ["storeSlug"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["read_orders", "manage_catalog", "whatsapp_checkout"],
    requiresApproval: true,
    description: "WhatsApp-first store platform to manage storefront orders and instant checkout links.",
    docUrl: "https://take.app/docs/api",
    instructions: [
      "Click 'Connect with OAuth' to authorize Take.app WhatsApp store integration.",
    ],
  },

  // Content Creation & AI Media
  {
    id: "heygen",
    name: "HeyGen",
    category: "content_creation",
    credentialFields: ["accountEmail"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["generate_avatar_video", "translate_video", "list_avatars"],
    requiresApproval: true,
    description: "Generate studio-grade AI avatar videos, video translations, and custom digital humans.",
    docUrl: "https://docs.heygen.com/reference/api-key-1",
    instructions: [
      "Click 'Connect with OAuth' to grant Hanna access to your HeyGen video workspace.",
    ],
  },
  {
    id: "synthesia",
    name: "Synthesia",
    category: "content_creation",
    credentialFields: ["accountEmail"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["generate_video", "list_templates", "list_voices"],
    requiresApproval: true,
    description: "Create AI videos with lifelike avatars and natural text-to-speech voiceovers.",
    docUrl: "https://docs.synthesia.io/getting-started/api-keys",
    instructions: [
      "Click 'Connect with OAuth' to link your Synthesia video creation suite.",
    ],
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    category: "content_creation",
    credentialFields: ["accountEmail"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["text_to_speech", "voice_clone", "sound_effects"],
    requiresApproval: false,
    description: "Realistic AI speech generation, voice cloning, and audio content creation.",
    docUrl: "https://elevenlabs.io/docs/api-reference/text-to-speech",
    instructions: [
      "Click 'Connect with OAuth' to authorize ElevenLabs voice tools.",
    ],
  },
  {
    id: "jules",
    name: "Jules AI",
    category: "content_creation",
    credentialFields: ["accountEmail"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["agent_code_gen", "task_execution"],
    requiresApproval: true,
    description: "Autonomous AI software engineering agent integration.",
    docUrl: "https://jules.google/docs",
    instructions: [
      "Click 'Connect with OAuth' to link Google Jules AI developer console.",
    ],
  },
  {
    id: "stitch",
    name: "Stitch AI",
    category: "content_creation",
    credentialFields: ["accountEmail"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["ui_design_gen", "component_export"],
    requiresApproval: false,
    description: "AI UI/UX design generation and design system component stitching.",
    docUrl: "https://stitch.google/docs",
    instructions: [
      "Click 'Connect with OAuth' to authorize Google Stitch UI generator.",
    ],
  },
  {
    id: "v0",
    name: "v0 by Vercel",
    category: "content_creation",
    credentialFields: ["accountEmail"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["generate_react_ui", "code_refactor"],
    requiresApproval: false,
    description: "Generative UI system powered by AI for React and Tailwind CSS components.",
    docUrl: "https://v0.dev/docs/api",
    instructions: [
      "Click 'Connect with OAuth' to connect your Vercel v0 generative UI account.",
    ],
  },
  {
    id: "lovable",
    name: "Lovable",
    category: "developer",
    credentialFields: ["accountEmail"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["generate_web_app", "refactor_code", "deploy_project"],
    requiresApproval: false,
    description: "AI web application builder API for full-stack web software generation.",
    docUrl: "https://docs.lovable.dev",
    instructions: [
      "Click 'Connect with OAuth' to connect your Lovable web app builder.",
    ],
  },

  // Social & Content Channels
  {
    id: "tiktok",
    name: "TikTok",
    category: "social",
    credentialFields: ["username"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["profile:read", "content:publish", "analytics:read"],
    requiresApproval: true,
    description: "Publish short-form videos, analyze video performance, and manage creator profile.",
    docUrl: "https://developers.tiktok.com/doc/overview",
    instructions: [
      "Click 'Connect with OAuth' to log into TikTok for Business & Creator account.",
    ],
  },
  {
    id: "instagram",
    name: "Instagram",
    category: "social",
    credentialFields: ["businessAccountId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["media:read", "content:publish", "insights:read"],
    requiresApproval: true,
    description: "Publish Instagram Reels/Posts, reply to comments, and view engagement analytics.",
    docUrl: "https://developers.facebook.com/docs/instagram-api",
    instructions: [
      "Click 'Connect with OAuth' to authorize Instagram Graph API with Meta.",
    ],
  },
  {
    id: "youtube",
    name: "YouTube",
    category: "media",
    credentialFields: ["channelId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["videos:read", "videos:upload", "shorts:publish"],
    requiresApproval: true,
    description: "Upload YouTube videos/Shorts, manage channel metadata, and view video analytics.",
    docUrl: "https://developers.google.com/youtube/v3",
    instructions: [
      "Click 'Connect with OAuth' to authorize YouTube Data API via Google account.",
    ],
  },
  {
    id: "pinterest",
    name: "Pinterest",
    category: "social",
    credentialFields: ["boardId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["pins:create", "boards:read", "analytics:read"],
    requiresApproval: true,
    description: "Publish visual Pins, manage moodboards, and track drive-to-store traffic.",
    docUrl: "https://developers.pinterest.com/docs/api/v5",
    instructions: [
      "Click 'Connect with OAuth' to authorize Pinterest Business account.",
    ],
  },
  {
    id: "linktree",
    name: "Linktree",
    category: "social",
    credentialFields: ["profileSlug"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["links:read", "links:update", "analytics:read"],
    requiresApproval: true,
    description: "Update bio links, featured product URLs, and analyze link click-through rates.",
    docUrl: "https://developer.linktr.ee/docs",
    instructions: [
      "Click 'Connect with OAuth' to authorize Linktree bio link manager.",
    ],
  },

  // Communication & Messaging
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    category: "communication",
    credentialFields: ["phoneNumberId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["messages:send", "templates:read", "broadcast:send"],
    requiresApproval: true,
    description: "Send automated WhatsApp order updates, support messages, and campaign broadcasts.",
    docUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api",
    instructions: [
      "Click 'Connect with OAuth' to log into Meta WhatsApp Cloud API.",
    ],
  },
  {
    id: "slack",
    name: "Slack",
    category: "communication",
    credentialFields: ["workspaceDomain"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["channels:read", "groups:read", "chat:write"],
    requiresApproval: true,
    description: "Send team notifications, broadcast operational updates, and read channel messages.",
    docUrl: "https://api.slack.com/authentication/token-types#bot",
    instructions: [
      "Click 'Connect with OAuth' to install Hanna Slack Bot to your workspace.",
    ],
  },

  // Developer & Workspace
  {
    id: "github",
    name: "GitHub",
    category: "developer",
    credentialFields: ["username"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["repo:read", "issues:write", "pulls:write"],
    requiresApproval: true,
    description: "Manage repositories, create issues/pull requests, and trigger CI workflows.",
    docUrl: "https://docs.github.com/en/apps/oauth-apps",
    instructions: [
      "Click 'Connect with OAuth' to authorize GitHub account permissions.",
    ],
  },
  {
    id: "vercel",
    name: "Vercel",
    category: "developer",
    credentialFields: ["teamSlug"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["projects:read", "deployments:read", "deployments:create"],
    requiresApproval: true,
    description: "Deploy frontend applications, monitor build logs, and manage domain settings.",
    docUrl: "https://vercel.com/docs/rest-api",
    instructions: [
      "Click 'Connect with OAuth' to link your Vercel deployment account.",
    ],
  },
  {
    id: "google-workspace",
    name: "Google Workspace",
    category: "workspace",
    credentialFields: ["accountEmail"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["drive:read", "docs:read", "sheets:read", "calendar:read"],
    requiresApproval: true,
    description: "Access Google Docs, Sheets, Drive files, and Calendar schedule.",
    docUrl: "https://developers.google.com/workspace",
    instructions: [
      "Click 'Connect with OAuth' to sign in with Google Workspace.",
    ],
  },
  {
    id: "gmail",
    name: "Gmail",
    category: "communication",
    credentialFields: ["accountEmail"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["mail:read", "mail:send", "labels:read"],
    requiresApproval: true,
    description: "Read, send, and manage Gmail messages for automated outreach and support workflows.",
    docUrl: "https://developers.google.com/gmail/api/guides",
    instructions: [
      "Click 'Connect with OAuth' to authorize Gmail access via Google OAuth.",
    ],
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    category: "workspace",
    credentialFields: ["accountEmail"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["calendar:read", "calendar:write", "events:manage"],
    requiresApproval: true,
    description: "Schedule events, search calendar availability, and manage meeting schedules.",
    docUrl: "https://developers.google.com/calendar",
    instructions: [
      "Click 'Connect with OAuth' to link Google Calendar.",
    ],
  },
  {
    id: "google-maps",
    name: "Google Maps",
    category: "workspace",
    credentialFields: ["accountEmail"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["places:search", "geocode:read", "directions:get"],
    requiresApproval: false,
    description: "Geocode store locations, search nearby places, and calculate delivery routes.",
    docUrl: "https://developers.google.com/maps",
    instructions: [
      "Click 'Connect with OAuth' to activate Google Maps services.",
    ],
  },

  // Manus Core Plugins
  {
    id: "airtable",
    name: "Airtable",
    category: "workspace",
    credentialFields: ["baseId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["records:read", "records:write", "schema:read"],
    requiresApproval: true,
    description: "Structured database & workflow platform; query, analyze, and update authorized Airtable bases.",
    docUrl: "https://airtable.com/developers/web/api/introduction",
    instructions: [
      "Click 'Connect with OAuth' to grant Hanna access to your Airtable bases.",
    ],
  },
  {
    id: "asana",
    name: "Asana",
    category: "workspace",
    credentialFields: ["workspaceId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["tasks:read", "tasks:write", "projects:read"],
    requiresApproval: true,
    description: "Manage project tasks, team milestones, and cross-functional workflows.",
    docUrl: "https://developers.asana.com",
    instructions: [
      "Click 'Connect with OAuth' to authorize Asana project management.",
    ],
  },
  {
    id: "canva",
    name: "Canva",
    category: "content_creation",
    credentialFields: ["folderId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["designs:create", "assets:import", "export:pdf"],
    requiresApproval: true,
    description: "Design and content workflows through Canva's authorized connector capabilities.",
    docUrl: "https://www.canva.dev",
    instructions: [
      "Click 'Connect with OAuth' to link your Canva Design suite.",
    ],
  },
  {
    id: "clickup",
    name: "ClickUp",
    category: "workspace",
    credentialFields: ["teamId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["tasks:manage", "spaces:read", "docs:write"],
    requiresApproval: true,
    description: "All-in-one productivity platform for tasks, docs, and goal tracking.",
    docUrl: "https://clickup.com/api",
    instructions: [
      "Click 'Connect with OAuth' to authorize ClickUp workspace.",
    ],
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    category: "developer",
    credentialFields: ["accountId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["dns:manage", "workers:deploy", "kv:write"],
    requiresApproval: true,
    description: "Cloudflare Workers, DNS records, security rules, and edge storage management.",
    docUrl: "https://developers.cloudflare.com",
    instructions: [
      "Click 'Connect with OAuth' to authorize Cloudflare account access.",
    ],
  },
  {
    id: "dropbox",
    name: "Dropbox",
    category: "workspace",
    credentialFields: ["accountEmail"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["files:read", "files:upload", "sharing:manage"],
    requiresApproval: true,
    description: "Cloud storage for document search, image uploads, and shared files.",
    docUrl: "https://www.dropbox.com/developers",
    instructions: [
      "Click 'Connect with OAuth' to authorize Dropbox file storage.",
    ],
  },
  {
    id: "firecrawl",
    name: "Firecrawl",
    category: "developer",
    credentialFields: ["accountEmail"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["web:scrape", "web:crawl", "markdown:extract"],
    requiresApproval: false,
    description: "Web scraping and structured content extraction engine for AI agents.",
    docUrl: "https://www.firecrawl.dev/docs",
    instructions: [
      "Click 'Connect with OAuth' to activate Firecrawl web extraction MCP.",
    ],
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    category: "developer",
    credentialFields: ["username"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["models:run", "datasets:read", "spaces:deploy"],
    requiresApproval: false,
    description: "Open-source AI models, datasets, and inference endpoints.",
    docUrl: "https://huggingface.co/docs",
    instructions: [
      "Click 'Connect with OAuth' to authorize Hugging Face hub.",
    ],
  },
  {
    id: "linear",
    name: "Linear",
    category: "developer",
    credentialFields: ["organizationSlug"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["issues:create", "cycles:read", "projects:manage"],
    requiresApproval: true,
    description: "Issue tracking and project management for modern software development.",
    docUrl: "https://developers.linear.app",
    instructions: [
      "Click 'Connect with OAuth' to authorize Linear issue tracking.",
    ],
  },
  {
    id: "make",
    name: "Make",
    category: "workspace",
    credentialFields: ["organizationId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["scenarios:run", "webhooks:trigger"],
    requiresApproval: true,
    description: "Visual automation platform to connect web applications and API workflows.",
    docUrl: "https://www.make.com/en/api-documentation",
    instructions: [
      "Click 'Connect with OAuth' to link your Make automation suite.",
    ],
  },
  {
    id: "metabase",
    name: "Metabase",
    category: "marketing",
    credentialFields: ["siteUrl"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["queries:run", "dashboards:read"],
    requiresApproval: false,
    description: "Business intelligence and SQL dashboard analytics tool.",
    docUrl: "https://www.metabase.com/docs/latest/api-documentation",
    instructions: [
      "Click 'Connect with OAuth' to authorize Metabase BI dashboard.",
    ],
  },
  {
    id: "notion",
    name: "Notion",
    category: "workspace",
    credentialFields: ["workspaceName"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["pages:read", "databases:read", "blocks:write"],
    requiresApproval: true,
    description: "Query Notion workspace databases, sync product specs, and generate wiki pages.",
    docUrl: "https://developers.notion.com/docs/getting-started",
    instructions: [
      "Click 'Connect with OAuth' to select Notion workspace pages.",
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    category: "developer",
    credentialFields: ["accountEmail"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["models:route", "chat:completion"],
    requiresApproval: false,
    description: "Unified AI model routing platform for LLMs and specialized AI endpoints.",
    docUrl: "https://openrouter.ai/docs",
    instructions: [
      "Click 'Connect with OAuth' to link OpenRouter model routing.",
    ],
  },
  {
    id: "paypal",
    name: "PayPal for Business",
    category: "finance",
    credentialFields: ["merchantId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["payouts:create", "invoices:manage", "transactions:read"],
    requiresApproval: true,
    description: "Merchant transactions, invoicing, and cross-border digital payments.",
    docUrl: "https://developer.paypal.com",
    instructions: [
      "Click 'Connect with OAuth' to link your PayPal Merchant account.",
    ],
  },
  {
    id: "perplexity",
    name: "Perplexity",
    category: "developer",
    credentialFields: ["accountEmail"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["search:online", "citations:extract"],
    requiresApproval: false,
    description: "Search-augmented AI model reasoning with live web source citation.",
    docUrl: "https://docs.perplexity.ai",
    instructions: [
      "Click 'Connect with OAuth' to activate Perplexity deep search.",
    ],
  },
  {
    id: "posthog",
    name: "PostHog",
    category: "marketing",
    credentialFields: ["projectId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["analytics:read", "feature_flags:manage", "events:track"],
    requiresApproval: false,
    description: "Product analytics, session recording, feature flags, and conversion funnel auditing.",
    docUrl: "https://posthog.com/docs/api",
    instructions: [
      "Click 'Connect with OAuth' to authorize PostHog product analytics.",
    ],
  },
  {
    id: "supabase",
    name: "Supabase",
    category: "developer",
    credentialFields: ["projectRef"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["db:query", "storage:upload", "auth:manage"],
    requiresApproval: true,
    description: "Open-source Firebase alternative: Postgres database, authentication, and file storage.",
    docUrl: "https://supabase.com/docs",
    instructions: [
      "Click 'Connect with OAuth' to authorize Supabase Postgres projects.",
    ],
  },
  {
    id: "todoist",
    name: "Todoist",
    category: "workspace",
    credentialFields: ["accountEmail"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["tasks:create", "projects:read", "labels:manage"],
    requiresApproval: false,
    description: "Task checklist management, daily goal setting, and productivity tracking.",
    docUrl: "https://developer.todoist.com",
    instructions: [
      "Click 'Connect with OAuth' to link your Todoist tasks.",
    ],
  },
  {
    id: "trello",
    name: "Trello",
    category: "workspace",
    credentialFields: ["boardSlug"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["cards:create", "lists:read", "boards:manage"],
    requiresApproval: true,
    description: "Kanban boards for project organization and team task execution.",
    docUrl: "https://developer.atlassian.com/cloud/trello/",
    instructions: [
      "Click 'Connect with OAuth' to link Trello Kanban workspace.",
    ],
  },
  {
    id: "webflow",
    name: "Webflow",
    category: "developer",
    credentialFields: ["siteId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["cms:manage", "sites:publish", "forms:read"],
    requiresApproval: true,
    description: "Visual web design, CMS collection publishing, and site deployment.",
    docUrl: "https://developers.webflow.com",
    instructions: [
      "Click 'Connect with OAuth' to authorize Webflow CMS sites.",
    ],
  },
  {
    id: "wordpress",
    name: "WordPress",
    category: "developer",
    credentialFields: ["siteUrl"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["posts:publish", "media:upload", "pages:manage"],
    requiresApproval: true,
    description: "Content publishing, blog updates, and media library management for WordPress sites.",
    docUrl: "https://developer.wordpress.org/rest-api/",
    instructions: [
      "Click 'Connect with OAuth' to authorize WordPress REST API.",
    ],
  },
  {
    id: "xero",
    name: "Xero",
    category: "finance",
    credentialFields: ["tenantId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["invoices:read", "contacts:manage", "reports:generate"],
    requiresApproval: true,
    description: "Cloud accounting software for small businesses and e-commerce stores.",
    docUrl: "https://developer.xero.com",
    instructions: [
      "Click 'Connect with OAuth' to authorize Xero accounting tenant.",
    ],
  },
  {
    id: "zapier",
    name: "Zapier NLA",
    category: "workspace",
    credentialFields: ["accountEmail"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["zaps:trigger", "actions:execute", "mcp:discover"],
    requiresApproval: true,
    description: "Connect over 5,000+ business web apps via Zapier Natural Language Actions API & MCP.",
    docUrl: "https://nla.zapier.com/docs/getting-started/",
    instructions: [
      "Click 'Connect with OAuth' to authorize Zapier NLA actions.",
    ],
  },
  {
    id: "zoom",
    name: "Zoom",
    category: "communication",
    credentialFields: ["accountEmail"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["meetings:create", "recordings:read", "users:manage"],
    requiresApproval: true,
    description: "Video conferencing, meeting scheduling, and cloud recording transcription.",
    docUrl: "https://developers.zoom.us",
    instructions: [
      "Click 'Connect with OAuth' to link your Zoom workspace.",
    ],
  },
  {
    id: "monday",
    name: "monday.com",
    category: "workspace",
    credentialFields: ["boardId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["items:create", "boards:read", "updates:publish"],
    requiresApproval: true,
    description: "Work OS platform for managing tasks, CRM leads, and team workflows.",
    docUrl: "https://developer.monday.com",
    instructions: [
      "Click 'Connect with OAuth' to authorize monday.com account.",
    ],
  },
  {
    id: "n8n",
    name: "n8n",
    category: "workspace",
    credentialFields: ["instanceUrl"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["workflows:trigger", "executions:read"],
    requiresApproval: true,
    description: "Fair-code workflow automation platform for custom technical integrations.",
    docUrl: "https://docs.n8n.io/api/",
    instructions: [
      "Click 'Connect with OAuth' to authorize n8n workflow engine.",
    ],
  },
  {
    id: "apify",
    name: "Apify",
    category: "developer",
    credentialFields: ["username"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["actors:run", "datasets:read", "tasks:execute"],
    requiresApproval: false,
    description: "Web scraping, data extraction, and web automation actor platform.",
    docUrl: "https://docs.apify.com",
    instructions: [
      "Click 'Connect with OAuth' to link Apify scraper actors.",
    ],
  },
  {
    id: "klaviyo",
    name: "Klaviyo",
    category: "marketing",
    credentialFields: ["accountEmail"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["profiles:sync", "segments:read", "campaigns:create"],
    requiresApproval: true,
    description: "E-Commerce email & SMS marketing automation platform.",
    docUrl: "https://developers.klaviyo.com",
    instructions: [
      "Click 'Connect with OAuth' to authorize Klaviyo marketing hub.",
    ],
  },
  {
    id: "typeform",
    name: "Typeform",
    category: "marketing",
    credentialFields: ["formId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["responses:read", "forms:manage"],
    requiresApproval: false,
    description: "Conversational forms, surveys, and quiz response collection.",
    docUrl: "https://developer.typeform.com",
    instructions: [
      "Click 'Connect with OAuth' to link Typeform surveys.",
    ],
  },

  // Additional Business Connectors
  {
    id: "hubspot",
    name: "HubSpot",
    category: "workspace",
    credentialFields: ["portalId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["contacts:read", "deals:read", "marketing:manage"],
    requiresApproval: true,
    description: "HubSpot CRM & Marketing automation for managing customer deals, leads, and contacts.",
    docUrl: "https://developers.hubspot.com/docs/api/overview",
    instructions: [
      "Click 'Connect with OAuth' to grant access to HubSpot CRM contacts and deals.",
    ],
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    category: "marketing",
    credentialFields: ["accountEmail"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["lists:read", "campaigns:create", "members:manage"],
    requiresApproval: true,
    description: "Manage email subscriber lists, automated email campaigns, and customer newsletters.",
    docUrl: "https://mailchimp.com/developer/marketing/api/quick-start/",
    instructions: [
      "Click 'Connect with OAuth' to link your Mailchimp account.",
    ],
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "finance",
    credentialFields: ["accountId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["charges:read", "subscriptions:manage", "invoices:read"],
    requiresApproval: true,
    description: "Automate store payments, recurring subscriptions, and customer invoice tracking.",
    docUrl: "https://stripe.com/docs/api",
    instructions: [
      "Click 'Connect with OAuth' to authorize Stripe Connect for safe payment reads.",
    ],
  },
  {
    id: "intercom",
    name: "Intercom",
    category: "communication",
    credentialFields: ["workspaceId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["conversations:read", "contacts:read", "messages:send"],
    requiresApproval: true,
    description: "Automate AI customer support responses, manage tickets, and read active user chats.",
    docUrl: "https://developers.intercom.com/docs",
    instructions: [
      "Click 'Connect with OAuth' to authorize Intercom customer desk.",
    ],
  },
  {
    id: "jira",
    name: "Jira Software",
    category: "developer",
    credentialFields: ["siteUrl"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["issues:read", "issues:create", "projects:read"],
    requiresApproval: true,
    description: "Manage engineering bug tickets, agile sprints, and customer feedback tasks.",
    docUrl: "https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/",
    instructions: [
      "Click 'Connect with OAuth' to authorize Atlassian Jira Software.",
    ],
  },
  {
    id: "zendesk",
    name: "Zendesk",
    category: "communication",
    credentialFields: ["subdomain"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["tickets:read", "tickets:create", "users:read"],
    requiresApproval: true,
    description: "Enterprise customer support ticket management and automated resolution workflows.",
    docUrl: "https://developer.zendesk.com/api-reference/",
    instructions: [
      "Click 'Connect with OAuth' to link Zendesk Admin desk.",
    ],
  },
  {
    id: "salesforce",
    name: "Salesforce",
    category: "workspace",
    credentialFields: ["instanceUrl"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["leads:read", "accounts:read", "opportunities:manage"],
    requiresApproval: true,
    description: "Enterprise CRM for managing lead pipelines, business accounts, and opportunities.",
    docUrl: "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_what_is_rest_api.htm",
    instructions: [
      "Click 'Connect with OAuth' to sign in with Salesforce.",
    ],
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    category: "finance",
    credentialFields: ["realmId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["invoices:read", "expenses:read", "reports:read"],
    requiresApproval: true,
    description: "E-Commerce accounting, automated invoice status tracking, and expense auditing.",
    docUrl: "https://developer.intuit.com/app/developer/qbo/docs/develop",
    instructions: [
      "Click 'Connect with OAuth' to authorize Intuit QuickBooks online.",
    ],
  },
  {
    id: "twilio",
    name: "Twilio",
    category: "communication",
    credentialFields: ["accountSid"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["sms:send", "voice:call", "verify:send"],
    requiresApproval: true,
    description: "Automated SMS customer notifications, OTP verification, and voice alerts.",
    docUrl: "https://www.twilio.com/docs/usage/api",
    instructions: [
      "Click 'Connect with OAuth' to link your Twilio account.",
    ],
  },

  // AI Model Providers
  {
    id: "openai",
    name: "OpenAI",
    category: "developer",
    credentialFields: ["apiKey"],
    supportsOAuth: true,
    capabilities: ["chat:completion", "image:generate", "audio:transcribe"],
    requiresApproval: false,
    description: "Access GPT-4o, DALL-E, Whisper, and the full OpenAI model suite.",
    docUrl: "https://platform.openai.com/api-keys",
    instructions: [
      "Click 'Connect with OAuth' or enter your secret key starting with 'sk-'.",
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    category: "developer",
    credentialFields: ["apiKey"],
    supportsOAuth: true,
    capabilities: ["chat:completion", "long-context", "code-analysis"],
    requiresApproval: false,
    description: "Access Claude models for advanced reasoning, coding, and long-context analysis.",
    docUrl: "https://docs.anthropic.com/en/api/getting-started",
    instructions: [
      "Click 'Connect with OAuth' or enter your key starting with 'sk-ant-'.",
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    category: "developer",
    credentialFields: ["apiKey"],
    supportsOAuth: true,
    capabilities: ["chat:completion", "multimodal", "grounding"],
    requiresApproval: false,
    description: "Access Gemini models for multimodal AI, long-context, and Google integration.",
    docUrl: "https://ai.google.dev/gemini-api/docs/api-key",
    instructions: [
      "Click 'Connect with OAuth' or enter your key starting with 'AIzaSy...'.",
    ],
  },

  // Advertising
  {
    id: "meta-ads",
    name: "Meta Ads Manager",
    category: "marketing",
    credentialFields: ["adAccountId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["campaigns:read", "campaigns:create", "insights:read"],
    requiresApproval: true,
    description: "Manage Facebook and Instagram ad campaigns, audiences, and performance reporting.",
    docUrl: "https://developers.facebook.com/docs/marketing-apis",
    instructions: [
      "Click 'Connect with OAuth' to log into Meta Ads Manager.",
    ],
  },
  {
    id: "google-ads",
    name: "Google Ads",
    category: "marketing",
    credentialFields: ["customerId"],
    supportsOAuth: true,
    supportsMcp: true,
    capabilities: ["campaigns:read", "campaigns:manage", "reports:read"],
    requiresApproval: true,
    description: "Manage Google Search and Display ad campaigns with performance reporting.",
    docUrl: "https://developers.google.com/google-ads/api/docs/first-call/overview",
    instructions: [
      "Click 'Connect with OAuth' to grant Google Ads API access.",
    ],
  },

  // Custom MCP Server
  {
    id: "mcp-custom",
    name: "Custom MCP Server",
    category: "custom_mcp",
    credentialFields: ["serverUrl"],
    supportsMcp: true,
    capabilities: ["custom:tool", "mcp:discover"],
    requiresApproval: true,
    description: "Connect any custom app or service via Model Context Protocol (MCP) tool discovery.",
    docUrl: "https://modelcontextprotocol.io/introduction",
    instructions: [
      "Enter your custom MCP server endpoint URL (e.g. https://mcp.yourdomain.com/sse).",
      "Click Connect to discover endpoints.",
    ],
  },
];

export function getIntegration(id: string) {
  return integrations.find(integration => integration.id === id);
}
