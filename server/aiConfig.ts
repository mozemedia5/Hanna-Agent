export const DEFAULT_AI_PROVIDER = "gemini";
export const DEFAULT_AI_MODEL = "gemini-3.5-flash";

export const HANNA_LITE_MODEL = "gemini-3.5-flash";
export const HANNA_PRO_MODEL = "gemini-3.5-flash";
export const HANNA_DEFAULT_MODEL = HANNA_LITE_MODEL;

export const GEMINI_FALLBACK_MODELS = [
  "gemini-3.5-flash",
] as const;

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

/**
 * Normalizes and resolves a user or system requested provider/model input into a valid (provider, model) pair.
 */
export function resolveProviderAndModel(
  requestedModelOrProvider?: string
): ResolvedAiPair {
  const envModel = (process.env.GEMINI_MODEL || "").trim();
  const effectiveDefaultModel = envModel || DEFAULT_AI_MODEL;

  if (!requestedModelOrProvider || !requestedModelOrProvider.trim()) {
    return {
      provider: DEFAULT_AI_PROVIDER,
      model: effectiveDefaultModel,
      isCustom: false,
    };
  }

  const input = requestedModelOrProvider.trim();
  const lower = input.toLowerCase();

  // Groq models specifically requested under Hanna branding or Groq names
  if (
    lower.includes("groq") ||
    lower.includes("llama") ||
    lower.includes("qwen") ||
    lower.includes("deepseek") ||
    lower.includes("gpt-oss")
  ) {
    let modelName = "openai/gpt-oss-120b";
    if (lower.includes("gpt-oss") || lower.includes("120b")) {
      modelName = "openai/gpt-oss-120b";
    } else if (lower.includes("qwen") || lower.includes("27b")) {
      modelName = "qwen/qwen3.8-27b";
    } else if (lower.includes("deepseek") || lower.includes("v3.1")) {
      modelName = "deepseek-v3.1";
    } else if (lower.includes("8b") || lower.includes("instant") || lower.includes("speed")) {
      modelName = "llama-3.1-8b-instant";
    } else if (lower.includes("70b") || lower.includes("versatile") || lower.includes("llama 3.3")) {
      modelName = "llama-3.3-70b-versatile";
    } else if (
      input.startsWith("llama-") ||
      input.startsWith("qwen/") ||
      input.startsWith("openai/") ||
      input.startsWith("deepseek-")
    ) {
      modelName = input;
    }

    return {
      provider: "llama",
      model: modelName,
      isCustom: true,
    };
  }

  // General Hanna default aliases
  if (
    requestedModelOrProvider === "Hanna Default" ||
    requestedModelOrProvider === "Hanna Lite" ||
    requestedModelOrProvider === "Hanna Pro" ||
    requestedModelOrProvider === "automatic" ||
    requestedModelOrProvider === "default" ||
    (lower.startsWith("hanna") && !lower.includes("groq"))
  ) {
    return {
      provider: DEFAULT_AI_PROVIDER,
      model: effectiveDefaultModel,
      isCustom: false,
    };
  }

  // Gemini models
  if (lower.includes("gemini")) {
    let modelName = effectiveDefaultModel;
    if (input.startsWith("gemini-")) {
      modelName = input;
    } else {
      modelName = DEFAULT_AI_MODEL;
    }

    return {
      provider: "gemini",
      model: modelName,
      isCustom: false,
    };
  }

  // Anthropic / Claude models
  if (lower.includes("anthropic") || lower.includes("claude")) {
    let modelName = "claude-3-5-sonnet-20241022";
    if (lower.includes("opus")) modelName = "claude-3-opus-20240229";
    else if (lower.includes("haiku")) modelName = "claude-3-5-haiku-20241022";
    else if (input.startsWith("claude-")) modelName = input;

    return {
      provider: "anthropic",
      model: modelName,
      isCustom: true,
    };
  }

  // OpenAI / GPT / o-series models
  if (
    lower.includes("openai") ||
    lower.includes("gpt") ||
    lower.startsWith("o1") ||
    lower.startsWith("o3")
  ) {
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
      isCustom: true,
    };
  }

  // Mistral models
  if (lower.includes("mistral")) {
    return {
      provider: "mistral",
      model: input.startsWith("mistral-") ? input : "mistral-large-latest",
      isCustom: true,
    };
  }

  // OpenRouter
  if (lower.includes("openrouter")) {
    return {
      provider: "openrouter",
      model: input.includes("/") ? input : "openrouter/auto",
      isCustom: true,
    };
  }

  // Custom Provider
  return {
    provider: "custom",
    model: input,
    isCustom: true,
  };
}
