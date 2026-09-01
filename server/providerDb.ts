import { credentialHint, decryptCredential, encryptCredential, maskCredential } from "./credentialCrypto";
import { routeHannaRequest } from "./hannaRouting";

export const providerCatalog = [
  {
    id: "gemini",
    name: "Google Gemini",
    category: "AI model",
    placeholder: "AIzaSy...",
    docUrl: "https://ai.google.dev/gemini-api/docs/api-key",
    instructions: [
      "Navigate to Google AI Studio (aistudio.google.com).",
      "Click 'Get API key' -> 'Create API key in new project'.",
      "Copy your key starting with 'AIzaSy...'.",
      "Paste your Google Gemini API key below."
    ]
  },
  {
    id: "openai",
    name: "OpenAI",
    category: "AI model",
    placeholder: "sk-proj-...",
    docUrl: "https://platform.openai.com/api-keys",
    instructions: [
      "Log into platform.openai.com.",
      "Navigate to API Keys in the left side menu.",
      "Click 'Create new secret key'.",
      "Copy your key starting with 'sk-' and paste below."
    ]
  },
  {
    id: "anthropic",
    name: "Anthropic",
    category: "AI model",
    placeholder: "sk-ant-...",
    docUrl: "https://docs.anthropic.com/en/api/getting-started",
    instructions: [
      "Log into console.anthropic.com.",
      "Go to Settings -> API Keys.",
      "Create a key starting with 'sk-ant-'.",
      "Paste your Anthropic API Key below."
    ]
  },
  {
    id: "llama",
    name: "Llama / Groq",
    category: "AI model",
    placeholder: "gsk_...",
    docUrl: "https://console.groq.com/keys",
    instructions: [
      "Log into console.groq.com.",
      "Navigate to API Keys under Developer settings.",
      "Click 'Create API Key'.",
      "Copy your Groq key starting with 'gsk_' and paste below."
    ]
  },
  {
    id: "mistral",
    name: "Mistral",
    category: "AI model",
    placeholder: "mist_...",
    docUrl: "https://console.mistral.ai/api-keys/",
    instructions: [
      "Log into console.mistral.ai.",
      "Navigate to API Keys in the user menu.",
      "Generate a new API Secret Key.",
      "Paste the key below."
    ]
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    category: "AI router",
    placeholder: "sk-or-...",
    docUrl: "https://openrouter.ai/keys",
    instructions: [
      "Log into openrouter.ai.",
      "Go to Account -> API Keys.",
      "Create a new Secret Key.",
      "Copy and paste your key below."
    ]
  },
  {
    id: "heygen",
    name: "HeyGen Video AI",
    category: "Content Creation",
    placeholder: "heygen_...",
    docUrl: "https://docs.heygen.com/reference/api-key-1",
    instructions: [
      "Log into HeyGen Space Settings.",
      "Go to Space -> API Keys.",
      "Generate an API token.",
      "Paste your key below."
    ]
  },
  {
    id: "synthesia",
    name: "Synthesia AI",
    category: "Content Creation",
    placeholder: "synth_...",
    docUrl: "https://docs.synthesia.io/getting-started/api-keys",
    instructions: [
      "Log into your Synthesia account.",
      "Go to Settings -> API Keys.",
      "Generate a new key.",
      "Paste your key below."
    ]
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs Voice AI",
    category: "Content Creation",
    placeholder: "xi-...",
    docUrl: "https://elevenlabs.io/docs/api-reference/text-to-speech",
    instructions: [
      "Log into ElevenLabs.",
      "Click Profile icon -> Profile & API Keys.",
      "Copy your API key.",
      "Paste below."
    ]
  },
  {
    id: "cloudinary",
    name: "Cloudinary",
    category: "Media",
    placeholder: "cloudinary://...",
    docUrl: "https://cloudinary.com/documentation/cloudinary_references",
    instructions: [
      "Log into Cloudinary Console.",
      "Go to Dashboard -> Product Environment Credentials.",
      "Copy your API Environment variable / key.",
      "Paste below."
    ]
  },
  {
    id: "jules",
    name: "Jules Agent",
    category: "Developer",
    placeholder: "jules_...",
    docUrl: "https://jules.google/docs",
    instructions: [
      "Access Google Jules Developer Portal.",
      "Go to API Settings.",
      "Generate a Jules Agent Token.",
      "Paste your API key below."
    ]
  },
  {
    id: "stitch",
    name: "Stitch UI",
    category: "Design",
    placeholder: "stitch_...",
    docUrl: "https://stitch.google/docs",
    instructions: [
      "Access Google Stitch UI Console.",
      "Navigate to API Keys.",
      "Generate a new API Token.",
      "Paste your key below."
    ]
  },
  {
    id: "v0",
    name: "v0 Generator",
    category: "Developer",
    placeholder: "v0_...",
    docUrl: "https://v0.dev/docs/api",
    instructions: [
      "Log into v0.dev.",
      "Go to Account Settings -> API Keys.",
      "Create a secret token.",
      "Paste your key below."
    ]
  },
  {
    id: "custom",
    name: "Custom provider",
    category: "OpenAI-compatible",
    placeholder: "Paste provider key...",
    docUrl: "https://platform.openai.com/docs/api-reference",
    instructions: [
      "Enter any OpenAI-compatible API key.",
      "Provide custom base endpoint if needed (e.g. https://my-custom-llm.com/v1).",
      "Save key below."
    ]
  },
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

export async function getProviderCredentialForRequest(userId: number, prompt: string, requestedProviderOrModel?: string) {
  const route = routeHannaRequest(prompt);

  if (requestedProviderOrModel && !requestedProviderOrModel.startsWith("Hanna ")) {
    const reqLower = requestedProviderOrModel.toLowerCase();
    let preferredProvider = "";
    if (reqLower.includes("gemini")) preferredProvider = "gemini";
    else if (reqLower.includes("anthropic") || reqLower.includes("claude")) preferredProvider = "anthropic";
    else if (reqLower.includes("llama") || reqLower.includes("groq")) preferredProvider = "llama";
    else if (reqLower.includes("mistral")) preferredProvider = "mistral";
    else if (reqLower.includes("openrouter")) preferredProvider = "openrouter";
    else if (reqLower.includes("openai") || reqLower.includes("gpt")) preferredProvider = "openai";
    else if (reqLower.includes("jules")) preferredProvider = "jules";
    else if (reqLower.includes("stitch")) preferredProvider = "stitch";
    else if (reqLower.includes("v0")) preferredProvider = "v0";
    else preferredProvider = "custom";

    const cred = await getProviderCredentialById(userId, preferredProvider);
    if (cred) {
      return { ...cred, model: requestedProviderOrModel };
    }
  }

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
