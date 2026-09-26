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
    name: "Hanna Fast Engine",
    category: "AI model",
    placeholder: "gsk_...",
    docUrl: "https://console.groq.com/keys",
    instructions: [
      "Server uses GROQ_API_KEY for Hanna Fast / Instant / Advanced models.",
      "Optionally add a personal key here to override the workspace default.",
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
    id: "custom",
    name: "Custom provider",
    category: "OpenAI-compatible",
    placeholder: "Paste provider key...",
    docUrl: "https://platform.openai.com/docs/api-reference",
    instructions: [
      "Enter any OpenAI-compatible API key.",
      "Provide custom base endpoint if needed.",
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

export async function getProviderCredentialForRequest(
  userId: number | undefined,
  _prompt: string,
  requestedProviderOrModel?: string
) {
  const resolved = resolveProviderAndModel(requestedProviderOrModel);

  if (userId && resolved.isCustom) {
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

  // Server defaults: Gemini or Groq (for Hanna Fast family)
  if (resolved.provider === "llama") {
    const groqKey = (
      process.env.GROQ_API_KEY ||
      process.env.LLAMA_API_KEY ||
      ""
    ).trim();
    return {
      provider: "llama",
      apiKey: groqKey,
      model: resolved.model,
      endpoint: "",
    };
  }

  const defaultGeminiKey = (process.env.GEMINI_API_KEY || "").trim();
  return {
    provider: "gemini",
    apiKey: defaultGeminiKey,
    model: resolved.model || process.env.GEMINI_MODEL || "gemini-3.5-flash",
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
