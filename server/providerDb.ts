import { and, desc, eq } from "drizzle-orm";
import { providerCredentials } from "../drizzle/schema";
import { getDb } from "./db";
import { credentialHint, decryptCredential, encryptCredential, maskCredential } from "./credentialCrypto";
import { routeHannaRequest } from "./hannaRouting";

export const providerCatalog = [
  { id: "gemini", name: "Google Gemini", category: "AI model", placeholder: "AIza..." },
  { id: "openai", name: "OpenAI", category: "AI model", placeholder: "sk-..." },
  { id: "anthropic", name: "Anthropic", category: "AI model", placeholder: "sk-ant-..." },
  { id: "llama", name: "Llama / Groq", category: "AI model", placeholder: "gsk_..." },
  { id: "cloudinary", name: "Cloudinary", category: "Media", placeholder: "cloudinary://..." },
  { id: "jules", name: "Jules", category: "Developer", placeholder: "jules_..." },
  { id: "stitch", name: "Stitch", category: "Design", placeholder: "stitch_..." },
  { id: "v0", name: "v0", category: "Developer", placeholder: "v0_..." },
  { id: "custom", name: "Custom provider", category: "OpenAI-compatible", placeholder: "Paste provider key..." },
] as const;

export async function listProviderCredentials(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ id: providerCredentials.id, provider: providerCredentials.provider, displayName: providerCredentials.displayName, keyHint: providerCredentials.keyHint, isEnabled: providerCredentials.isEnabled, updatedAt: providerCredentials.updatedAt }).from(providerCredentials).where(eq(providerCredentials.userId, userId)).orderBy(desc(providerCredentials.updatedAt));
  return rows.map(row => ({ ...row, maskedKey: row.keyHint }));
}

export async function getProviderCredentialById(userId: number, provider: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(providerCredentials).where(and(eq(providerCredentials.userId, userId), eq(providerCredentials.provider, provider), eq(providerCredentials.isEnabled, true))).limit(1);
  if (!rows[0]) return undefined;
  return { provider: rows[0].provider, apiKey: decryptCredential(rows[0].encryptedKey), endpoint: rows[0].endpoint, model: "gpt-4o-mini" };
}

export async function getProviderCredentialForRequest(userId: number, prompt: string) {
  const db = await getDb();
  if (!db) return undefined;
  const route = routeHannaRequest(prompt);
  const providerOrder = route.model.startsWith("gemini") ? ["gemini", "openai", "anthropic", "llama", "custom"] : route.model.startsWith("claude") ? ["anthropic", "openai", "gemini", "llama", "custom"] : ["openai", "gemini", "anthropic", "llama", "custom"];
  for (const provider of providerOrder) {
    const rows = await db.select().from(providerCredentials).where(and(eq(providerCredentials.userId, userId), eq(providerCredentials.provider, provider), eq(providerCredentials.isEnabled, true))).limit(1);
    if (rows[0]) return { provider: rows[0].provider, apiKey: decryptCredential(rows[0].encryptedKey), endpoint: rows[0].endpoint, model: route.model };
  }
  return undefined;
}

export async function upsertProviderCredential(userId: number, provider: string, displayName: string, apiKey: string, endpoint = "") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const encryptedKey = encryptCredential(apiKey);
  await db.insert(providerCredentials).values({ userId, provider, displayName, endpoint, encryptedKey, keyHint: credentialHint(apiKey), isEnabled: true }).onDuplicateKeyUpdate({ set: { displayName, endpoint, encryptedKey, keyHint: credentialHint(apiKey), isEnabled: true, updatedAt: new Date() } });
  return { provider, displayName, maskedKey: maskCredential(apiKey), isEnabled: true };
}

export async function deleteProviderCredential(userId: number, provider: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(providerCredentials).where(and(eq(providerCredentials.userId, userId), eq(providerCredentials.provider, provider)));
  return { success: true } as const;
}
