import crypto from "node:crypto";
import type { ConnectorId } from "../shared/integrations";
import {
  credentialHint,
  decryptCredential,
  encryptCredential,
} from "./credentialCrypto";
import {
  deleteStoredConnectorCredential,
  getStoredConnectorCredentials,
  saveStoredConnectorCredential,
} from "./persistentStore";
import { resolveCanonicalUserId } from "./userResolver";

export type { ConnectorId };

export type ConnectorValues = Record<string, string>;
export type ConnectorCredential = {
  connector: ConnectorId;
  values: ConnectorValues;
};
export type ConnectorSummary = {
  connector: ConnectorId;
  fields: Record<string, string>;
  is_connected?: boolean;
  updatedAt: Date;
};

export type ConnectorAction =
  | {
      connector: "shopify";
      action:
        | "list_products"
        | "search_products"
        | "get_product"
        | "list_orders"
        | "get_order"
        | "list_customers"
        | "get_customer"
        | "list_collections"
        | "best_sellers"
        | "low_inventory";
      parameters: { first?: number; query?: string; id?: string; inventoryThreshold?: number };
    }
  | {
      connector: "shopify";
      action: "update_product_title";
      parameters: { productId: string; title: string };
    }
  | {
      connector: "shopify";
      action:
        | "create_product"
        | "update_product_description"
        | "update_seo"
        | "update_price"
        | "update_inventory";
      parameters: Record<string, unknown>;
    }
  | {
      connector: "cjdropshipping";
      action: "search_products";
      parameters: { keyword: string };
    }
  | {
      connector: "autods";
      action: "sync_inventory";
      parameters: { storeId?: string };
    }
  | {
      connector: "takeapp";
      action: "list_orders";
      parameters: { storeSlug?: string };
    }
  | { connector: "heygen"; action: "list_avatars"; parameters: {} }
  | { connector: "tiktok"; action: "get_profile"; parameters: {} }
  | {
      connector: "github";
      action: "list_repos";
      parameters: { username?: string };
    }
  | {
      connector: "slack";
      action: "list_channels";
      parameters: { limit?: number };
    }
  | {
      connector: "slack";
      action: "send_message";
      parameters: { channel: string; text: string; threadTs?: string };
    }
  | {
      connector: "mcp-custom";
      action: "mcp_execute";
      parameters: { toolName: string; arguments?: Record<string, unknown> };
    }
  | {
      connector: ConnectorId;
      action: string;
      parameters: Record<string, unknown>;
    };

type StoredCredential = { encryptedValues: string; updatedAt: Date };
type ApprovalRequest = {
  id: string;
  userId: number;
  action: ConnectorAction;
  status: "pending" | "approved" | "completed";
  createdAt: Date;
  expiresAt: Date;
};

const approvals = new Map<string, ApprovalRequest>();
const keyFor = (userId: string | number, connector: ConnectorId) =>
  `${userId}:${connector}`;

function credentialIsConnected(connector: ConnectorId, values: ConnectorValues): boolean {
  if (values.is_connected === "false") return false;
  if (connector === "shopify") {
    return Boolean((values.accessToken || values.access_token) && (values.storeDomain || values.shop));
  }
  return true;
}

const GOOGLE_FAMILY: ConnectorId[] = [
  "google-workspace",
  "gmail",
  "google-drive",
  "google-docs",
  "google-sheets",
  "google-slides",
  "google-calendar",
];

async function saveConnectorCredentialInternal(
  canonicalUserId: string,
  connector: ConnectorId,
  values: ConnectorValues
) {
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

  const record: StoredCredential = {
    encryptedValues: encryptCredential(JSON.stringify(safeValues)),
    updatedAt: new Date(),
  };

  const firestore = (await import("./firestore")).getAdminFirestore();
  if (firestore) {
    try {
      await firestore
        .collection("users")
        .doc(canonicalUserId)
        .collection("connectors")
        .doc(connector)
        .set({
          encryptedValues: record.encryptedValues,
          updatedAt: record.updatedAt,
        });
    } catch (err) {
      console.warn("[ConnectorDb] Firestore save failed:", err);
    }
  }

  saveStoredConnectorCredential(keyFor(canonicalUserId, connector), record);
  return { connector, saved: true } as const;
}

export async function saveConnectorCredential(
  userId: string | number,
  connector: ConnectorId,
  values: ConnectorValues
) {
  const canonicalUserId = await resolveCanonicalUserId(userId);
  return saveConnectorCredentialInternal(canonicalUserId, connector, values);
}

export async function listConnectorCredentials(
  userId: string | number
): Promise<ConnectorSummary[]> {
  const canonicalUserId = await resolveCanonicalUserId(userId);

  const firestore = (await import("./firestore")).getAdminFirestore();
  if (firestore) {
    try {
      const snapshot = await firestore
        .collection("users")
        .doc(canonicalUserId)
        .collection("connectors")
        .get();

      if (!snapshot.empty) {
        return snapshot.docs.map((doc: any) => {
          const connector = doc.id as ConnectorId;
          const row = doc.data() as StoredCredential;
          const values = JSON.parse(
            decryptCredential(row.encryptedValues)
          ) as ConnectorValues;
          return {
            connector,
            fields: Object.fromEntries(
              Object.keys(values).map(field => [
                field,
                credentialHint(values[field] ?? ""),
              ])
            ),
            is_connected: credentialIsConnected(connector, values),
            updatedAt: row.updatedAt
              ? new Date((row.updatedAt as any).toDate ? (row.updatedAt as any).toDate() : row.updatedAt)
              : new Date(),
          };
        });
      }
    } catch (err) {
      console.warn("[ConnectorDb] Firestore list failed:", err);
    }
  }

  const all = getStoredConnectorCredentials();
  const userPrefix = `${canonicalUserId}:`;

  return Object.entries(all)
    .filter(([key]) => key.startsWith(userPrefix))
    .map(([key, row]) => {
      const connector = key.split(":")[1] as ConnectorId;
      const values = JSON.parse(
        decryptCredential(row.encryptedValues)
      ) as ConnectorValues;
      return {
        connector,
        fields: Object.fromEntries(
          Object.keys(values).map(field => [
            field,
            credentialHint(values[field] ?? ""),
          ])
        ),
        is_connected: credentialIsConnected(connector, values),
        updatedAt: new Date(row.updatedAt),
      };
    });
}

async function ensureFreshGoogleToken(
  canonicalUserId: string,
  credential: ConnectorCredential
): Promise<ConnectorCredential> {
  const { access_token, refresh_token, obtained_at, expires_in } = credential.values;
  if (!access_token || !refresh_token) return credential;

  const obtainedMs = Number.parseInt(obtained_at || "0", 10);
  const expiresSec = Number.parseInt(expires_in || "3600", 10);
  const expiresAtMs = obtainedMs + expiresSec * 1000;
  const nowMs = Date.now();

  // Return existing token if it remains valid for > 5 minutes
  if (obtainedMs > 0 && expiresAtMs - nowMs > 300_000) {
    return credential;
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return credential;
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      return credential;
    }

    const tokenData = await response.json();
    if (tokenData.access_token) {
      const newValues = {
        ...credential.values,
        access_token: tokenData.access_token,
        expires_in: String(tokenData.expires_in || expiresSec),
        obtained_at: String(Date.now()),
        ...(tokenData.refresh_token ? { refresh_token: tokenData.refresh_token } : {}),
      };

      for (const googleConn of GOOGLE_FAMILY) {
        await saveConnectorCredentialInternal(canonicalUserId, googleConn, newValues);
      }

      return {
        connector: credential.connector,
        values: newValues,
      };
    }
  } catch (err) {
    console.warn("[GoogleTokenRefresh] Token refresh failed:", err);
  }

  return credential;
}

export async function getConnectorCredential(
  userId: string | number,
  connector: ConnectorId
): Promise<ConnectorCredential | undefined> {
  const canonicalUserId = await resolveCanonicalUserId(userId);
  const isGoogle = GOOGLE_FAMILY.includes(connector);
  const connectorsToTry = isGoogle
    ? [connector, ...GOOGLE_FAMILY.filter(c => c !== connector)]
    : [connector];

  const firestore = (await import("./firestore")).getAdminFirestore();
  let foundCred: ConnectorCredential | undefined;

  if (firestore) {
    try {
      for (const conn of connectorsToTry) {
        const doc = await firestore
          .collection("users")
          .doc(canonicalUserId)
          .collection("connectors")
          .doc(conn)
          .get();

        if (doc.exists) {
          const row = doc.data() as StoredCredential;
          foundCred = {
            connector,
            values: JSON.parse(
              decryptCredential(row.encryptedValues)
            ) as ConnectorValues,
          };
          break;
        }
      }
    } catch (err) {
      console.warn("[ConnectorDb] Firestore get failed:", err);
    }
  }

  if (!foundCred) {
    const all = getStoredConnectorCredentials();
    for (const conn of connectorsToTry) {
      const row = all[keyFor(canonicalUserId, conn)] as StoredCredential | undefined;
      if (row) {
        foundCred = {
          connector,
          values: JSON.parse(
            decryptCredential(row.encryptedValues)
          ) as ConnectorValues,
        };
        break;
      }
    }
  }

  if (foundCred && isGoogle && foundCred.values.refresh_token) {
    foundCred = await ensureFreshGoogleToken(canonicalUserId, foundCred);
  }

  if (foundCred && foundCred.connector === "shopify" && (foundCred.values.refreshToken || foundCred.values.refresh_token)) {
    const { ensureFreshShopifyToken } = await import("./shopifyOAuth");
    const freshValues = await ensureFreshShopifyToken(canonicalUserId, foundCred.values);
    foundCred = {
      connector: "shopify",
      values: freshValues,
    };
  }

  return foundCred;
}

export async function deleteConnectorCredential(
  userId: string | number,
  connector: ConnectorId
) {
  const canonicalUserId = await resolveCanonicalUserId(userId);
  const firestore = (await import("./firestore")).getAdminFirestore();
  if (firestore) {
    try {
      await firestore
        .collection("users")
        .doc(canonicalUserId)
        .collection("connectors")
        .doc(connector)
        .delete();
    } catch (err) {
      console.warn("[ConnectorDb] Firestore delete failed:", err);
    }
  }

  deleteStoredConnectorCredential(keyFor(canonicalUserId, connector));
  return { success: true } as const;
}

function validateAction(action: ConnectorAction) {
  if (
    action.connector === "shopify" &&
    action.action === "update_product_title" &&
    (!action.parameters.productId || !action.parameters.title)
  )
    throw new Error("Shopify product ID and title are required.");
  if (
    action.connector === "slack" &&
    action.action === "send_message" &&
    (!action.parameters.channel || !action.parameters.text)
  )
    throw new Error("Slack channel and message are required.");
}

export function createApprovalRequest(userId: number, action: ConnectorAction) {
  validateAction(action);
  const now = new Date();
  const id = `approval_${crypto.randomUUID()}`;
  const request: ApprovalRequest = {
    id,
    userId,
    action,
    status: "pending",
    createdAt: now,
    expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
  };
  approvals.set(id, request);
  return {
    id,
    connector: action.connector,
    action: action.action,
    status: request.status,
    expiresAt: request.expiresAt,
  };
}

export function getApprovalRequest(userId: number, id: string) {
  const request = approvals.get(id);
  if (
    !request ||
    request.userId !== userId ||
    request.expiresAt.getTime() < Date.now()
  )
    return undefined;
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
