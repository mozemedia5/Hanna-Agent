import { AiHealthStatus, DEFAULT_AI_MODEL, resolveProviderAndModel } from "./aiConfig";
import { invokeUserProvider } from "./providerAdapters";
import { getProviderCredentialById } from "./providerDb";

export type AiHealthReport = {
  status: AiHealthStatus;
  diagnosticCode: string;
  provider: string;
  model: string;
  isCustom: boolean;
  geminiKeyPresent: boolean;
  geminiModelPresent: boolean;
  configuredModel: string;
  details: string;
  timestamp: string;
};

export async function performAiHealthCheck(options?: {
  userId?: number;
  provider?: string;
  model?: string;
}): Promise<AiHealthReport> {
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  const geminiModel = (process.env.GEMINI_MODEL || "").trim();
  const configuredModel = geminiModel || DEFAULT_AI_MODEL;

  const requestedInput = options?.model || options?.provider;
  const resolved = resolveProviderAndModel(requestedInput);

  const buildReport = (status: AiHealthStatus, details: string): AiHealthReport => ({
    status,
    diagnosticCode: status,
    provider: resolved.provider,
    model: resolved.model,
    isCustom: resolved.isCustom,
    geminiKeyPresent: Boolean(geminiKey),
    geminiModelPresent: Boolean(geminiModel),
    configuredModel,
    details,
    timestamp: new Date().toISOString(),
  });

  if (!resolved.isCustom) {
    if (!geminiKey) {
      return buildReport("GEMINI_KEY_MISSING", "GEMINI_API_KEY environment variable is missing on the server.");
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(resolved.model)}:generateContent?key=${encodeURIComponent(geminiKey)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "Ping health check." }] }],
          }),
        }
      ).finally(() => clearTimeout(timeoutId));

      if (response.ok) {
        return buildReport("AI_READY", `Gemini connection verified for model ${resolved.model}.`);
      }

      if (response.status === 401 || response.status === 403) {
        return buildReport("GEMINI_AUTH_FAILED", "GEMINI_API_KEY rejected by Google Gemini API.");
      }

      if (response.status === 404) {
        return buildReport("GEMINI_MODEL_UNAVAILABLE", `Configured model ${resolved.model} is unavailable (404).`);
      }

      if (response.status === 429) {
        const errText = await response.text().catch(() => "");
        if (errText.toLowerCase().includes("quota")) {
          return buildReport("GEMINI_QUOTA_EXCEEDED", "Gemini API quota exhausted.");
        }
        return buildReport("GEMINI_RATE_LIMITED", "Gemini API rate limit exceeded.");
      }

      return buildReport("AI_ERROR", `Gemini returned HTTP status ${response.status}.`);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return buildReport("GEMINI_TIMEOUT", "Gemini API request timed out after 8 seconds.");
      }
      return buildReport("AI_ERROR", error instanceof Error ? error.message : "Network failure reaching Gemini.");
    }
  }

  // Custom provider check
  if (!options?.userId) {
    return buildReport("CUSTOM_PROVIDER_NOT_CONFIGURED", "User authentication required to check custom provider key.");
  }

  const userCred = await getProviderCredentialById(options.userId, resolved.provider);
  if (!userCred || !userCred.apiKey) {
    return buildReport("CUSTOM_PROVIDER_NOT_CONFIGURED", `No active API key found for custom provider ${resolved.provider}.`);
  }

  try {
    await invokeUserProvider({
      provider: resolved.provider,
      apiKey: userCred.apiKey,
      model: resolved.model,
      endpoint: userCred.endpoint,
      prompt: "Ping health check.",
    });
    return buildReport("AI_READY", `Custom provider ${resolved.provider} (${resolved.model}) is ready.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("401") || message.includes("403") || message.includes("authentication failed")) {
      return buildReport("CUSTOM_PROVIDER_NOT_CONFIGURED", `Custom provider ${resolved.provider} key rejected.`);
    }
    if (message.includes("404") || message.includes("not found")) {
      return buildReport("CUSTOM_MODEL_UNAVAILABLE", `Model ${resolved.model} is unavailable on ${resolved.provider}.`);
    }
    return buildReport("AI_ERROR", message || "Custom provider failed health check.");
  }
}
