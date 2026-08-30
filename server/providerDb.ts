import { credentialHint, decryptCredential, encryptCredential, maskCredential } from "./credentialCrypto";
import { routeHannaRequest } from "./hannaRouting";

export const providerCatalog = [
  { id: "gemini", name: "Google Gemini", category: "AI model", placeholder: "AIza..." },
  { id: "openai", name: "OpenAI", category: "AI model", placeholder: "sk-..." },
  { id: "anthropic", name: "Anthropic", category: "AI model", placeholder: "sk-ant-..." },
  { id: "llama", name: "Llama / Groq", category: "AI model", placeholder: "gsk_..." },
  { id: "mistral", name: "Mistral", category: "AI model", placeholder: "mist-..." },
  { id: "openrouter", name: "OpenRouter", category: "AI router", placeholder: "sk-or-..." },
  { id: "heygen", name: "HeyGen Video AI", category: "Content Creation", placeholder: "heygen_..." },
  { id: "synthesia", name: "Synthesia AI", category: "Content Creation", placeholder: "synthesia_..." },
  { id: "elevenlabs", name: "ElevenLabs Voice AI", category: "Content Creation", placeholder: "xi-..." },
  { id: "cloudinary", name: "Cloudinary", category: "Media", placeholder: "cloudinary://..." },
  { id: "jules", name: "Jules Agent", category: "Developer", placeholder: "jules_..." },
  { id: "stitch", name: "Stitch UI", category: "Design", placeholder: "stitch_..." },
  { id: "v0", name: "v0 Generator", category: "Developer", placeholder: "v0_..." },
  { id: "custom", name: "Custom provider", category: "OpenAI-compatible", placeholder: "Paste provider key..." },
] as const;

type CredentialRecord = { provider: string; displayName: string; endpoint: string; encryptedKey: string; keyHint: string; isEnabled: boolean; updatedAt: Date };
const runtimeCredentials = new Map<string, CredentialRecord>();
const keyFor = (userId: number, provider: string) => `${userId}:${provider}`;

/** Temporary backend store. Replace these methods with Firebase Admin/Firestore in production. */
export async function listProviderCredentials(userId: number) {
  return Array.from(runtimeCredentials.entries())
    .filter(([key]) => key.startsWith(`${userId}:`))
    .map(([, row]) => ({ id: keyFor(userId, row.provider), provider: row.provider, displayName: row.displayName, keyHint: row.keyHint, maskedKey: row.keyHint, isEnabled: row.isEnabled, updatedAt: row.updatedAt }));
}

export async function getProviderCredentialById(userId: number, provider: string) {
  const row = runtimeCredentials.get(keyFor(userId, provider));
  if (!row || !row.isEnabled) return undefined;
  return { provider: row.provider, apiKey: decryptCredential(row.encryptedKey), endpoint: row.endpoint, model: "gpt-4o-mini" };
}

export async function getProviderCredentialForRequest(userId: number, prompt: string) {
  const route = routeHannaRequest(prompt);
  const providerOrder = route.model.startsWith("gemini") ? ["gemini", "openai", "anthropic", "llama", "mistral", "openrouter", "custom"] : ["openai", "gemini", "anthropic", "llama", "mistral", "openrouter", "custom"];
  for (const provider of providerOrder) {
    const credential = await getProviderCredentialById(userId, provider);
    if (credential) return { ...credential, model: route.model };
  }
  return undefined;
}

export async function upsertProviderCredential(userId: number, provider: string, displayName: string, apiKey: string, endpoint = "") {
  const record: CredentialRecord = { provider, displayName, endpoint, encryptedKey: encryptCredential(apiKey), keyHint: credentialHint(apiKey), isEnabled: true, updatedAt: new Date() };
  runtimeCredentials.set(keyFor(userId, provider), record);
  return { provider, displayName, maskedKey: maskCredential(apiKey), isEnabled: true };
}

export async function deleteProviderCredential(userId: number, provider: string) {
  runtimeCredentials.delete(keyFor(userId, provider));
  return { success: true } as const;
}
