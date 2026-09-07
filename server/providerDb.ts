import { resolveProviderAndModel } from "./aiConfig";
import {
  credentialHint,
  decryptCredential,
  encryptCredential,
  maskCredential,
} from "./credentialCrypto";
import {
  deleteStoredProviderCredential,
  getStoredProviderCredentials,
  saveStoredProviderCredential,
} from "./persistentStore";

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
      "Paste your Google Gemini API key below.",
    ],
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
      "Copy your key starting with 'sk-' and paste below.",
    ],
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
      "Paste your Anthropic API Key below.",
    ],
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
      "Copy your Groq key starting with 'gsk_' and paste below.",
    ],
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
      "Paste the key below.",
    ],
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
      "Copy and paste your key below.",
    ],
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
      "Paste your key below.",
    ],
  },
  {
    id: "lovable",
    name: "Lovable AI",
    category: "Developer",
    placeholder: "lovable_...",
    docUrl: "https://docs.lovable.dev",
    instructions: [
      "Log into lovable.dev.",
      "Go to Account Settings -> API Keys.",
      "Generate an API key.",
      "Paste your key below.",
    ],
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
      "Paste your key below.",
    ],
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
      "Paste below.",
    ],
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
      "Paste below.",
    ],
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
      "Paste your API key below.",
    ],
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
      "Paste your key below.",
    ],
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
      "Paste your key below.",
    ],
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
      "Save key below.",
    ],
  },
] as const;

export type CredentialRecord = {
  provider: string;
  displayName: string;
  endpoint: string;
  encryptedKey: string;
  keyHint: string;
  isEnabled: boolean;
  updatedAt: Date;
};

const keyFor = (userId: number, provider: string) => `${userId}:${provider}`;

export async function listProviderCredentials(userId: number) {
  const all = getStoredProviderCredentials();
  const userPrefix = `${userId}:`;

  return Object.entries(all)
    .filter(([k]) => k.startsWith(userPrefix))
    .map(([key, row]) => ({
      id: key,
      provider: row.provider,
      displayName: row.displayName,
      keyHint: row.keyHint,
      maskedKey: row.keyHint,
      isEnabled: Boolean(row.isEnabled),
      updatedAt: new Date(row.updatedAt),
    }));
}

export async function getProviderCredentialById(
  userId: number,
  provider: string
) {
  const all = getStoredProviderCredentials();
  const row = all[keyFor(userId, provider)] as CredentialRecord | undefined;
  if (!row || !row.isEnabled) return undefined;

  const resolved = resolveProviderAndModel(row.provider);

  return {
    provider: row.provider,
    apiKey: decryptCredential(row.encryptedKey),
    endpoint: row.endpoint || "",
    displayName: row.displayName,
    model: resolved.model,
  };
}

/**
 * Resolves user credentials and model pairs deterministically.
 * Hierarchy:
 * 1. User selected custom provider/model -> use user's credential.
 * 2. If no custom credential or "Hanna Default" selected -> default to Gemini 3.6 Flash using server GEMINI_API_KEY.
 */
export async function getProviderCredentialForRequest(
  userId: number,
  prompt: string,
  requestedProviderOrModel?: string
) {
  const resolved = resolveProviderAndModel(requestedProviderOrModel);

  if (resolved.isCustom) {
    const userCred = await getProviderCredentialById(userId, resolved.provider);
    if (userCred && userCred.apiKey) {
      return {
        provider: resolved.provider,
        apiKey: userCred.apiKey,
        model: resolved.model,
        endpoint: userCred.endpoint || "",
      };
    }
  }

  // Canonical Fallback / Default: Hanna's Gemini 3.6 Flash
  const defaultGeminiKey = (process.env.GEMINI_API_KEY || "").trim();
  const envModel = (process.env.GEMINI_MODEL || "gemini-3.6-flash").trim();

  return {
    provider: "gemini",
    apiKey: defaultGeminiKey,
    model: resolved.isCustom ? resolved.model : envModel,
    endpoint: "",
  };
}

export async function upsertProviderCredential(
  userId: number,
  provider: string,
  displayName: string,
  apiKey: string,
  endpoint = ""
) {
  const record: CredentialRecord = {
    provider,
    displayName,
    endpoint,
    encryptedKey: encryptCredential(apiKey),
    keyHint: credentialHint(apiKey),
    isEnabled: true,
    updatedAt: new Date(),
  };

  saveStoredProviderCredential(keyFor(userId, provider), record);

  return {
    provider,
    displayName,
    maskedKey: maskCredential(apiKey),
    isEnabled: true,
  };
}

export async function deleteProviderCredential(
  userId: number,
  provider: string
) {
  deleteStoredProviderCredential(keyFor(userId, provider));
  return { success: true } as const;
}
