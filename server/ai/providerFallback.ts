import { GeminiProviderError } from "../geminiService";

export type ProviderErrorClass =
  | "quota"
  | "rate_limit"
  | "timeout"
  | "upstream_unavailable"
  | "authentication"
  | "invalid_request"
  | "unsupported_model"
  | "safety"
  | "unknown";

export type ClassifiedError = {
  errorClass: ProviderErrorClass;
  message: string;
  statusCode?: number;
  rawError?: unknown;
};

// In-memory provider cooldown tracker across requests
const providerCooldowns = new Map<string, number>();

export function markProviderCooldown(provider: string, durationMs = 60_000): void {
  providerCooldowns.set(provider, Date.now() + durationMs);
}

export function isProviderHealthy(provider: string): boolean {
  const cooldownUntil = providerCooldowns.get(provider);
  if (!cooldownUntil) return true;
  if (Date.now() > cooldownUntil) {
    providerCooldowns.delete(provider);
    return true;
  }
  return false;
}

export function clearProviderCooldown(provider: string): void {
  providerCooldowns.delete(provider);
}

/**
 * Classifies an arbitrary error into a structured ProviderErrorClass.
 */
export function classifyProviderError(err: unknown): ClassifiedError {
  if (err instanceof GeminiProviderError) {
    const code = err.errorCode;
    const msg = err.message || "";
    const status = err.status;

    if (code === "GEMINI_QUOTA_EXCEEDED" || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      return { errorClass: "quota", message: msg, statusCode: status || 429, rawError: err };
    }
    if (code === "GEMINI_RATE_LIMITED" || status === 429) {
      return { errorClass: "rate_limit", message: msg, statusCode: 429, rawError: err };
    }
    if (code === "GEMINI_TIMEOUT" || status === 408 || msg.includes("timeout")) {
      return { errorClass: "timeout", message: msg, statusCode: status || 408, rawError: err };
    }
    if (code === "GEMINI_MODEL_UNAVAILABLE" || status === 503 || status === 502 || status === 504) {
      return { errorClass: "upstream_unavailable", message: msg, statusCode: status || 503, rawError: err };
    }
    if (code === "GEMINI_AUTH_FAILED" || status === 401 || status === 403) {
      return { errorClass: "authentication", message: msg, statusCode: status || 401, rawError: err };
    }
    return { errorClass: "unknown", message: msg, statusCode: status, rawError: err };
  }

  const msg = err instanceof Error ? err.message : String(err || "");
  const lower = msg.toLowerCase();

  if (lower.includes("quota") || lower.includes("resource_exhausted") || lower.includes("credit limit")) {
    return { errorClass: "quota", message: msg, statusCode: 429, rawError: err };
  }
  if (lower.includes("429") || lower.includes("rate limit") || lower.includes("too many requests")) {
    return { errorClass: "rate_limit", message: msg, statusCode: 429, rawError: err };
  }
  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("408")) {
    return { errorClass: "timeout", message: msg, statusCode: 408, rawError: err };
  }
  if (lower.includes("503") || lower.includes("502") || lower.includes("504") || lower.includes("unavailable") || lower.includes("overloaded")) {
    return { errorClass: "upstream_unavailable", message: msg, statusCode: 503, rawError: err };
  }
  if (lower.includes("401") || lower.includes("403") || lower.includes("unauthorized") || lower.includes("authentication") || lower.includes("api key")) {
    return { errorClass: "authentication", message: msg, statusCode: 401, rawError: err };
  }
  if (lower.includes("safety") || lower.includes("content policy") || lower.includes("harm")) {
    return { errorClass: "safety", message: msg, statusCode: 400, rawError: err };
  }
  if (lower.includes("invalid") || lower.includes("malformed") || lower.includes("400")) {
    return { errorClass: "invalid_request", message: msg, statusCode: 400, rawError: err };
  }

  return { errorClass: "unknown", message: msg, rawError: err };
}

/**
 * Returns whether an error class is eligible for provider fallback.
 */
export function isFallbackEligible(errorClass: ProviderErrorClass): boolean {
  switch (errorClass) {
    case "quota":
    case "rate_limit":
    case "timeout":
    case "upstream_unavailable":
    case "authentication":
    case "unknown":
      return true;
    case "invalid_request":
    case "unsupported_model":
    case "safety":
      return false;
  }
}
