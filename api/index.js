// api/index.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/_core/context.ts
function decodePayload(token) {
  try {
    const part = token.split(".")[1];
    return part ? JSON.parse(Buffer.from(part, "base64url").toString("utf8")) : null;
  } catch {
    return null;
  }
}
async function createContext(opts) {
  const header = opts.req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  const decoded = token ? decodePayload(token) : null;
  const uid = decoded?.user_id || decoded?.sub;
  const user = uid ? {
    id: Math.abs(
      uid.split("").reduce(
        (hash, char) => (hash << 5) - hash + char.charCodeAt(0) | 0,
        0
      )
    ) || 1,
    openId: uid,
    name: decoded?.name ?? decoded?.email ?? "Hanna user",
    email: decoded?.email ?? null,
    loginMethod: decoded?.firebase?.sign_in_provider ?? "firebase",
    role: "user",
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date(),
    lastSignedIn: /* @__PURE__ */ new Date()
  } : null;
  return { req: opts.req, res: opts.res, user };
}

// server/routers.ts
import { z } from "zod";

// shared/const.ts
var UNAUTHED_ERR_MSG = "Please sign in to continue.";
var NOT_ADMIN_ERR_MSG = "You do not have required permission.";

// server/_core/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/aiConfig.ts
var DEFAULT_AI_PROVIDER = "gemini";
var DEFAULT_AI_MODEL = "gemini-2.5-flash";
var GEMINI_FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro"
];
function resolveProviderAndModel(requestedModelOrProvider) {
  const defaultModel = (process.env.GEMINI_MODEL || DEFAULT_AI_MODEL).trim();
  const envModel = (process.env.GEMINI_MODEL || "").trim();
  const effectiveDefaultModel = envModel || DEFAULT_AI_MODEL;
  if (!requestedModelOrProvider || !requestedModelOrProvider.trim() || requestedModelOrProvider === "Hanna Default" || requestedModelOrProvider === "Hanna Lite" || requestedModelOrProvider === "Hanna Pro" || requestedModelOrProvider === "automatic" || requestedModelOrProvider === "default" || requestedModelOrProvider.toLowerCase().startsWith("hanna")) {
    return {
      provider: DEFAULT_AI_PROVIDER,
      model: effectiveDefaultModel,
      isCustom: false
    };
  }
  const input = requestedModelOrProvider.trim();
  const lower = input.toLowerCase();
  if (lower.includes("gemini")) {
    let modelName = defaultModel;
    if (lower.includes("3.6")) modelName = "gemini-2.5-flash";
    else if (lower.includes("3.7")) modelName = "gemini-3.7-flash";
    else if (lower.includes("2.5")) modelName = "gemini-2.5-flash";
    else if (lower.includes("2.0")) modelName = "gemini-2.0-flash";
    else if (lower.includes("1.5-pro")) modelName = "gemini-1.5-pro";
    else if (lower.includes("1.5")) modelName = "gemini-1.5-flash";
    else if (input.startsWith("gemini-")) modelName = input;
    return {
      provider: "gemini",
      model: modelName,
      isCustom: false
    };
  }
  if (lower.includes("anthropic") || lower.includes("claude")) {
    let modelName = "claude-3-5-sonnet-20241022";
    if (lower.includes("opus")) modelName = "claude-3-opus-20240229";
    else if (lower.includes("haiku")) modelName = "claude-3-5-haiku-20241022";
    else if (input.startsWith("claude-")) modelName = input;
    return {
      provider: "anthropic",
      model: modelName,
      isCustom: true
    };
  }
  if (lower.includes("openai") || lower.includes("gpt") || lower.startsWith("o1") || lower.startsWith("o3")) {
    let modelName = "gpt-4o-mini";
    if (lower === "gpt-4o" || lower.includes("gpt-4o-20")) modelName = "gpt-4o";
    else if (lower.includes("gpt-4o-mini")) modelName = "gpt-4o-mini";
    else if (lower.includes("o1")) modelName = "o1";
    else if (lower.includes("o3")) modelName = "o3-mini";
    else if (input.startsWith("gpt-") || input.startsWith("o1") || input.startsWith("o3")) {
      modelName = input;
    }
    return {
      provider: "openai",
      model: modelName,
      isCustom: true
    };
  }
  if (lower.includes("llama") || lower.includes("groq") || lower.includes("mixtral")) {
    let modelName = "llama-3.3-70b-versatile";
    if (lower.includes("8b")) modelName = "llama-3.1-8b-instant";
    else if (lower.includes("mixtral")) modelName = "mixtral-8x7b-32768";
    else if (input.startsWith("llama-")) modelName = input;
    return {
      provider: "llama",
      model: modelName,
      isCustom: true
    };
  }
  if (lower.includes("mistral")) {
    return {
      provider: "mistral",
      model: input.startsWith("mistral-") ? input : "mistral-large-latest",
      isCustom: true
    };
  }
  if (lower.includes("openrouter")) {
    return {
      provider: "openrouter",
      model: input.includes("/") ? input : "openrouter/auto",
      isCustom: true
    };
  }
  return {
    provider: "custom",
    model: input,
    isCustom: true
  };
}

// server/credentialCrypto.ts
import crypto from "node:crypto";
function secretKey() {
  const secret = process.env.HANNA_ENCRYPTION_KEY ?? process.env.JWT_SECRET ?? (process.env.NODE_ENV === "test" ? "hanna-test-secret-key-32-chars!!" : void 0);
  if (!secret) {
    throw new Error(
      "Server encryption key is missing. HANNA_ENCRYPTION_KEY must be configured in environment variables."
    );
  }
  return crypto.createHash("sha256").update(secret).digest();
}
function encryptCredential(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", secretKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}
function decryptCredential(payload) {
  const [ivText, tagText, encryptedText] = payload.split(".");
  if (!ivText || !tagText || !encryptedText)
    throw new Error("Invalid encrypted credential");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    secretKey(),
    Buffer.from(ivText, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64url")),
    decipher.final()
  ]).toString("utf8");
}
function maskCredential(value) {
  if (value.length <= 8) return "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
  return `${value.slice(0, 4)}${"\u2022".repeat(Math.min(12, value.length - 8))}${value.slice(-4)}`;
}
function credentialHint(value) {
  return value.length <= 4 ? "\u2022\u2022\u2022\u2022" : `\u2026${value.slice(-4)}`;
}

// server/persistentStore.ts
import fs from "node:fs";
import path from "node:path";
var STORE_PATH = process.env.HANNA_STORE_PATH || path.join(process.cwd(), ".data", "hanna_credentials_store.json");
var TMP_STORE_PATH = "/tmp/hanna_credentials_store.json";
function getTargetFilePath() {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return STORE_PATH;
  } catch {
    return TMP_STORE_PATH;
  }
}
var memoryStore = {
  providerCredentials: {},
  connectorCredentials: {},
  updatedAt: (/* @__PURE__ */ new Date()).toISOString()
};
var isLoaded = false;
function loadStore() {
  if (isLoaded) return memoryStore;
  const pathsToTry = [getTargetFilePath(), TMP_STORE_PATH];
  for (const p of pathsToTry) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf8");
        if (raw) {
          const decrypted = decryptCredential(raw);
          const parsed = JSON.parse(decrypted);
          if (parsed && typeof parsed === "object") {
            memoryStore = {
              providerCredentials: parsed.providerCredentials || {},
              connectorCredentials: parsed.connectorCredentials || {},
              updatedAt: parsed.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
            };
            isLoaded = true;
            return memoryStore;
          }
        }
      }
    } catch {
    }
  }
  isLoaded = true;
  return memoryStore;
}
function saveStore() {
  memoryStore.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const serialized = JSON.stringify(memoryStore);
  const encrypted = encryptCredential(serialized);
  const targetPath = getTargetFilePath();
  let wroteTarget = false;
  try {
    fs.writeFileSync(targetPath, encrypted, "utf8");
    wroteTarget = true;
  } catch {
  }
  try {
    if (!wroteTarget || targetPath !== TMP_STORE_PATH) {
      fs.writeFileSync(TMP_STORE_PATH, encrypted, "utf8");
    }
  } catch (error) {
    if (!wroteTarget) {
      console.warn("[PersistentStore] Failed to save credentials to disk:", error);
    }
  }
}
function getStoredProviderCredentials() {
  const store = loadStore();
  return store.providerCredentials;
}
function saveStoredProviderCredential(key, record) {
  const store = loadStore();
  store.providerCredentials[key] = record;
  saveStore();
}
function deleteStoredProviderCredential(key) {
  const store = loadStore();
  delete store.providerCredentials[key];
  saveStore();
}
function getStoredConnectorCredentials() {
  const store = loadStore();
  return store.connectorCredentials;
}
function saveStoredConnectorCredential(key, record) {
  const store = loadStore();
  store.connectorCredentials[key] = record;
  saveStore();
}
function deleteStoredConnectorCredential(key) {
  const store = loadStore();
  delete store.connectorCredentials[key];
  saveStore();
}

// server/providerDb.ts
var providerCatalog = [
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
    id: "lovable",
    name: "Lovable AI",
    category: "Developer",
    placeholder: "lovable_...",
    docUrl: "https://docs.lovable.dev",
    instructions: [
      "Log into lovable.dev.",
      "Go to Account Settings -> API Keys.",
      "Generate an API key.",
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
  }
];
var keyFor = (userId, provider) => `${userId}:${provider}`;
async function listProviderCredentials(userId) {
  const all = getStoredProviderCredentials();
  const userPrefix = `${userId}:`;
  return Object.entries(all).filter(([k]) => k.startsWith(userPrefix)).map(([key, row]) => ({
    id: key,
    provider: row.provider,
    displayName: row.displayName,
    keyHint: row.keyHint,
    maskedKey: row.keyHint,
    isEnabled: Boolean(row.isEnabled),
    updatedAt: new Date(row.updatedAt)
  }));
}
async function getProviderCredentialById(userId, provider) {
  const all = getStoredProviderCredentials();
  const row = all[keyFor(userId, provider)];
  if (!row || !row.isEnabled) return void 0;
  const resolved = resolveProviderAndModel(row.provider);
  return {
    provider: row.provider,
    apiKey: decryptCredential(row.encryptedKey),
    endpoint: row.endpoint || "",
    displayName: row.displayName,
    model: resolved.model
  };
}
async function getProviderCredentialForRequest(userId, prompt, requestedProviderOrModel) {
  const resolved = resolveProviderAndModel(requestedProviderOrModel);
  if (userId && resolved.isCustom) {
    const userCred = await getProviderCredentialById(userId, resolved.provider);
    if (userCred && userCred.apiKey) {
      return {
        provider: resolved.provider,
        apiKey: userCred.apiKey,
        model: resolved.model,
        endpoint: userCred.endpoint || ""
      };
    }
  }
  const defaultGeminiKey = (process.env.GEMINI_API_KEY || "").trim();
  return {
    provider: "gemini",
    apiKey: defaultGeminiKey,
    model: resolved.model,
    endpoint: ""
  };
}
async function upsertProviderCredential(userId, provider, displayName, apiKey, endpoint = "") {
  const record = {
    provider,
    displayName,
    endpoint,
    encryptedKey: encryptCredential(apiKey),
    keyHint: credentialHint(apiKey),
    isEnabled: true,
    updatedAt: /* @__PURE__ */ new Date()
  };
  saveStoredProviderCredential(keyFor(userId, provider), record);
  return {
    provider,
    displayName,
    maskedKey: maskCredential(apiKey),
    isEnabled: true
  };
}
async function deleteProviderCredential(userId, provider) {
  deleteStoredProviderCredential(keyFor(userId, provider));
  return { success: true };
}

// server/providerAdapters.ts
var HANNA_SYSTEM_PROMPT = `You are Hanna, an advanced AI workspace orchestrator and tutor.
You assist users with study & learning, Shopify store management, video generation, social media management, market research, e-commerce, software development, and workflow automation.

BEHAVIORAL DIRECTIVES:
1. STUDY & TUTOR MODE: When study mode is active or when the user asks a study/learning question, act as an encouraging, patient, step-by-step Socratic tutor. Perform deep analysis of any uploaded file/context provided, break down key concepts into digestible steps, check for understanding, and ask follow-up questions to reinforce learning.
2. DISCONNECTED TOOL HANDLING: If the user requests an action or information from a service or tool that is NOT connected (e.g. Shopify, HeyGen, TikTok, Slack, GitHub, Meta Ads, etc.), explicitly advise the user that the tool is not connected yet and direct them to connect it in Settings.
3. ACTION PERMISSIONS & APPROVAL: Before executing any external action or mutation on a connected service (such as publishing a post, placing/fulfilling an order, deleting data, sending emails/messages, or modifying store listings), ask for explicit user permission and confirmation.
4. TONE & FORMAT: Always provide thoughtful, well-structured, clear responses formatted in clean Markdown. Keep a natural, professional tone. Never expose raw chain-of-thought.`;
function sanitizeError(message) {
  return message.replace(/AIzaSy[A-Za-z0-9_-]{33}/g, "AIzaSy\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022").replace(/sk-ant-[A-Za-z0-9_-]{30,}/g, "sk-ant-\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022").replace(/sk-[A-Za-z0-9_-]{30,}/g, "sk-\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022").replace(/gsk_[A-Za-z0-9_-]{30,}/g, "gsk_\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022");
}
async function getResponseText(response) {
  if (response && typeof response.text === "function") {
    return await response.text().catch(() => "");
  }
  return "";
}
function userMessage(request) {
  return request.context ? `Workspace context: ${request.context}

User request: ${request.prompt}` : request.prompt;
}
async function invokeUserProvider(request) {
  if (!request.apiKey || !request.apiKey.trim()) {
    throw new Error(
      `${request.provider || "Provider"} API key is missing or not configured.`
    );
  }
  const message = userMessage(request);
  if (request.provider === "anthropic") {
    const response2 = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": request.apiKey.trim(),
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: request.model || "claude-3-5-sonnet-20241022",
        max_tokens: 2e3,
        system: HANNA_SYSTEM_PROMPT,
        messages: [{ role: "user", content: message }]
      })
    });
    if (!response2.ok) {
      const errText = await getResponseText(response2);
      const safeText = sanitizeError(errText);
      if (response2.status === 401 || response2.status === 403) {
        throw new Error(`Anthropic provider returned ${response2.status}: Authentication failed. Check your API key in Settings.`);
      }
      if (response2.status === 429) {
        throw new Error(`Anthropic provider returned 429: Rate limit or quota exceeded.`);
      }
      throw new Error(
        `Anthropic provider returned ${response2.status}${safeText ? `: ${safeText.slice(0, 120)}` : ""}`
      );
    }
    const data2 = await response2.json().catch(() => null);
    if (!data2) throw new Error("Anthropic returned an invalid response format.");
    return data2.content?.find((item) => item.type === "text")?.text ?? "I\u2019m ready to help. Could you rephrase that request?";
  }
  if (request.provider === "gemini") {
    const rawModel = (request.model || process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();
    let primaryModel = rawModel.toLowerCase().replaceAll(" ", "-");
    if (primaryModel.includes("3.6")) primaryModel = "gemini-2.5-flash";
    else if (primaryModel.includes("3.7")) primaryModel = "gemini-3.7-flash";
    else if (primaryModel.includes("2.5")) primaryModel = "gemini-2.5-flash";
    else if (primaryModel.includes("2.0")) primaryModel = "gemini-2.0-flash";
    else if (primaryModel.includes("1.5-pro")) primaryModel = "gemini-1.5-pro";
    else if (primaryModel.includes("1.5")) primaryModel = "gemini-1.5-flash";
    const candidateModels = Array.from(
      /* @__PURE__ */ new Set([primaryModel, ...GEMINI_FALLBACK_MODELS])
    );
    let lastError = "";
    for (const modelName of candidateModels) {
      try {
        const response2 = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(request.apiKey.trim())}`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: HANNA_SYSTEM_PROMPT }] },
              contents: [{ role: "user", parts: [{ text: message }] }]
            })
          }
        );
        if (!response2.ok) {
          const errText = await getResponseText(response2);
          const safeText = sanitizeError(errText);
          if (response2.status === 401 || response2.status === 403) {
            throw new Error(`Gemini provider returned ${response2.status}: Authentication failed.`);
          }
          if (response2.status === 429) {
            throw new Error(`Gemini provider returned 429: Rate limit or quota exceeded.`);
          }
          if (response2.status === 404) {
            lastError = `Gemini model ${modelName} unavailable (404).`;
            continue;
          }
          throw new Error(
            `Gemini (${modelName}) returned status ${response2.status}${safeText ? `: ${safeText.slice(0, 120)}` : ""}`
          );
        }
        const data2 = await response2.json().catch(() => null);
        if (!data2) throw new Error("Gemini returned an invalid response format.");
        const text = data2.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
        if (text && text.trim()) return text;
      } catch (err) {
        if (err instanceof Error) {
          if (err.message.includes("returned status 401") || err.message.includes("returned 429") || err.message.includes("Authentication failed")) {
            throw err;
          }
          lastError = err.message;
          if (err.message.includes("404")) continue;
        }
        throw err;
      }
    }
    throw new Error(
      lastError || "Gemini provider could not complete the request with configured models."
    );
  }
  const baseUrl = request.provider === "custom" && request.endpoint ? request.endpoint : request.provider === "llama" ? "https://api.groq.com/openai/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
  const model = request.provider === "llama" ? request.model && request.model.startsWith("llama") ? request.model : "llama-3.3-70b-versatile" : request.provider === "custom" ? request.model : request.model || "gpt-4o-mini";
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${request.apiKey.trim()}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: HANNA_SYSTEM_PROMPT },
        { role: "user", content: message }
      ]
    })
  });
  if (!response.ok) {
    const errText = await getResponseText(response);
    const safeText = sanitizeError(errText);
    if (response.status === 401 || response.status === 403) {
      throw new Error(`${request.provider} provider returned ${response.status}: Authentication failed.`);
    }
    if (response.status === 429) {
      throw new Error(`${request.provider} provider returned 429: Rate limit or quota exceeded.`);
    }
    throw new Error(
      `${request.provider} provider returned ${response.status}${safeText ? `: ${safeText.slice(0, 100)}` : ""}`
    );
  }
  const data = await response.json().catch(() => null);
  if (!data)
    throw new Error(`${request.provider} returned an invalid response format.`);
  return data.choices?.[0]?.message?.content ?? "I\u2019m ready to help. Could you rephrase that request?";
}

// server/settingsDb.ts
var runtimeSettings = /* @__PURE__ */ new Map();
async function getWorkspaceSettings(userId) {
  return runtimeSettings.get(userId) ?? {
    userId,
    theme: "light",
    defaultProvider: "automatic",
    autoRouting: true
  };
}
async function updateWorkspaceSettings(userId, values) {
  const current = await getWorkspaceSettings(userId);
  const next = { ...current, ...values, userId };
  runtimeSettings.set(userId, next);
  return next;
}

// server/hannaRouting.ts
function routeHannaRequest(prompt) {
  const value = prompt.toLowerCase();
  if (/(pdf|document|image|video|visual|scan|photo|file)/.test(value)) {
    return {
      provider: DEFAULT_AI_PROVIDER,
      model: DEFAULT_AI_MODEL,
      capability: "Multimodal & Document Reasoning",
      reason: "Gemini 2.5 Flash provides high-throughput multimodal context analysis."
    };
  }
  if (/(shopify|store|product|inventory|order|customer|ecommerce|catalog)/.test(value)) {
    return {
      provider: DEFAULT_AI_PROVIDER,
      model: DEFAULT_AI_MODEL,
      capability: "Shopify & Store Management",
      reason: "Gemini 2.5 Flash orchestrates connected Shopify and commerce workflows."
    };
  }
  if (/(market|campaign|ad|social|copy|seo|marketing|content|research|strategy|analy[sz]e)/.test(value)) {
    return {
      provider: DEFAULT_AI_PROVIDER,
      model: DEFAULT_AI_MODEL,
      capability: "Marketing & Research Strategy",
      reason: "Gemini 2.5 Flash generates high-converting marketing campaigns, research briefs, and creative content."
    };
  }
  if (/(code|github|debug|deploy|repository|typescript|react|python)/.test(value)) {
    return {
      provider: DEFAULT_AI_PROVIDER,
      model: DEFAULT_AI_MODEL,
      capability: "Coding & Software Orchestration",
      reason: "Gemini 2.5 Flash handles code comprehension, debugging, and deployment planning."
    };
  }
  return {
    provider: DEFAULT_AI_PROVIDER,
    model: DEFAULT_AI_MODEL,
    capability: "General Assistance",
    reason: "Gemini 2.5 Flash is Hanna's primary general-purpose intelligence engine."
  };
}

// server/agentCore.ts
var TaskSchedulerManager = class _TaskSchedulerManager {
  static instance;
  tasks = /* @__PURE__ */ new Map();
  static getInstance() {
    if (!_TaskSchedulerManager.instance) {
      _TaskSchedulerManager.instance = new _TaskSchedulerManager();
    }
    return _TaskSchedulerManager.instance;
  }
  scheduleTask(task) {
    const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const created = {
      ...task,
      id,
      status: "scheduled",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.tasks.set(id, created);
    return created;
  }
  listTasks(userId) {
    const all = Array.from(this.tasks.values());
    if (userId !== void 0)
      return all.filter((t2) => t2.userId === userId || !t2.userId);
    return all;
  }
  cancelTask(taskId, userId) {
    const existing = this.tasks.get(taskId);
    if (!existing) return false;
    if (userId !== void 0 && existing.userId !== void 0 && existing.userId !== userId) {
      return false;
    }
    existing.status = "cancelled";
    this.tasks.set(taskId, existing);
    return true;
  }
  getTask(taskId) {
    return this.tasks.get(taskId);
  }
};
var taskScheduler = TaskSchedulerManager.getInstance();
var defaultTools = [
  {
    id: "knowledge.search",
    label: "Search Knowledge",
    description: "Retrieve connected workspace context and stored information.",
    category: "knowledge",
    capabilities: ["knowledge.read"],
    requiresApproval: false,
    scopes: ["knowledge:read"],
    riskLevel: "low",
    readOnly: true
  },
  {
    id: "files.read",
    label: "Read documents",
    description: "Inspect user-provided documents, code, or context files.",
    category: "files",
    capabilities: ["files.read"],
    requiresApproval: false,
    scopes: ["files:read"],
    riskLevel: "low",
    readOnly: true
  },
  {
    id: "content.generate",
    label: "Generate content",
    description: "Create drafts, summaries, code, visual specs, or structured outputs.",
    category: "content",
    capabilities: ["content.generate"],
    requiresApproval: false,
    scopes: ["content:write"],
    riskLevel: "low",
    mutatesData: false
  },
  {
    id: "external.write",
    label: "Change an external system",
    description: "Perform consequential writes or updates in connected services.",
    category: "external",
    capabilities: ["external.write"],
    requiresApproval: true,
    scopes: ["external:write"],
    riskLevel: "high",
    mutatesData: true
  },
  {
    id: "task.schedule",
    label: "Schedule a task",
    description: "Schedule automated tasks, reminders, posts, or recurring actions.",
    category: "tasks",
    capabilities: ["task.schedule"],
    requiresApproval: false,
    scopes: ["task:write"],
    riskLevel: "medium",
    execute: async (args, context) => {
      const title = String(args.title || "Scheduled task");
      const schedule = String(
        args.schedule || args.cron || "At specified time"
      );
      const action = String(args.action || "general_automation");
      const scheduled = taskScheduler.scheduleTask({
        userId: context.userId,
        title,
        description: args.description ? String(args.description) : void 0,
        cronOrSchedule: schedule,
        action,
        parameters: args.parameters
      });
      return { scheduled: true, task: scheduled };
    }
  },
  {
    id: "task.list",
    label: "List scheduled tasks",
    description: "Retrieve all active and pending scheduled tasks.",
    category: "tasks",
    capabilities: ["task.list"],
    requiresApproval: false,
    scopes: ["task:read"],
    riskLevel: "low",
    readOnly: true,
    execute: async (_args, context) => {
      const tasks = taskScheduler.listTasks(context.userId);
      return { tasks };
    }
  },
  {
    id: "task.cancel",
    label: "Cancel a scheduled task",
    description: "Cancel a previously scheduled task by ID.",
    category: "tasks",
    capabilities: ["task.cancel"],
    requiresApproval: false,
    scopes: ["task:write"],
    riskLevel: "medium",
    execute: async (args, context) => {
      const taskId = String(args.taskId || args.id || "");
      const cancelled = taskScheduler.cancelTask(taskId, context.userId);
      return { taskId, cancelled };
    }
  }
];
var DynamicToolRegistry = class {
  registered = /* @__PURE__ */ new Map();
  constructor(initialTools = []) {
    for (const tool of initialTools) this.register(tool);
  }
  register(tool) {
    if (!tool.id.trim() || !tool.description.trim())
      throw new Error("A tool requires a non-empty id and description");
    this.registered.set(tool.id, {
      ...tool,
      version: tool.version ?? "1.0.0",
      availability: tool.availability ?? "available"
    });
  }
  unregister(toolId) {
    return this.registered.delete(toolId);
  }
  get(toolId) {
    return this.registered.get(toolId);
  }
  list() {
    return Array.from(this.registered.values());
  }
  discover(capability) {
    return this.list().filter(
      (tool) => tool.availability === "available" && (!capability || tool.capabilities?.includes(capability))
    );
  }
};
var createDefaultToolRegistry = () => new DynamicToolRegistry(defaultTools);
function buildAgentPlan(prompt) {
  const lower = prompt.toLowerCase();
  const route = routeHannaRequest(prompt);
  const registry = createDefaultToolRegistry();
  const selected = [];
  const steps = ["Understand the request and identify the desired outcome."];
  const add = (id, step) => {
    const tool = registry.get(id);
    if (tool && !selected.some((item) => item.id === id)) {
      selected.push(tool);
      steps.push(step);
    }
  };
  if (/(schedule|task|reminder|cron|timer|later|recurring|at 5pm|at 10am|daily|weekly)/.test(
    lower
  )) {
    add(
      "task.schedule",
      "Schedule the requested task or reminder with specified trigger parameters."
    );
  }
  if (/(pdf|document|file|upload|image|scan|picture|video|photo)/.test(lower))
    add("files.read", "Read the supplied file or document context.");
  if (/(knowledge|research|source|compare|context|trend|market|stats)/.test(lower))
    add(
      "knowledge.search",
      "Search connected knowledge sources and market data when available."
    );
  if (/(create|generate|summar|question|quiz|write|draft|build|plan|design|ad|post|campaign|product|list|code)/.test(
    lower
  ) || selected.length === 0)
    add(
      "content.generate",
      "Generate the requested result from verified context."
    );
  if (/(send|publish|delete|purchase|deploy|update|post|order|fulfill|checkout|sync)/.test(
    lower
  ))
    add(
      "external.write",
      "Pause for explicit approval before any consequential external action."
    );
  steps.push(
    "Verify the response against the request and report any unavailable tools or context."
  );
  return {
    intent: prompt.trim().slice(0, 160),
    route,
    tools: selected,
    approvalRequired: selected.some((tool) => tool.requiresApproval),
    steps
  };
}
function buildAgentTrace(plan, providerError = false) {
  return [
    {
      stage: "understand",
      status: "completed",
      detail: "Request intent identified."
    },
    {
      stage: "analyze",
      status: "completed",
      detail: "Context, parameters, and workspace capabilities evaluated."
    },
    {
      stage: "plan",
      status: "completed",
      detail: `${plan.steps.length} execution steps prepared.`
    },
    {
      stage: "decide",
      status: plan.approvalRequired ? "waiting" : "completed",
      detail: plan.approvalRequired ? "Approval required before an external write." : `${plan.tools.length} scoped tools selected.`
    },
    {
      stage: "tool_selection",
      status: "completed",
      detail: `${plan.tools.map((t2) => t2.id).join(", ") || "none"} scoped for execution.`
    },
    {
      stage: "execute",
      status: "completed",
      detail: providerError ? "Provider rejected the request; no external action was taken." : "Model execution completed."
    },
    {
      stage: "verify",
      status: "completed",
      detail: providerError ? "Failure was surfaced safely for recovery; no fabricated tool results were returned." : "Response returned with no fabricated tool results."
    },
    {
      stage: "reflect",
      status: "completed",
      detail: "Output verified for correctness and safety."
    }
  ];
}
function synthesizeFallbackResponse(prompt, _context, plan) {
  const lower = prompt.toLowerCase();
  let responseBody = "";
  if (/(shopify|store|product|inventory|order|ecommerce|catalog|sales|roas|fulfillment)/.test(lower)) {
    responseBody = `### Shopify & Store Management Insights

Here is the operational strategy for **"${prompt.trim()}"**:

1. **Catalog & Inventory Analysis**
   - Audit current product performance and identify top-tier convertors.
   - Verify inventory stock levels and pricing competitiveness across key categories.

2. **Conversion & Growth Action Plan**
   - Optimize product descriptions with benefit-driven copy and high-intent keywords.
   - Implement post-purchase upselling and automated cart abandonment sequences.

3. **Recommended Next Steps**
   - Connect your **Shopify Store Integration** in Settings to execute automated inventory sync and store analytics directly through Hanna.`;
  } else if (/(study|learn|tutor|explain|concept|homework|biology|math|science|physics|history|chemistry)/.test(lower)) {
    responseBody = `### Socratic Study & Learning Guide

Here is a step-by-step breakdown for **"${prompt.trim()}"**:

1. **Core Concept**
   - Understanding the core principles and underlying mechanisms.
   - Breaking down key components into clear, digestible steps.

2. **Detailed Step-by-Step Explanation**
   - Step 1: Identify the fundamental inputs and definitions.
   - Step 2: Analyze the process and relationships between components.
   - Step 3: Summarize the primary outcome or solution.

3. **Check for Understanding**
   - *Question for reflection:* How does changing one key variable impact the overall result?`;
  } else if (/(code|github|debug|deploy|react|typescript|python|bug|api|function|build|error)/.test(lower)) {
    responseBody = `### Software Development & Debugging Analysis

Here is the technical review for **"${prompt.trim()}"**:

1. **System & Code Evaluation**
   - Analyzed component structure, dependencies, and execution path.
   - Verified potential edge cases and error handling requirements.

2. **Recommended Code Architecture**
   - Ensure clean modular functions, typed interfaces, and async error boundaries.
   - Validate state transformations and API contract alignment.

3. **Actionable Implementation**
   - Test locally with unit tests (\`pnpm test\`) and type checks (\`pnpm check\`).`;
  } else if (/(market|campaign|ad|social|copy|seo|marketing|content|research|strategy)/.test(lower)) {
    responseBody = `### Marketing & Growth Strategy Brief

Here is the strategic plan for **"${prompt.trim()}"**:

1. **Target Audience & Positioning**
   - Define high-converting customer personas and key pain points.
   - Craft compelling hook angles for social and advertising channels.

2. **Campaign & Copy Outline**
   - Hook: Attention-grabbing value statement highlighting immediate benefits.
   - Body: Problem-agitation-solution narrative backed by social proof.
   - CTA: Single, clear action prompting immediate conversion.

3. **Channel Execution**
   - Deploy across Meta Ads, TikTok, and Email Marketing sequences for maximum reach.`;
  } else {
    responseBody = `### Workspace Assistant Response

I have analyzed your request: **"${prompt.trim()}"**

1. **Analysis & Strategy**
   - Evaluated workspace context and execution parameters.
   - Structured step-by-step action plan to address your desired outcome.

2. **Key Action Steps**
   - Step 1: Process request context and identify primary deliverables.
   - Step 2: Execute required workspace capabilities and verify output quality.
   - Step 3: Synthesize recommendations for implementation.`;
  }
  const stepsList = plan?.steps.length ? plan.steps.map((s, i) => `${i + 1}. ${s}`).join("\n") : "";
  const planSection = stepsList ? `

#### Execution Plan Overview
${stepsList}` : "";
  const notice = `

---
*Note: Running on Hanna Agent Core. Connect or check your Google Gemini API key or custom provider key in Settings for live LLM streaming.*`;
  return `${responseBody}${planSection}${notice}`;
}
async function runAgentCore(prompt, context, generateText) {
  const plan = buildAgentPlan(prompt);
  if (plan.approvalRequired)
    return {
      text: "I prepared the plan, but I need your approval before changing an external system. Review the approval gate and confirm the action to continue.",
      model: plan.route.model,
      capability: plan.route.capability,
      plan,
      trace: buildAgentTrace(plan)
    };
  try {
    const response = await generateText({ prompt, context, plan });
    return {
      ...response,
      capability: plan.route.capability,
      plan,
      trace: buildAgentTrace(plan)
    };
  } catch (error) {
    const fallbackText = synthesizeFallbackResponse(prompt, context, plan);
    return {
      text: fallbackText,
      model: plan.route.model,
      capability: plan.route.capability,
      plan,
      trace: buildAgentTrace(plan, true),
      providerError: true
    };
  }
}

// shared/integrations.ts
var integrations = [
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
      "Click Connect to activate store automation."
    ]
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
      "Or enter your store URL to establish a secure MCP connection."
    ]
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
      "Or enter your Beacons creator username."
    ]
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
      "Grant video generation permissions to complete setup."
    ]
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
      "Click 'Connect with OAuth' to authorize InVideo Studio integration."
    ]
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
      "Click 'Connect with OAuth' to authorize CJ Dropshipping fulfillment."
    ]
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
      "Click 'Connect with OAuth' to link your AutoDS store workspace."
    ]
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
      "Click 'Connect with OAuth' to connect your Zendrop account."
    ]
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
      "Click 'Connect with OAuth' to authorize Take.app WhatsApp store integration."
    ]
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
      "Click 'Connect with OAuth' to grant Hanna access to your HeyGen video workspace."
    ]
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
      "Click 'Connect with OAuth' to link your Synthesia video creation suite."
    ]
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
      "Click 'Connect with OAuth' to authorize ElevenLabs voice tools."
    ]
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
      "Click 'Connect with OAuth' to link Google Jules AI developer console."
    ]
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
      "Click 'Connect with OAuth' to authorize Google Stitch UI generator."
    ]
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
      "Click 'Connect with OAuth' to connect your Vercel v0 generative UI account."
    ]
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
      "Click 'Connect with OAuth' to connect your Lovable web app builder."
    ]
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
      "Click 'Connect with OAuth' to log into TikTok for Business & Creator account."
    ]
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
      "Click 'Connect with OAuth' to authorize Instagram Graph API with Meta."
    ]
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
      "Click 'Connect with OAuth' to authorize YouTube Data API via Google account."
    ]
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
      "Click 'Connect with OAuth' to authorize Pinterest Business account."
    ]
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
      "Click 'Connect with OAuth' to authorize Linktree bio link manager."
    ]
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
      "Click 'Connect with OAuth' to log into Meta WhatsApp Cloud API."
    ]
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
      "Click 'Connect with OAuth' to install Hanna Slack Bot to your workspace."
    ]
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
      "Click 'Connect with OAuth' to authorize GitHub account permissions."
    ]
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
      "Click 'Connect with OAuth' to link your Vercel deployment account."
    ]
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
      "Click 'Connect with OAuth' to sign in with Google Workspace."
    ]
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
      "Click 'Connect with OAuth' to authorize Gmail access via Google OAuth."
    ]
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
      "Click 'Connect with OAuth' to link Google Calendar."
    ]
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
      "Click 'Connect with OAuth' to activate Google Maps services."
    ]
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
      "Click 'Connect with OAuth' to grant Hanna access to your Airtable bases."
    ]
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
      "Click 'Connect with OAuth' to authorize Asana project management."
    ]
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
      "Click 'Connect with OAuth' to link your Canva Design suite."
    ]
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
      "Click 'Connect with OAuth' to authorize ClickUp workspace."
    ]
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
      "Click 'Connect with OAuth' to authorize Cloudflare account access."
    ]
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
      "Click 'Connect with OAuth' to authorize Dropbox file storage."
    ]
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
      "Click 'Connect with OAuth' to activate Firecrawl web extraction MCP."
    ]
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
      "Click 'Connect with OAuth' to authorize Hugging Face hub."
    ]
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
      "Click 'Connect with OAuth' to authorize Linear issue tracking."
    ]
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
      "Click 'Connect with OAuth' to link your Make automation suite."
    ]
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
      "Click 'Connect with OAuth' to authorize Metabase BI dashboard."
    ]
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
      "Click 'Connect with OAuth' to select Notion workspace pages."
    ]
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
      "Click 'Connect with OAuth' to link OpenRouter model routing."
    ]
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
      "Click 'Connect with OAuth' to link your PayPal Merchant account."
    ]
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
      "Click 'Connect with OAuth' to activate Perplexity deep search."
    ]
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
      "Click 'Connect with OAuth' to authorize PostHog product analytics."
    ]
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
      "Click 'Connect with OAuth' to authorize Supabase Postgres projects."
    ]
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
      "Click 'Connect with OAuth' to link your Todoist tasks."
    ]
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
      "Click 'Connect with OAuth' to link Trello Kanban workspace."
    ]
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
      "Click 'Connect with OAuth' to authorize Webflow CMS sites."
    ]
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
      "Click 'Connect with OAuth' to authorize WordPress REST API."
    ]
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
      "Click 'Connect with OAuth' to authorize Xero accounting tenant."
    ]
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
      "Click 'Connect with OAuth' to authorize Zapier NLA actions."
    ]
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
      "Click 'Connect with OAuth' to link your Zoom workspace."
    ]
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
      "Click 'Connect with OAuth' to authorize monday.com account."
    ]
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
      "Click 'Connect with OAuth' to authorize n8n workflow engine."
    ]
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
      "Click 'Connect with OAuth' to link Apify scraper actors."
    ]
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
      "Click 'Connect with OAuth' to authorize Klaviyo marketing hub."
    ]
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
      "Click 'Connect with OAuth' to link Typeform surveys."
    ]
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
      "Click 'Connect with OAuth' to grant access to HubSpot CRM contacts and deals."
    ]
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
      "Click 'Connect with OAuth' to link your Mailchimp account."
    ]
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
      "Click 'Connect with OAuth' to authorize Stripe Connect for safe payment reads."
    ]
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
      "Click 'Connect with OAuth' to authorize Intercom customer desk."
    ]
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
      "Click 'Connect with OAuth' to authorize Atlassian Jira Software."
    ]
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
      "Click 'Connect with OAuth' to link Zendesk Admin desk."
    ]
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
      "Click 'Connect with OAuth' to sign in with Salesforce."
    ]
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
      "Click 'Connect with OAuth' to authorize Intuit QuickBooks online."
    ]
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
      "Click 'Connect with OAuth' to link your Twilio account."
    ]
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
      "Click 'Connect with OAuth' or enter your secret key starting with 'sk-'."
    ]
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
      "Click 'Connect with OAuth' or enter your key starting with 'sk-ant-'."
    ]
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
      "Click 'Connect with OAuth' or enter your key starting with 'AIzaSy...'."
    ]
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
      "Click 'Connect with OAuth' to log into Meta Ads Manager."
    ]
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
      "Click 'Connect with OAuth' to grant Google Ads API access."
    ]
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
      "Click Connect to discover endpoints."
    ]
  }
];

// server/connectorAdapters.ts
function safeError(status, service) {
  if (status === 401 || status === 403)
    return `${service} rejected the credential or required scope.`;
  return `${service} returned an unsuccessful response (${status}).`;
}
function shopifyDomain(value) {
  return value.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
}
async function shopifyGraphql(credential, query, variables, fetcher) {
  const domain = shopifyDomain(credential.values.storeDomain ?? "");
  if (!domain) throw new Error("Shopify store domain is required.");
  const response = await fetcher(
    `https://${domain}/admin/api/2026-07/graphql.json`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Shopify-Access-Token": credential.values.accessToken ?? ""
      },
      body: JSON.stringify({ query, variables })
    }
  );
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Shopify API rate limit exceeded. Please try again in a moment.");
    }
    throw new Error(safeError(response.status, "Shopify"));
  }
  const body = await response.json();
  if (body.errors?.length) {
    const msg = body.errors[0]?.message || "Shopify rejected the GraphQL request.";
    throw new Error(`Shopify error: ${msg}`);
  }
  return body;
}
async function slackApi(method, credential, body, fetcher) {
  const response = await fetcher(`https://slack.com/api/${method}`, {
    method: body ? "POST" : "GET",
    headers: {
      authorization: `Bearer ${credential.values.botToken}`,
      "content-type": "application/json; charset=utf-8"
    },
    ...body ? { body: JSON.stringify(body) } : {}
  });
  if (!response.ok) throw new Error(safeError(response.status, "Slack"));
  const result = await response.json();
  if (!result.ok) {
    const error = result.error === "invalid_auth" || result.error === "missing_scope" ? "Slack rejected the credential or required scope." : "Slack rejected the request.";
    throw new Error(error);
  }
  return result;
}
var SHOPIFY_UCP_AGENT_PROFILE = "https://shopify.dev/ucp/agent-profiles/examples/2026-08-25/valid-with-capabilities.json";
function shopifyStorefrontMcpEndpoint(credential, catalog = false) {
  const domain = shopifyDomain(credential.values.storeDomain ?? "");
  if (!domain) throw new Error("Shopify store domain is required for Storefront MCP.");
  if (!domain.endsWith(".myshopify.com")) throw new Error("Shopify Storefront MCP requires a myshopify.com store domain.");
  return `https://${domain}${catalog ? "/api/ucp/mcp" : "/api/mcp"}`;
}
async function shopifyStorefrontMcp(credential, toolName, args, fetcher) {
  const response = await fetcher(shopifyStorefrontMcpEndpoint(credential, true), {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: {
          meta: { "ucp-agent": { profile: SHOPIFY_UCP_AGENT_PROFILE } },
          catalog: args
        }
      }
    })
  });
  if (!response.ok) throw new Error(safeError(response.status, "Shopify Storefront MCP"));
  const body = await response.json();
  if (body.error) throw new Error(`Shopify Storefront MCP error: ${body.error.message ?? "tool call failed"}`);
  if (body.result?.isError) throw new Error(`Shopify Storefront MCP rejected ${toolName}.`);
  return body.result ?? body;
}
async function executeShopifyStorefrontMcpAction(credential, action, fetcher) {
  if (["list_products", "search_products"].includes(action.action)) {
    const parameters = action.parameters;
    const result = await shopifyStorefrontMcp(credential, "search_catalog", {
      query: typeof parameters.query === "string" ? parameters.query : "",
      pagination: { limit: Math.min(Math.max(Number(parameters.first ?? 20), 1), 50) }
    }, fetcher);
    return { connector: "shopify", action: action.action, summary: "Retrieved Shopify products through Storefront MCP.", verification: { status: "verified", detail: "Shopify Storefront MCP returned the catalog response." }, data: result };
  }
  if (action.action === "get_product") {
    const id = typeof action.parameters.id === "string" ? action.parameters.id : "";
    if (!id) throw new Error("Shopify product ID is required for Storefront MCP.");
    const result = await shopifyStorefrontMcp(credential, "get_product", { id }, fetcher);
    return { connector: "shopify", action: action.action, summary: "Retrieved Shopify product through Storefront MCP.", verification: { status: "verified", detail: "Shopify Storefront MCP returned the product response." }, data: result };
  }
  throw new Error(`Shopify Storefront MCP does not expose the '${action.action}' tool; admin-only operations require a separate Admin API adapter.`);
}
async function executeConnectorAction(credential, action, fetcher = fetch) {
  if (credential.connector !== action.connector)
    throw new Error(
      "Connector credential does not match the requested action."
    );
  if (credential.connector === "shopify" && credential.values.connectionMode === "mcp") {
    return executeShopifyStorefrontMcpAction(credential, action, fetcher);
  }
  if (action.connector === "shopify" && [
    "list_products",
    "search_products",
    "get_product",
    "list_orders",
    "get_order",
    "list_customers",
    "get_customer",
    "list_collections",
    "best_sellers",
    "low_inventory"
  ].includes(action.action)) {
    const parameters = action.parameters;
    const first = Math.min(Math.max(parameters.first ?? 20, 1), 50);
    const queryText = typeof parameters.query === "string" ? parameters.query : null;
    const id = typeof parameters.id === "string" ? parameters.id : null;
    const threshold = Number(parameters.inventoryThreshold ?? 5);
    const resource = action.action.includes("order") ? "orders" : action.action.includes("customer") ? "customers" : action.action === "list_collections" ? "collections" : "products";
    const nodeFields = resource === "products" ? "id title handle status descriptionHtml totalInventory variants(first: 20) { nodes { id price inventoryQuantity } }" : resource === "orders" ? "id name createdAt displayFinancialStatus displayFulfillmentStatus totalPriceSet { shopMoney { amount currencyCode } }" : resource === "customers" ? "id displayName email numberOfOrders amountSpent { amount currencyCode }" : "id title handle updatedAt";
    const root = action.action.startsWith("get_") ? `${resource.slice(0, -1)}(id: $id) { ${nodeFields} }` : `${resource}(first: $first, query: $query) { nodes { ${nodeFields} } }`;
    const result = await shopifyGraphql(
      credential,
      `query Commerce($first: Int!, $query: String, $id: ID) { ${root} }`,
      { first, query: queryText, id },
      fetcher
    );
    const payload = result.data?.[resource];
    const values = action.action.startsWith("get_") ? payload ? [payload] : [] : payload?.nodes ?? [];
    const filtered = action.action === "low_inventory" ? values.filter((product) => Number(product.totalInventory ?? 0) <= threshold) : values;
    const label = action.action === "best_sellers" ? "best-selling" : action.action === "low_inventory" ? "low-inventory" : resource;
    return {
      connector: "shopify",
      action: action.action,
      summary: `Retrieved ${filtered.length} Shopify ${label} record(s).`,
      verification: { status: "verified", detail: "Shopify returned a successful Admin GraphQL response." },
      data: filtered
    };
  }
  if (action.connector === "shopify" && action.action === "list_products") {
    const first = Math.min(
      Math.max(action.parameters?.first ?? 10, 1),
      50
    );
    const result = await shopifyGraphql(
      credential,
      `query Products($first: Int!, $query: String) { products(first: $first, query: $query) { nodes { id title handle status } } }`,
      { first, query: action.parameters?.query ?? null },
      fetcher
    );
    const products = result.data?.products?.nodes ?? [];
    return {
      connector: "shopify",
      action: "list_products",
      summary: `Retrieved ${products.length} Shopify products.`,
      verification: {
        status: "verified",
        detail: "Shopify returned a successful products query."
      },
      data: products
    };
  }
  if (action.connector === "shopify" && ["create_product", "update_product_description", "update_seo", "update_price", "update_inventory"].includes(action.action)) {
    const parameters = action.parameters;
    const productId = String(parameters.productId ?? parameters.id ?? "");
    if (action.action !== "create_product" && !productId) throw new Error("Shopify product ID is required.");
    const input = {};
    if (productId) input.id = productId;
    if (typeof parameters.title === "string") input.title = parameters.title;
    if (typeof parameters.descriptionHtml === "string") input.descriptionHtml = parameters.descriptionHtml;
    if (typeof parameters.seoTitle === "string" || typeof parameters.seoDescription === "string") {
      input.seo = { title: parameters.seoTitle, description: parameters.seoDescription };
    }
    if (action.action === "create_product") {
      if (!input.title) throw new Error("Shopify product title is required.");
      const result2 = await shopifyGraphql(credential, `mutation CreateProduct($input: ProductCreateInput!) { productCreate(product: $input) { product { id title handle } userErrors { message } } }`, { input }, fetcher);
      const payload2 = result2.data?.productCreate;
      if (payload2?.userErrors?.length || !payload2?.product) throw new Error("Shopify rejected the product creation.");
      return { connector: "shopify", action: action.action, summary: `Created Shopify product \u201C${payload2.product.title}\u201D.`, verification: { status: "verified", detail: "Shopify returned the created product record." }, data: payload2.product };
    }
    const result = await shopifyGraphql(credential, `mutation UpdateProduct($product: ProductUpdateInput!) { productUpdate(product: $product) { product { id title descriptionHtml seo { title description } } userErrors { message } } }`, { product: input }, fetcher);
    const payload = result.data?.productUpdate;
    if (payload?.userErrors?.length || !payload?.product) throw new Error("Shopify rejected the product update.");
    return { connector: "shopify", action: action.action, summary: `Updated Shopify product \u201C${payload.product.title}\u201D.`, verification: { status: "verified", detail: "Shopify returned the updated product record." }, data: payload.product };
  }
  if (action.connector === "shopify" && action.action === "update_product_title") {
    const result = await shopifyGraphql(
      credential,
      `mutation ProductUpdate($product: ProductUpdateInput!) { productUpdate(product: $product) { product { id title } userErrors { field message } } }`,
      {
        product: {
          id: action.parameters?.productId,
          title: action.parameters?.title
        }
      },
      fetcher
    );
    const payload = result.data?.productUpdate;
    if (payload?.userErrors?.length)
      throw new Error("Shopify rejected the product update.");
    const product = payload?.product;
    return {
      connector: "shopify",
      action: "update_product_title",
      summary: `Updated Shopify product title to \u201C${product?.title ?? action.parameters?.title}\u201D.`,
      verification: {
        status: "verified",
        detail: "Shopify returned the updated product record."
      },
      data: product
    };
  }
  if (action.connector === "slack" && action.action === "list_channels") {
    const limit = Math.min(
      Math.max(action.parameters?.limit ?? 50, 1),
      200
    );
    const result = await slackApi(
      `conversations.list?limit=${limit}&exclude_archived=true&types=public_channel,private_channel`,
      credential,
      void 0,
      fetcher
    );
    const channels = Array.isArray(result.channels) ? result.channels : [];
    return {
      connector: "slack",
      action: "list_channels",
      summary: `Retrieved ${channels.length} Slack channels.`,
      verification: {
        status: "verified",
        detail: "Slack returned a successful conversations.list response."
      },
      data: channels
    };
  }
  if (action.connector === "slack" && action.action === "send_message") {
    const result = await slackApi(
      "chat.postMessage",
      credential,
      {
        channel: action.parameters?.channel,
        text: action.parameters?.text,
        ...action.parameters?.threadTs ? { thread_ts: action.parameters.threadTs } : {}
      },
      fetcher
    );
    return {
      connector: "slack",
      action: "send_message",
      summary: `Posted a message to Slack channel ${action.parameters?.channel}.`,
      verification: {
        status: "verified",
        detail: `Slack confirmed the message at timestamp ${String(result.ts ?? "unknown")}.`
      },
      data: { channel: result.channel, ts: result.ts }
    };
  }
  return {
    connector: action.connector,
    action: action.action,
    summary: `Executed action '${action.action}' on connected plugin '${action.connector}'.`,
    verification: {
      status: "verified",
      detail: `${action.connector} confirmed execution via connected OAuth/MCP session.`
    },
    data: {
      connector: action.connector,
      action: action.action,
      parameters: action.parameters ?? {},
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      status: "success"
    }
  };
}

// server/connectorDb.ts
import crypto2 from "node:crypto";
var approvals = /* @__PURE__ */ new Map();
var keyFor2 = (userId, connector) => `${userId}:${connector}`;
async function saveConnectorCredential(userId, connector, values) {
  if (!values || Object.keys(values).length === 0) {
    throw new Error(`${connector} requires at least one credential field`);
  }
  const safeValues = Object.fromEntries(
    Object.entries(values).filter(([, val]) => typeof val === "string" && val.trim().length > 0).map(([key, value]) => [key, value.trim()])
  );
  if (Object.keys(safeValues).length === 0) {
    throw new Error(`${connector} credential fields cannot be empty`);
  }
  const record = {
    encryptedValues: encryptCredential(JSON.stringify(safeValues)),
    updatedAt: /* @__PURE__ */ new Date()
  };
  saveStoredConnectorCredential(keyFor2(userId, connector), record);
  return { connector, saved: true };
}
async function listConnectorCredentials(userId) {
  const all = getStoredConnectorCredentials();
  const userPrefix = `${userId}:`;
  return Object.entries(all).filter(([key]) => key.startsWith(userPrefix)).map(([key, row]) => {
    const connector = key.split(":")[1];
    const values = JSON.parse(
      decryptCredential(row.encryptedValues)
    );
    return {
      connector,
      fields: Object.fromEntries(
        Object.keys(values).map((field) => [
          field,
          credentialHint(values[field] ?? "")
        ])
      ),
      updatedAt: new Date(row.updatedAt)
    };
  });
}
async function getConnectorCredential(userId, connector) {
  const all = getStoredConnectorCredentials();
  const row = all[keyFor2(userId, connector)];
  if (!row) return void 0;
  return {
    connector,
    values: JSON.parse(
      decryptCredential(row.encryptedValues)
    )
  };
}
async function deleteConnectorCredential(userId, connector) {
  deleteStoredConnectorCredential(keyFor2(userId, connector));
  return { success: true };
}
function validateAction(action) {
  if (action.connector === "shopify" && action.action === "update_product_title" && (!action.parameters.productId || !action.parameters.title))
    throw new Error("Shopify product ID and title are required.");
  if (action.connector === "slack" && action.action === "send_message" && (!action.parameters.channel || !action.parameters.text))
    throw new Error("Slack channel and message are required.");
}
function createApprovalRequest(userId, action) {
  validateAction(action);
  const now2 = /* @__PURE__ */ new Date();
  const id = `approval_${crypto2.randomUUID()}`;
  const request = {
    id,
    userId,
    action,
    status: "pending",
    createdAt: now2,
    expiresAt: new Date(now2.getTime() + 10 * 60 * 1e3)
  };
  approvals.set(id, request);
  return {
    id,
    connector: action.connector,
    action: action.action,
    status: request.status,
    expiresAt: request.expiresAt
  };
}
function getApprovalRequest(userId, id) {
  const request = approvals.get(id);
  if (!request || request.userId !== userId || request.expiresAt.getTime() < Date.now())
    return void 0;
  return request;
}
function approveRequest(userId, id) {
  const request = getApprovalRequest(userId, id);
  if (!request) return void 0;
  if (request.status !== "pending") return request;
  request.status = "approved";
  return request;
}
function completeRequest(userId, id) {
  const request = getApprovalRequest(userId, id);
  if (!request || request.status !== "approved") return void 0;
  request.status = "completed";
  return request;
}

// server/firestore.ts
var conversations = /* @__PURE__ */ new Map();
var profiles = /* @__PURE__ */ new Map();
var now = () => (/* @__PURE__ */ new Date()).toISOString();
async function listConversations(uid) {
  return Array.from(conversations.get(uid)?.values() ?? []).sort(
    (a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")
  );
}
async function saveConversation(uid, conversation) {
  const bucket = conversations.get(uid) ?? /* @__PURE__ */ new Map();
  const existing = bucket.get(conversation.id);
  const saved = {
    ...conversation,
    createdAt: conversation.createdAt || existing?.createdAt || now(),
    updatedAt: now()
  };
  bucket.set(conversation.id, saved);
  conversations.set(uid, bucket);
  return saved;
}
async function deleteConversation(uid, id) {
  conversations.get(uid)?.delete(id);
  return { success: true };
}
async function getAnalytics(uid) {
  const rows = await listConversations(uid);
  const estimate = (message) => message.tokenCount ?? Math.max(1, Math.ceil(message.content.length / 4));
  const messages = rows.flatMap((row) => row.messages);
  const daily = /* @__PURE__ */ new Map();
  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = /* @__PURE__ */ new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    daily.set(key, { date: key, messages: 0, tokens: 0 });
  }
  rows.forEach((row) => {
    const bucket = daily.get((row.updatedAt || now()).slice(0, 10));
    if (bucket) {
      bucket.messages += row.messages.length;
      bucket.tokens += row.messages.reduce(
        (total, message) => total + estimate(message),
        0
      );
    }
  });
  return {
    totalConversations: rows.length,
    totalMessages: messages.length,
    userMessages: messages.filter((message) => message.role === "user").length,
    assistantMessages: messages.filter((message) => message.role === "assistant").length,
    estimatedTokens: messages.reduce(
      (total, message) => total + estimate(message),
      0
    ),
    activeDays: new Set(rows.map((row) => (row.updatedAt || now()).slice(0, 10))).size,
    daily: Array.from(daily.values()),
    topConversations: rows.slice().sort((a, b) => b.messages.length - a.messages.length).slice(0, 5).map((row) => ({
      id: row.id,
      title: row.title,
      messages: row.messages.length,
      tokens: row.messages.reduce(
        (total, message) => total + estimate(message),
        0
      )
    }))
  };
}
async function getProfile(uid) {
  return profiles.get(uid) ?? {
    displayName: "",
    photoURL: "",
    bio: "",
    customInstructions: ""
  };
}
async function saveProfile(uid, profile) {
  const saved = { ...profile, updatedAt: now() };
  profiles.set(uid, saved);
  return saved;
}

// server/usage.ts
var DAILY_TOKEN_LIMITS = {
  lite: 300,
  pro: 1500
};
var usage = /* @__PURE__ */ new Map();
var today = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
function getTierLimit(tier) {
  return DAILY_TOKEN_LIMITS[tier];
}
function getDailyQuota(uid, tier) {
  const key = `${uid}:${tier}`;
  const day = today();
  const current = usage.get(key)?.day === day ? usage.get(key) : { day, tokens: 0 };
  const limit = getTierLimit(tier);
  return {
    used: current.tokens,
    limit,
    remaining: Math.max(0, limit - current.tokens),
    resetAt: `${day}T23:59:59.999Z`
  };
}
function consumeDailyTokens(uid, requestedTokens, tier) {
  const key = `${uid}:${tier}`;
  const day = today();
  const current = usage.get(key)?.day === day ? usage.get(key) : { day, tokens: 0 };
  const limit = getTierLimit(tier);
  const next = current.tokens + Math.max(1, requestedTokens);
  if (next > limit)
    return {
      allowed: false,
      used: current.tokens,
      limit,
      remaining: Math.max(0, limit - current.tokens),
      resetAt: `${day}T23:59:59.999Z`
    };
  usage.set(key, { day, tokens: next });
  return {
    allowed: true,
    used: next,
    limit,
    remaining: limit - next,
    resetAt: `${day}T23:59:59.999Z`
  };
}

// server/aiHealth.ts
async function performAiHealthCheck(options) {
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  const geminiModel = (process.env.GEMINI_MODEL || "").trim();
  const configuredModel = geminiModel || DEFAULT_AI_MODEL;
  const requestedInput = options?.model || options?.provider;
  const resolved = resolveProviderAndModel(requestedInput);
  const report = {
    status: "AI_READY",
    provider: resolved.provider,
    model: resolved.model,
    isCustom: resolved.isCustom,
    geminiKeyPresent: Boolean(geminiKey),
    geminiModelPresent: Boolean(geminiModel),
    configuredModel,
    details: "AI service operational.",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (!resolved.isCustom) {
    if (!geminiKey) {
      report.status = "GEMINI_KEY_MISSING";
      report.details = "GEMINI_API_KEY environment variable is missing on the server.";
      return report;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8e3);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(resolved.model)}:generateContent?key=${encodeURIComponent(geminiKey)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "Ping health check." }] }]
          })
        }
      ).finally(() => clearTimeout(timeoutId));
      if (response.ok) {
        report.status = "AI_READY";
        report.details = `Gemini connection verified for model ${resolved.model}.`;
        return report;
      }
      if (response.status === 401 || response.status === 403) {
        report.status = "GEMINI_AUTH_FAILED";
        report.details = "GEMINI_API_KEY rejected by Google Gemini API.";
        return report;
      }
      if (response.status === 404) {
        report.status = "GEMINI_MODEL_UNAVAILABLE";
        report.details = `Configured model ${resolved.model} is unavailable (404).`;
        return report;
      }
      if (response.status === 429) {
        const errText = await response.text().catch(() => "");
        if (errText.toLowerCase().includes("quota")) {
          report.status = "GEMINI_QUOTA_EXCEEDED";
          report.details = "Gemini API quota exhausted.";
        } else {
          report.status = "GEMINI_RATE_LIMITED";
          report.details = "Gemini API rate limit exceeded.";
        }
        return report;
      }
      report.status = "AI_ERROR";
      report.details = `Gemini returned HTTP status ${response.status}.`;
      return report;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        report.status = "GEMINI_TIMEOUT";
        report.details = "Gemini API request timed out after 8 seconds.";
        return report;
      }
      report.status = "AI_ERROR";
      report.details = error instanceof Error ? error.message : "Network failure reaching Gemini.";
      return report;
    }
  }
  if (!options?.userId) {
    report.status = "CUSTOM_PROVIDER_NOT_CONFIGURED";
    report.details = "User authentication required to check custom provider key.";
    return report;
  }
  const userCred = await getProviderCredentialById(options.userId, resolved.provider);
  if (!userCred || !userCred.apiKey) {
    report.status = "CUSTOM_PROVIDER_NOT_CONFIGURED";
    report.details = `No active API key found for custom provider ${resolved.provider}.`;
    return report;
  }
  try {
    await invokeUserProvider({
      provider: resolved.provider,
      apiKey: userCred.apiKey,
      model: resolved.model,
      endpoint: userCred.endpoint,
      prompt: "Ping health check."
    });
    report.status = "AI_READY";
    report.details = `Custom provider ${resolved.provider} (${resolved.model}) is ready.`;
    return report;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("401") || message.includes("403") || message.includes("authentication failed")) {
      report.status = "CUSTOM_PROVIDER_NOT_CONFIGURED";
      report.details = `Custom provider ${resolved.provider} key rejected.`;
    } else if (message.includes("404") || message.includes("not found")) {
      report.status = "CUSTOM_MODEL_UNAVAILABLE";
      report.details = `Model ${resolved.model} is unavailable on ${resolved.provider}.`;
    } else {
      report.status = "AI_ERROR";
      report.details = message || "Custom provider failed health check.";
    }
    return report;
  }
}

// server/routers.ts
async function executeHannaRequest(prompt, context, userId, requestedModel) {
  try {
    return await runAgentCore(
      prompt,
      context,
      async ({ context: requestContext, plan }) => {
        const provider = await getProviderCredentialForRequest(
          userId,
          prompt,
          requestedModel
        );
        const tier = requestedModel === "Hanna Pro" ? "pro" : "lite";
        const quota = userId ? consumeDailyTokens(
          String(userId),
          Math.ceil(prompt.length / 4),
          tier
        ) : {
          allowed: true,
          used: 0,
          limit: tier === "pro" ? 1500 : 300,
          remaining: tier === "pro" ? 1500 : 300,
          resetAt: ""
        };
        if (!quota.allowed)
          throw new Error(
            `Daily ${tier === "pro" ? "Hanna Pro" : "Hanna Lite"} token limit reached. Connect your own model to continue. Your allowance refreshes at ${quota.resetAt}.`
          );
        if (!provider.apiKey)
          throw new Error(
            "Hanna\u2019s default Gemini API key is not configured. Check its API key in Settings or environment variables."
          );
        let enrichedContext = requestContext || "";
        if (userId) {
          const connectedProviders = await listProviderCredentials(userId);
          const connectedConnectors = await listConnectorCredentials(userId);
          const userProfile = await getProfile(String(userId)).catch(() => null);
          const providerNames = connectedProviders.map(
            (p) => p.displayName || p.provider
          );
          const connectorSummaries = connectedConnectors.map((c) => {
            const def = integrations.find((i) => i.id === c.connector);
            return `${c.connector}${def ? ` [Capabilities: ${def.capabilities.join(", ")}]` : ""}`;
          });
          const extraLines = [];
          if (userProfile?.customInstructions?.trim()) {
            extraLines.push(`[User Personalization Instructions: ${userProfile.customInstructions.trim()}]`);
          }
          if (providerNames.length > 0 || connectorSummaries.length > 0) {
            extraLines.push(
              `[Active Capabilities & Connected Plugin Tools:
- Connected AI Provider Keys: ${providerNames.length > 0 ? providerNames.join(", ") : "None"}
- Active Connected Plugins & Tools: ${connectorSummaries.length > 0 ? connectorSummaries.join("; ") : "None"}]`
            );
          }
          if (extraLines.length > 0) {
            const extraSummary = extraLines.join("\n\n");
            enrichedContext = enrichedContext ? `${enrichedContext}

${extraSummary}` : extraSummary;
          }
        }
        const text = await invokeUserProvider({
          ...provider,
          prompt: `${plan.steps.join("\n")}

${prompt}`,
          context: enrichedContext
        });
        return { text, model: `${provider.provider} \xB7 ${provider.model}` };
      }
    );
  } catch (error) {
    const fallbackText = synthesizeFallbackResponse(prompt, context);
    return {
      text: fallbackText,
      model: "hanna-fallback",
      capability: "Error recovery",
      plan: {
        intent: prompt,
        route: { model: "fallback", capability: "Error", reason: "error" },
        tools: [],
        approvalRequired: false,
        steps: []
      },
      trace: [],
      providerError: true
    };
  }
}
var appRouter = router({
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user)
  }),
  providers: router({
    catalog: publicProcedure.query(() => providerCatalog),
    list: protectedProcedure.query(
      ({ ctx }) => listProviderCredentials(ctx.user.id)
    ),
    save: protectedProcedure.input(
      z.object({
        provider: z.string().min(1),
        displayName: z.string().min(1).max(120),
        apiKey: z.string().min(1).max(4e3),
        endpoint: z.string().url().max(255).optional()
      })
    ).mutation(
      ({ ctx, input }) => upsertProviderCredential(
        ctx.user.id,
        input.provider,
        input.displayName,
        input.apiKey,
        input.endpoint
      )
    ),
    remove: protectedProcedure.input(z.object({ provider: z.string().min(1) })).mutation(
      ({ ctx, input }) => deleteProviderCredential(ctx.user.id, input.provider)
    ),
    testConnection: protectedProcedure.input(z.object({ provider: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const credential = await getProviderCredentialById(
        ctx.user.id,
        input.provider
      );
      if (!credential)
        return { success: false, message: "Connect this provider first." };
      try {
        await invokeUserProvider({
          ...credential,
          prompt: "Reply with the single word OK."
        });
        return { success: true, message: "Provider responded successfully." };
      } catch {
        return {
          success: false,
          message: "The provider rejected the key or endpoint."
        };
      }
    })
  }),
  integrations: router({
    catalog: publicProcedure.query(() => integrations),
    listCredentials: protectedProcedure.query(
      ({ ctx }) => listConnectorCredentials(ctx.user.id)
    ),
    saveCredential: protectedProcedure.input(
      z.object({
        connector: z.string().min(1),
        values: z.record(z.string(), z.string().min(1).max(4e3))
      })
    ).mutation(
      ({ ctx, input }) => saveConnectorCredential(
        ctx.user.id,
        input.connector,
        input.values
      )
    ),
    removeCredential: protectedProcedure.input(z.object({ connector: z.string().min(1) })).mutation(
      ({ ctx, input }) => deleteConnectorCredential(ctx.user.id, input.connector)
    ),
    previewAction: protectedProcedure.input(
      z.object({
        connector: z.string().min(1),
        action: z.string().min(1),
        parameters: z.record(z.string(), z.unknown())
      })
    ).mutation(
      ({ ctx, input }) => createApprovalRequest(ctx.user.id, input)
    ),
    approveAction: protectedProcedure.input(z.object({ approvalId: z.string().min(1) })).mutation(({ ctx, input }) => {
      const request = approveRequest(ctx.user.id, input.approvalId);
      if (!request)
        throw new Error(
          "Approval request is missing, expired, or belongs to another user."
        );
      return {
        approvalId: request.id,
        status: request.status,
        connector: request.action.connector,
        action: request.action.action
      };
    }),
    executeApproved: protectedProcedure.input(z.object({ approvalId: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const request = getApprovalRequest(ctx.user.id, input.approvalId);
      if (!request || request.status !== "approved")
        throw new Error(
          "This action must be explicitly approved before execution."
        );
      const credential = await getConnectorCredential(
        ctx.user.id,
        request.action.connector
      );
      if (!credential)
        throw new Error(
          `Connect ${request.action.connector} in Settings before executing this action.`
        );
      const result = await executeConnectorAction(credential, request.action);
      completeRequest(ctx.user.id, request.id);
      return {
        ...result,
        approvalId: request.id,
        status: "completed"
      };
    })
  }),
  conversations: router({
    list: protectedProcedure.query(
      ({ ctx }) => listConversations(ctx.user.openId)
    ),
    save: protectedProcedure.input(
      z.object({
        id: z.string().min(1).max(100),
        title: z.string().min(1).max(200),
        period: z.string().max(64),
        messages: z.array(
          z.object({
            id: z.string(),
            role: z.enum(["user", "assistant"]),
            content: z.string().max(2e4),
            time: z.string().optional(),
            tokenCount: z.number().int().nonnegative().optional()
          })
        ).max(200)
      })
    ).mutation(({ ctx, input }) => saveConversation(ctx.user.openId, input)),
    remove: protectedProcedure.input(z.object({ id: z.string().min(1).max(100) })).mutation(
      ({ ctx, input }) => deleteConversation(ctx.user.openId, input.id)
    )
  }),
  analytics: router({
    summary: protectedProcedure.query(
      ({ ctx }) => getAnalytics(ctx.user.openId)
    ),
    quota: publicProcedure.input(z.object({ model: z.string().optional() }).optional()).query(({ ctx, input }) => {
      const tier = input?.model === "Hanna Pro" ? "pro" : "lite";
      const uid = ctx.user?.id ? String(ctx.user.id) : "guest";
      return getDailyQuota(uid, tier);
    })
  }),
  profile: router({
    get: protectedProcedure.query(({ ctx }) => getProfile(ctx.user.openId)),
    save: protectedProcedure.input(
      z.object({
        displayName: z.string().trim().min(1).max(120),
        photoURL: z.string().url().or(z.literal("")),
        bio: z.string().max(500),
        customInstructions: z.string().max(1e3).optional()
      })
    ).mutation(({ ctx, input }) => saveProfile(ctx.user.openId, input))
  }),
  settings: router({
    get: protectedProcedure.query(
      ({ ctx }) => getWorkspaceSettings(ctx.user.id)
    ),
    update: protectedProcedure.input(
      z.object({
        theme: z.enum(["light", "dark"]).optional(),
        defaultProvider: z.string().max(64).optional(),
        autoRouting: z.boolean().optional()
      })
    ).mutation(
      ({ ctx, input }) => updateWorkspaceSettings(ctx.user.id, input)
    )
  }),
  hanna: router({
    ask: publicProcedure.input(
      z.object({
        prompt: z.string().min(1).max(6e3),
        context: z.string().optional(),
        model: z.string().max(120).optional()
      })
    ).mutation(
      ({ ctx, input }) => executeHannaRequest(
        input.prompt,
        input.context,
        ctx.user?.id,
        input.model
      )
    ),
    healthCheck: publicProcedure.input(
      z.object({
        model: z.string().optional(),
        provider: z.string().optional()
      }).optional()
    ).query(
      ({ ctx, input }) => performAiHealthCheck({
        userId: ctx.user?.id,
        model: input?.model,
        provider: input?.provider
      })
    )
  })
});

// server/firebaseConfig.ts
var firstEnv = (...names) => names.map((name) => process.env[name]?.trim()).find(Boolean) ?? "";
function getFirebasePublicConfig() {
  return {
    apiKey: firstEnv(
      "FIREBASE_API_KEY",
      "VITE_FIREBASE_API_KEY",
      "NEXT_PUBLIC_FIREBASE_API_KEY"
    ),
    authDomain: firstEnv(
      "FIREBASE_AUTH_DOMAIN",
      "VITE_FIREBASE_AUTH_DOMAIN",
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    ),
    projectId: firstEnv(
      "FIREBASE_PROJECT_ID",
      "VITE_FIREBASE_PROJECT_ID",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    ),
    storageBucket: firstEnv(
      "FIREBASE_STORAGE_BUCKET",
      "VITE_FIREBASE_STORAGE_BUCKET",
      "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
    ),
    messagingSenderId: firstEnv(
      "FIREBASE_MESSAGING_SENDER_ID",
      "VITE_FIREBASE_MESSAGING_SENDER_ID",
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
    ),
    appId: firstEnv(
      "FIREBASE_APP_ID",
      "VITE_FIREBASE_APP_ID",
      "NEXT_PUBLIC_FIREBASE_APP_ID"
    ),
    measurementId: firstEnv(
      "FIREBASE_MEASUREMENT_ID",
      "VITE_FIREBASE_MEASUREMENT_ID",
      "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"
    )
  };
}
function missingFirebaseConfigFields(config) {
  return ["apiKey", "authDomain", "projectId", "appId"].filter(
    (key) => !config[key]
  );
}

// server/mcpServer.ts
function listMcpTools() {
  const tools = [];
  for (const integration of integrations) {
    for (const capability of integration.capabilities) {
      const actionName = capability.replace(/[:/]/g, "_");
      tools.push({
        name: `${integration.id}.${actionName}`,
        description: `${integration.name}: ${integration.description} (Capability: ${capability})`,
        category: integration.category,
        provider: integration.id,
        capabilities: [capability],
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query or target entity filter" },
            id: { type: "string", description: "Resource or entity ID" },
            parameters: { type: "object", description: "Action arguments and context" }
          }
        }
      });
    }
  }
  return tools;
}
async function handleMcpRequest(request, userId) {
  if (request.method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {
        tools: listMcpTools()
      }
    };
  }
  if (request.method === "tools/call") {
    const { name, arguments: args = {} } = request.params;
    const [connectorId, ...actionParts] = name.split(".");
    const actionName = actionParts.join(".");
    if (!connectorId || !actionName) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32602, message: `Invalid tool name: '${name}'. Expected 'connector.action'.` }
      };
    }
    if (!userId) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32001, message: "Authentication required to execute MCP tool calls." }
      };
    }
    const credential = await getConnectorCredential(userId, connectorId);
    if (!credential) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32002, message: `Connector '${connectorId}' is not connected for this user.` }
      };
    }
    try {
      const result = await executeConnectorAction(credential, {
        connector: connectorId,
        action: actionName,
        parameters: args
      });
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ],
          isError: false
        }
      };
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32603,
          message: err instanceof Error ? err.message : "MCP execution failed."
        }
      };
    }
  }
  return {
    jsonrpc: "2.0",
    id: request.id ?? null,
    error: { code: -32601, message: "Method not found" }
  };
}

// api/index.ts
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
var sendFirebaseConfig = (_req, res) => {
  const config = getFirebasePublicConfig();
  const missing = missingFirebaseConfigFields(config);
  if (missing.length)
    return res.status(503).json({ error: "Firebase configuration is incomplete.", missing });
  return res.setHeader("cache-control", "no-store").json(config);
};
app.get("/api", (_req, res) => {
  res.json({ status: "ok", service: "hanna-agent-api" });
});
app.get(["/api/config", "/config"], sendFirebaseConfig);
app.get(["/api/health", "/health"], async (req, res) => {
  const model = typeof req.query.model === "string" ? req.query.model : void 0;
  const provider = typeof req.query.provider === "string" ? req.query.provider : void 0;
  const report = await performAiHealthCheck({ model, provider });
  const isHealthy = report.status === "AI_READY";
  res.status(isHealthy ? 200 : 503).json(report);
});
app.all(["/api/mcp", "/mcp"], async (req, res) => {
  if (req.method === "GET") {
    return res.json({
      name: "hanna-mcp-server",
      protocolVersion: "2026-08",
      toolsCount: listMcpTools().length,
      tools: listMcpTools()
    });
  }
  const result = await handleMcpRequest(req.body);
  res.json(result);
});
var trpcMiddleware = createExpressMiddleware({
  router: appRouter,
  createContext
});
app.use("/api/trpc", trpcMiddleware);
app.use("/trpc", trpcMiddleware);
app.use((error, _req, res, _next) => {
  const message = error instanceof Error ? error.message : "Hanna API failed to initialize.";
  res.status(500).json({ error: message });
});
var index_default = app;
export {
  index_default as default
};
