import { AiHealthStatus, DEFAULT_AI_MODEL, resolveProviderAndModel } from "./aiConfig";
import { invokeUserProvider } from "./providerAdapters";
import { getProviderCredentialById } from "./providerDb";

export type AiHealthReport = {
  status: AiHealthStatus;
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

  const report: AiHealthReport = {
    status: "AI_READY",
    provider: resolved.provider,
    model: resolved.model,
    isCustom: resolved.isCustom,
    geminiKeyPresent: Boolean(geminiKey),
    geminiModelPresent: Boolean(geminiModel),
    configuredModel,
    details: "AI service operational.",
    timestamp: new Date().toISOString(),
  };

  if (!resolved.isCustom) {
    if (!geminiKey) {
      report.status = "GEMINI_KEY_MISSING";
      report.details = "GEMINI_API_KEY environment variable is missing on the server.";
      return report;
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

  // Custom provider check
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
      prompt: "Ping health check.",
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
