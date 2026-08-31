import crypto from "node:crypto";
import { credentialHint, decryptCredential, encryptCredential } from "./credentialCrypto";

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

export type ConnectorValues = Record<string, string>;
export type ConnectorCredential = { connector: ConnectorId; values: ConnectorValues };
export type ConnectorSummary = { connector: ConnectorId; fields: Record<string, string>; updatedAt: Date };

export type ConnectorAction =
  | { connector: "shopify"; action: "list_products"; parameters: { first?: number; query?: string } }
  | { connector: "shopify"; action: "update_product_title"; parameters: { productId: string; title: string } }
  | { connector: "cjdropshipping"; action: "search_products"; parameters: { keyword: string } }
  | { connector: "autods"; action: "sync_inventory"; parameters: { storeId?: string } }
  | { connector: "takeapp"; action: "list_orders"; parameters: { storeSlug?: string } }
  | { connector: "heygen"; action: "list_avatars"; parameters: {} }
  | { connector: "tiktok"; action: "get_profile"; parameters: {} }
  | { connector: "github"; action: "list_repos"; parameters: { username?: string } }
  | { connector: "slack"; action: "list_channels"; parameters: { limit?: number } }
  | { connector: "slack"; action: "send_message"; parameters: { channel: string; text: string; threadTs?: string } }
  | { connector: "mcp-custom"; action: "mcp_execute"; parameters: { toolName: string; arguments?: Record<string, unknown> } }
  | { connector: ConnectorId; action: string; parameters: Record<string, unknown> };

type StoredCredential = { encryptedValues: string; updatedAt: Date };
type ApprovalRequest = { id: string; userId: number; action: ConnectorAction; status: "pending" | "approved" | "completed"; createdAt: Date; expiresAt: Date };

const credentials = new Map<string, StoredCredential>();
const approvals = new Map<string, ApprovalRequest>();
const keyFor = (userId: number, connector: ConnectorId) => `${userId}:${connector}`;

export async function saveConnectorCredential(userId: number, connector: ConnectorId, values: ConnectorValues) {
  if (!values || Object.keys(values).length === 0) {
    throw new Error(`${connector} requires at least one credential field`);
  }
  const safeValues = Object.fromEntries(
    Object.entries(values)
      .filter(([, val]) => typeof val === "string" && val.trim().length > 0)
      .map(([key, value]) => [key, value.trim()])
  );
  if (Object.keys(safeValues).length === 0) {
    throw new Error(`${connector} credential fields cannot be empty`);
  }
  credentials.set(keyFor(userId, connector), { encryptedValues: encryptCredential(JSON.stringify(safeValues)), updatedAt: new Date() });
  return { connector, saved: true } as const;
}

export async function listConnectorCredentials(userId: number): Promise<ConnectorSummary[]> {
  return Array.from(credentials.entries())
    .filter(([key]) => key.startsWith(`${userId}:`))
    .map(([key, row]) => {
      const connector = key.split(":")[1] as ConnectorId;
      const values = JSON.parse(decryptCredential(row.encryptedValues)) as ConnectorValues;
      return { connector, fields: Object.fromEntries(Object.keys(values).map(field => [field, credentialHint(values[field] ?? "")])), updatedAt: row.updatedAt };
    });
}

export async function getConnectorCredential(userId: number, connector: ConnectorId): Promise<ConnectorCredential | undefined> {
  const row = credentials.get(keyFor(userId, connector));
  if (!row) return undefined;
  return { connector, values: JSON.parse(decryptCredential(row.encryptedValues)) as ConnectorValues };
}

export async function deleteConnectorCredential(userId: number, connector: ConnectorId) {
  credentials.delete(keyFor(userId, connector));
  return { success: true } as const;
}

function validateAction(action: ConnectorAction) {
  if (action.connector === "shopify" && action.action === "update_product_title" && (!action.parameters.productId || !action.parameters.title)) throw new Error("Shopify product ID and title are required.");
  if (action.connector === "slack" && action.action === "send_message" && (!action.parameters.channel || !action.parameters.text)) throw new Error("Slack channel and message are required.");
}

export function createApprovalRequest(userId: number, action: ConnectorAction) {
  validateAction(action);
  const now = new Date();
  const id = `approval_${crypto.randomUUID()}`;
  const request: ApprovalRequest = { id, userId, action, status: "pending", createdAt: now, expiresAt: new Date(now.getTime() + 10 * 60 * 1000) };
  approvals.set(id, request);
  return { id, connector: action.connector, action: action.action, status: request.status, expiresAt: request.expiresAt };
}

export function getApprovalRequest(userId: number, id: string) {
  const request = approvals.get(id);
  if (!request || request.userId !== userId || request.expiresAt.getTime() < Date.now()) return undefined;
  return request;
}

export function approveRequest(userId: number, id: string) {
  const request = getApprovalRequest(userId, id);
  if (!request) return undefined;
  if (request.status !== "pending") return request;
  request.status = "approved";
  return request;
}

export function completeRequest(userId: number, id: string) {
  const request = getApprovalRequest(userId, id);
  if (!request || request.status !== "approved") return undefined;
  request.status = "completed";
  return request;
}
