export const DEFAULT_AI_PROVIDER = "gemini";
export const DEFAULT_AI_MODEL = "gemini-3.5-flash";

export const HANNA_LITE_MODEL = "gemini-3.5-flash";
export const HANNA_PRO_MODEL = "gemini-3.5-flash";
export const HANNA_DEFAULT_MODEL = HANNA_LITE_MODEL;

export const GEMINI_FALLBACK_MODELS = [
  "gemini-3.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
] as const;

/** Groq-backed models branded as Hanna in the UI (never show "Groq" to users) */
export const HANNA_GROQ_MODELS = {
  "Hanna Fast": "llama-3.3-70b-versatile",
  "Hanna Instant": "llama-3.1-8b-instant",
  "Hanna Advanced": "llama-3.3-70b-versatile",
  "Hanna Presentation": "llama-3.3-70b-versatile",
  "Hanna Image": "llama-3.3-70b-versatile",
  "Hanna Video": "llama-3.3-70b-versatile",
} as const;

export type HannaUiModelId =
  | "Hanna Lite"
  | "Hanna Pro"
  | "Hanna Fast"
  | "Hanna Instant"
  | "Hanna Advanced"
  | "Hanna Presentation"
  | "Hanna Image"
  | "Hanna Video";

export const HANNA_UI_MODELS: Array<{
  id: HannaUiModelId;
  label: string;
  description: string;
  capability: "chat" | "presentation" | "image" | "video" | "advanced";
  backend: "gemini" | "groq";
}> = [
  {
    id: "Hanna Lite",
    label: "Hanna Lite",
    description: "Fast everyday chat (Gemini)",
    capability: "chat",
    backend: "gemini",
  },
  {
    id: "Hanna Pro",
    label: "Hanna Pro",
    description: "Deeper reasoning (Gemini)",
    capability: "chat",
    backend: "gemini",
  },
  {
    id: "Hanna Fast",
    label: "Hanna Fast",
    description: "Ultra-low latency responses",
    capability: "chat",
    backend: "groq",
  },
  {
    id: "Hanna Instant",
    label: "Hanna Instant",
    description: "Snappy short answers",
    capability: "chat",
    backend: "groq",
  },
  {
    id: "Hanna Advanced",
    label: "Hanna Advanced",
    description: "Complex multi-step tasks",
    capability: "advanced",
    backend: "groq",
  },
  {
    id: "Hanna Presentation",
    label: "Hanna Presentation",
    description: "Slide decks & structured outlines",
    capability: "presentation",
    backend: "groq",
  },
  {
    id: "Hanna Image",
    label: "Hanna Image",
    description: "Image prompts & visual briefs",
    capability: "image",
    backend: "groq",
  },
  {
    id: "Hanna Video",
    label: "Hanna Video",
    description: "Video scripts & storyboards",
    capability: "video",
    backend: "groq",
  },
];

export type AiHealthStatus =
  | "AI_READY"
  | "GEMINI_KEY_MISSING"
  | "GEMINI_AUTH_FAILED"
  | "GEMINI_MODEL_UNAVAILABLE"
  | "GEMINI_QUOTA_EXCEEDED"
  | "GEMINI_RATE_LIMITED"
  | "GEMINI_TIMEOUT"
  | "CUSTOM_PROVIDER_NOT_CONFIGURED"
  | "CUSTOM_MODEL_UNAVAILABLE"
  | "AI_ERROR";

export type ResolvedAiPair = {
  provider: string;
  model: string;
  isCustom: boolean;
};

export function resolveProviderAndModel(
  requestedModelOrProvider?: string
): ResolvedAiPair {
  const envModel = (process.env.GEMINI_MODEL || "").trim();
  const effectiveDefaultModel = envModel || DEFAULT_AI_MODEL;

  if (
    !requestedModelOrProvider ||
    !requestedModelOrProvider.trim() ||
    requestedModelOrProvider === "Hanna Default" ||
    requestedModelOrProvider === "Hanna Lite" ||
    requestedModelOrProvider === "automatic" ||
    requestedModelOrProvider === "default"
  ) {
    return {
      provider: DEFAULT_AI_PROVIDER,
      model: effectiveDefaultModel,
      isCustom: false,
    };
  }

  const input = requestedModelOrProvider.trim();
  const lower = input.toLowerCase();

  // Hanna Pro stays on Gemini
  if (input === "Hanna Pro" || lower === "hanna pro") {
    return {
      provider: "gemini",
      model: process.env.GEMINI_PRO_MODEL || "gemini-3.5-flash",
      isCustom: false,
    };
  }

  // Hanna-branded Groq models (UI never shows "Groq")
  const groqMap = HANNA_GROQ_MODELS as Record<string, string>;
  if (groqMap[input]) {
    return {
      provider: "llama",
      model: groqMap[input],
      isCustom: true,
    };
  }
  if (
    lower.includes("hanna fast") ||
    lower.includes("hanna instant") ||
    lower.includes("hanna advanced") ||
    lower.includes("hanna presentation") ||
    lower.includes("hanna image") ||
    lower.includes("hanna video")
  ) {
    let modelName = "llama-3.3-70b-versatile";
    if (lower.includes("instant")) modelName = "llama-3.1-8b-instant";
    return { provider: "llama", model: modelName, isCustom: true };
  }

  if (lower.startsWith("hanna")) {
    return {
      provider: DEFAULT_AI_PROVIDER,
      model: effectiveDefaultModel,
      isCustom: false,
    };
  }

  if (lower.includes("gemini")) {
    let modelName = effectiveDefaultModel;
    if (lower.includes("3.5")) modelName = "gemini-3.5-flash";
    else if (lower.includes("2.0")) modelName = "gemini-2.0-flash";
    else if (lower.includes("1.5-pro")) modelName = "gemini-1.5-pro";
    else if (lower.includes("1.5")) modelName = "gemini-1.5-flash";
    else if (input.startsWith("gemini-")) modelName = input;
    return { provider: "gemini", model: modelName, isCustom: false };
  }

  if (lower.includes("anthropic") || lower.includes("claude")) {
    let modelName = "claude-3-5-sonnet-20241022";
    if (lower.includes("opus")) modelName = "claude-3-opus-20240229";
    else if (lower.includes("haiku")) modelName = "claude-3-5-haiku-20241022";
    else if (input.startsWith("claude-")) modelName = input;
    return { provider: "anthropic", model: modelName, isCustom: true };
  }

  if (
    lower.includes("openai") ||
    lower.includes("gpt") ||
    lower.startsWith("o1") ||
    lower.startsWith("o3")
  ) {
    let modelName = "gpt-4o-mini";
    if (lower.includes("gpt-4o-mini")) modelName = "gpt-4o-mini";
    else if (lower.includes("gpt-4o")) modelName = "gpt-4o";
    else if (input.startsWith("gpt-") || input.startsWith("o1") || input.startsWith("o3"))
      modelName = input;
    return { provider: "openai", model: modelName, isCustom: true };
  }

  if (lower.includes("llama") || lower.includes("groq") || lower.includes("mixtral")) {
    let modelName = "llama-3.3-70b-versatile";
    if (lower.includes("8b")) modelName = "llama-3.1-8b-instant";
    else if (lower.includes("mixtral")) modelName = "mixtral-8x7b-32768";
    else if (input.startsWith("llama-")) modelName = input;
    return { provider: "llama", model: modelName, isCustom: true };
  }

  if (lower.includes("mistral")) {
    return {
      provider: "mistral",
      model: input.startsWith("mistral-") ? input : "mistral-large-latest",
      isCustom: true,
    };
  }

  if (lower.includes("openrouter")) {
    return {
      provider: "openrouter",
      model: input.includes("/") ? input : "openrouter/auto",
      isCustom: true,
    };
  }

  return { provider: "custom", model: input, isCustom: true };
}
