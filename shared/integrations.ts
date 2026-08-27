export type IntegrationCategory = "commerce" | "communication" | "social" | "workspace" | "developer" | "media" | "custom";
export type IntegrationDefinition = {
  id: string;
  name: string;
  category: IntegrationCategory;
  credentialFields: string[];
  capabilities: string[];
  requiresApproval: boolean;
};

export const integrations: IntegrationDefinition[] = [
  { id: "shopify", name: "Shopify", category: "commerce", credentialFields: ["accessToken", "storeDomain"], capabilities: ["catalog:read", "orders:read", "products:write"], requiresApproval: true },
  { id: "slack", name: "Slack", category: "communication", credentialFields: ["botToken"], capabilities: ["messages:read", "messages:write", "channels:read"], requiresApproval: true },
  { id: "whatsapp", name: "WhatsApp Business", category: "communication", credentialFields: ["accessToken", "phoneNumberId"], capabilities: ["messages:send", "templates:read"], requiresApproval: true },
  { id: "tiktok", name: "TikTok", category: "social", credentialFields: ["accessToken"], capabilities: ["profile:read", "content:publish"], requiresApproval: true },
  { id: "instagram", name: "Instagram", category: "social", credentialFields: ["accessToken", "businessAccountId"], capabilities: ["media:read", "content:publish", "insights:read"], requiresApproval: true },
  { id: "meta", name: "Meta Graph API", category: "social", credentialFields: ["accessToken", "appId", "appSecret"], capabilities: ["pages:read", "ads:read", "content:publish"], requiresApproval: true },
  { id: "google-workspace", name: "Google Workspace", category: "workspace", credentialFields: ["oauthRefreshToken"], capabilities: ["drive:read", "docs:read", "sheets:read", "calendar:read"], requiresApproval: true },
  { id: "gmail", name: "Gmail", category: "workspace", credentialFields: ["oauthRefreshToken"], capabilities: ["email:read", "email:send"], requiresApproval: true },
  { id: "github", name: "GitHub", category: "developer", credentialFields: ["personalAccessToken"], capabilities: ["repo:read", "issues:write", "pulls:write"], requiresApproval: true },
  { id: "vercel", name: "Vercel", category: "developer", credentialFields: ["token"], capabilities: ["projects:read", "deployments:read", "deployments:create"], requiresApproval: true },
  { id: "youtube", name: "YouTube", category: "media", credentialFields: ["oauthRefreshToken"], capabilities: ["videos:read", "videos:upload"], requiresApproval: true },
  { id: "cloudinary", name: "Cloudinary", category: "media", credentialFields: ["cloudName", "apiKey", "apiSecret"], capabilities: ["assets:upload", "assets:transform"], requiresApproval: false },
  { id: "mcp-custom", name: "Custom MCP server", category: "custom", credentialFields: ["serverUrl", "token"], capabilities: ["custom:tool"], requiresApproval: true },
];

export function getIntegration(id: string) {
  return integrations.find(integration => integration.id === id);
}
