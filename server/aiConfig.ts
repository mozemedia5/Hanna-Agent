export const DEFAULT_AI_PROVIDER = "gemini";
export const DEFAULT_AI_MODEL = "gemini-2.5-flash";

export const HANNA_LITE_MODEL = "gemini-2.5-flash";
export const HANNA_PRO_MODEL = "gemini-2.5-flash";
export const HANNA_DEFAULT_MODEL = HANNA_LITE_MODEL;

export const GEMINI_FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
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
  const defaultModel = (
    process.env.GEMINI_MODEL || DEFAULT_AI_MODEL
  ).trim();

  if (
    !requestedModelOrProvider ||
    !requestedModelOrProvider.trim() ||
    requestedModelOrProvider === "Hanna Default" ||
    requestedModelOrProvider === "Hanna Lite" ||
    requestedModelOrProvider === "Hanna Pro" ||
    requestedModelOrProvider === "automatic" ||
    requestedModelOrProvider === "default" ||
    requestedModelOrProvider.toLowerCase().startsWith("hanna")
  ) {
    const isPro = requestedModelOrProvider?.toLowerCase().includes("pro");
    const targetModel = isPro ? HANNA_PRO_MODEL : HANNA_LITE_MODEL;
    return {
      provider: DEFAULT_AI_PROVIDER,
      model: targetModel,
      isCustom: false,
    };
  }

  const input = requestedModelOrProvider.trim();
  const lower = input.toLowerCase();

  // Gemini models
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

  // Groq / Llama / Mixtral models
  if (lower.includes("llama") || lower.includes("groq") || lower.includes("mixtral")) {
    let modelName = "llama-3.3-70b-versatile";
    if (lower.includes("8b")) modelName = "llama-3.1-8b-instant";
    else if (lower.includes("mixtral")) modelName = "mixtral-8x7b-32768";
    else if (input.startsWith("llama-")) modelName = input;

    return {
      provider: "llama",
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
