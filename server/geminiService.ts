import crypto from "node:crypto";

export class GeminiProviderError extends Error {
  public readonly success = false;
  public readonly provider = "gemini";
  public readonly model: string;
  public readonly errorCode: string;
  public readonly status?: number;
  public readonly details?: string;

  constructor(options: {
    model: string;
    errorCode: string;
    message: string;
    status?: number;
    details?: string;
  }) {
    super(options.message);
    this.name = "GeminiProviderError";
    this.model = options.model;
    this.errorCode = options.errorCode;
    this.status = options.status;
    this.details = options.details;
  }

  toJSON() {
    return {
      success: false,
      provider: "gemini",
      model: this.model,
      errorCode: this.errorCode,
      message: this.message,
    };
  }
}

export type GeminiResponseMetadata = {
  text: string;
  provider: "gemini";
  model: string;
  requestId: string;
  latencyMs: number;
};

export type GeminiToolTurnResponse = {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
  provider: "gemini";
  model: string;
  requestId: string;
  latencyMs: number;
};

export type GeminiRequestOptions = {
  apiKey?: string;
  model?: string;
  prompt: string;
  context?: string;
  systemPrompt?: string;
  tools?: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
  timeoutMs?: number;
  requestId?: string;
  route?: string;
};

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";

/**
 * Resolves the canonical Gemini model to use.
 * Strictly uses process.env.GEMINI_MODEL or falls back safely to 'gemini-3.5-flash'.
 */
export function getEffectiveGeminiModel(requestedModel?: string): string {
  const envModel = (process.env.GEMINI_MODEL || "").trim();
  const baseModel = envModel || DEFAULT_GEMINI_MODEL;

  if (!requestedModel || !requestedModel.trim()) {
    return baseModel;
  }

  const clean = requestedModel.trim().toLowerCase();
  if (clean === "hanna default" || clean === "hanna lite" || clean === "hanna pro" || clean === "default" || clean === "automatic") {
    return baseModel;
  }

  if (clean.includes("gemini")) {
    if (clean.startsWith("gemini-")) {
      return clean;
    }
    return DEFAULT_GEMINI_MODEL;
  }

  return baseModel;
}

/**
 * Masks raw API keys in any text or message to prevent key leaks.
 */
export function sanitizeErrorText(text: string): string {
  if (!text) return "";
  return text
    .replace(/AIzaSy[A-Za-z0-9_-]{20,}/g, "AIzaSy••••••••")
    .replace(/key=[A-Za-z0-9_-]+/gi, "key=••••••••");
}

function classifyHttpStatus(status: number): { errorCode: string; retryable: boolean; message: string } {
  switch (status) {
    case 400:
      return { errorCode: "GEMINI_400", retryable: false, message: "Bad request sent to Gemini API." };
    case 401:
      return { errorCode: "GEMINI_401", retryable: false, message: "Gemini API authentication failed. Check server API key." };
    case 403:
      return { errorCode: "GEMINI_403", retryable: false, message: "Access forbidden by Gemini API. Check API key permissions." };
    case 404:
      return { errorCode: "GEMINI_404", retryable: false, message: "Configured Gemini model or endpoint not found (404)." };
    case 408:
      return { errorCode: "GEMINI_TIMEOUT", retryable: true, message: "Gemini API request timed out." };
    case 429:
      return { errorCode: "GEMINI_429", retryable: true, message: "Gemini API rate limit or quota exceeded." };
    case 500:
      return { errorCode: "GEMINI_500", retryable: true, message: "Gemini server error (500)." };
    case 502:
      return { errorCode: "GEMINI_502", retryable: true, message: "Gemini bad gateway (502)." };
    case 503:
      return { errorCode: "GEMINI_503", retryable: true, message: "Hanna could not reach Gemini right now (503)." };
    case 504:
      return { errorCode: "GEMINI_504", retryable: true, message: "Gemini gateway timeout (504)." };
    default:
      if (status >= 500) {
        return { errorCode: `GEMINI_${status}`, retryable: true, message: `Gemini service error (${status}).` };
      }
      return { errorCode: `GEMINI_${status}`, retryable: false, message: `Gemini returned HTTP ${status}.` };
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildGeminiRequestBody(options: GeminiRequestOptions) {
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  const messageText = options.context
    ? `Workspace context: ${options.context}\n\nUser request: ${options.prompt}`
    : options.prompt;

  contents.push({
    role: "user",
    parts: [{ text: messageText }],
  });

  const body: Record<string, unknown> = { contents };

  if (options.systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: options.systemPrompt }],
    };
  }

  if (options.tools && options.tools.length > 0) {
    body.tools = [
      {
        functionDeclarations: options.tools.map(t => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        })),
      },
    ];
  }

  return body;
}

/**
 * Single canonical GenerateContent implementation for Google Gemini REST API.
 */
export async function generateGeminiContent(
  options: GeminiRequestOptions
): Promise<GeminiResponseMetadata> {
  const startTime = Date.now();
  const apiKey = (options.apiKey || process.env.GEMINI_API_KEY || "").trim();
  const model = getEffectiveGeminiModel(options.model);
  const requestId = options.requestId || `req_${crypto.randomUUID()}`;
  const route = options.route || "generate";
  const timeoutMs = options.timeoutMs || 30_000;

  if (!apiKey) {
    throw new GeminiProviderError({
      model,
      errorCode: "MISSING_API_KEY",
      message: "Gemini API key is missing or not configured on the server.",
    });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const requestBody = buildGeminiRequestBody(options);

  const maxAttempts = 3;
  let lastError: GeminiProviderError | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        const safeErrText = sanitizeErrorText(errText);
        const classification = classifyHttpStatus(response.status);

        console.error(
          `[AI] provider=gemini model=${model} status=${response.status} retry=${attempt - 1} route=${route} reqId=${requestId} latency=${latencyMs}ms`
        );

        const providerErr = new GeminiProviderError({
          model,
          errorCode: classification.errorCode,
          status: response.status,
          message: classification.message,
          details: safeErrText,
        });

        if (classification.retryable && attempt < maxAttempts) {
          lastError = providerErr;
          await delay(attempt === 1 ? 500 : 1000);
          continue;
        }

        throw providerErr;
      }

      const data = (await response.json().catch(() => null)) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      } | null;

      if (!data) {
        throw new GeminiProviderError({
          model,
          errorCode: "GEMINI_INVALID_RESPONSE",
          message: "Gemini returned an invalid or empty JSON response structure.",
        });
      }

      const text = data.candidates?.[0]?.content?.parts
        ?.map(p => p.text ?? "")
        .join("") ?? "";

      if (!text || !text.trim()) {
        throw new GeminiProviderError({
          model,
          errorCode: "GEMINI_EMPTY_RESPONSE",
          message: "Gemini API returned an empty text response.",
        });
      }

      console.info(
        `[AI] provider=gemini model=${model} status=200 latency=${latencyMs}ms route=${route} reqId=${requestId}`
      );

      return {
        text,
        provider: "gemini",
        model,
        requestId,
        latencyMs,
      };
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      if (err instanceof GeminiProviderError) {
        if (!err.status || err.errorCode === "GEMINI_503" || err.errorCode === "GEMINI_429" || err.errorCode === "GEMINI_TIMEOUT") {
          lastError = err;
          if (attempt < maxAttempts && (err.errorCode === "GEMINI_503" || err.errorCode === "GEMINI_429")) {
            await delay(attempt === 1 ? 500 : 1000);
            continue;
          }
        }
        throw err;
      }

      if (err instanceof Error && err.name === "AbortError") {
        const timeoutErr = new GeminiProviderError({
          model,
          errorCode: "GEMINI_TIMEOUT",
          message: `Gemini API request timed out after ${timeoutMs / 1000} seconds.`,
        });
        console.error(
          `[AI] provider=gemini model=${model} status=TIMEOUT retry=${attempt - 1} route=${route} reqId=${requestId} latency=${latencyMs}ms`
        );
        if (attempt < maxAttempts) {
          lastError = timeoutErr;
          await delay(attempt === 1 ? 500 : 1000);
          continue;
        }
        throw timeoutErr;
      }

      const networkErr = new GeminiProviderError({
        model,
        errorCode: "GEMINI_NETWORK_ERROR",
        message: "Network failure while attempting to connect to Gemini API.",
        details: err instanceof Error ? sanitizeErrorText(err.message) : String(err),
      });

      console.error(
        `[AI] provider=gemini model=${model} status=NETWORK_ERROR retry=${attempt - 1} route=${route} reqId=${requestId} latency=${latencyMs}ms`
      );

      if (attempt < maxAttempts) {
        lastError = networkErr;
        await delay(attempt === 1 ? 500 : 1000);
        continue;
      }
      throw networkErr;
    }
  }

  throw lastError || new GeminiProviderError({
    model,
    errorCode: "GEMINI_503",
    message: "Hanna could not reach Gemini right now after multiple retries.",
  });
}

/**
 * Single canonical StreamGenerateContent SSE implementation for Google Gemini REST API.
 */
export async function streamGeminiContent(
  options: GeminiRequestOptions,
  onChunk: (chunk: string) => void
): Promise<GeminiResponseMetadata> {
  const startTime = Date.now();
  const apiKey = (options.apiKey || process.env.GEMINI_API_KEY || "").trim();
  const model = getEffectiveGeminiModel(options.model);
  const requestId = options.requestId || `req_${crypto.randomUUID()}`;
  const route = options.route || "stream";
  const timeoutMs = options.timeoutMs || 30_000;

  if (!apiKey) {
    throw new GeminiProviderError({
      model,
      errorCode: "MISSING_API_KEY",
      message: "Gemini API key is missing or not configured on the server.",
    });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
  const requestBody = buildGeminiRequestBody(options);

  const maxAttempts = 3;
  let lastError: GeminiProviderError | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        const safeErrText = sanitizeErrorText(errText);
        const classification = classifyHttpStatus(response.status);

        console.error(
          `[AI] provider=gemini model=${model} status=${response.status} retry=${attempt - 1} route=${route} reqId=${requestId} latency=${latencyMs}ms`
        );

        const providerErr = new GeminiProviderError({
          model,
          errorCode: classification.errorCode,
          status: response.status,
          message: classification.message,
          details: safeErrText,
        });

        if (classification.retryable && attempt < maxAttempts) {
          lastError = providerErr;
          await delay(attempt === 1 ? 500 : 1000);
          continue;
        }

        throw providerErr;
      }

      if (!response.body) {
        return generateGeminiContent(options);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr || jsonStr === "[DONE]") continue;

          try {
            const data = JSON.parse(jsonStr);
            const chunk = data.candidates?.[0]?.content?.parts
              ?.map((p: { text?: string }) => p.text ?? "")
              .join("") || "";

            if (chunk) {
              fullText += chunk;
              onChunk(chunk);
            }
          } catch {
            // Ignore non-JSON lines in stream
          }
        }
      }

      if (!fullText || !fullText.trim()) {
        throw new GeminiProviderError({
          model,
          errorCode: "GEMINI_EMPTY_RESPONSE",
          message: "Gemini stream returned empty text.",
        });
      }

      console.info(
        `[AI] provider=gemini model=${model} status=200 latency=${latencyMs}ms route=${route} reqId=${requestId}`
      );

      return {
        text: fullText,
        provider: "gemini",
        model,
        requestId,
        latencyMs,
      };
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      if (err instanceof GeminiProviderError) {
        if (!err.status || err.errorCode === "GEMINI_503" || err.errorCode === "GEMINI_429" || err.errorCode === "GEMINI_TIMEOUT") {
          lastError = err;
          if (attempt < maxAttempts && (err.errorCode === "GEMINI_503" || err.errorCode === "GEMINI_429")) {
            await delay(attempt === 1 ? 500 : 1000);
            continue;
          }
        }
        throw err;
      }

      if (err instanceof Error && err.name === "AbortError") {
        const timeoutErr = new GeminiProviderError({
          model,
          errorCode: "GEMINI_TIMEOUT",
          message: `Gemini API stream request timed out after ${timeoutMs / 1000} seconds.`,
        });
        console.error(
          `[AI] provider=gemini model=${model} status=TIMEOUT retry=${attempt - 1} route=${route} reqId=${requestId} latency=${latencyMs}ms`
        );
        if (attempt < maxAttempts) {
          lastError = timeoutErr;
          await delay(attempt === 1 ? 500 : 1000);
          continue;
        }
        throw timeoutErr;
      }

      const networkErr = new GeminiProviderError({
        model,
        errorCode: "GEMINI_NETWORK_ERROR",
        message: "Network failure while streaming from Gemini API.",
        details: err instanceof Error ? sanitizeErrorText(err.message) : String(err),
      });

      console.error(
        `[AI] provider=gemini model=${model} status=NETWORK_ERROR retry=${attempt - 1} route=${route} reqId=${requestId} latency=${latencyMs}ms`
      );

      if (attempt < maxAttempts) {
        lastError = networkErr;
        await delay(attempt === 1 ? 500 : 1000);
        continue;
      }
      throw networkErr;
    }
  }

  throw lastError || new GeminiProviderError({
    model,
    errorCode: "GEMINI_503",
    message: "Hanna could not reach Gemini right now after multiple retries.",
  });
}

/**
 * Single canonical Agent Tool Turn execution for Gemini.
 */
export async function invokeGeminiToolTurn(
  options: GeminiRequestOptions
): Promise<GeminiToolTurnResponse> {
  const startTime = Date.now();
  const apiKey = (options.apiKey || process.env.GEMINI_API_KEY || "").trim();
  const model = getEffectiveGeminiModel(options.model);
  const requestId = options.requestId || `req_${crypto.randomUUID()}`;
  const route = options.route || "agent_turn";
  const timeoutMs = options.timeoutMs || 45_000;

  if (!apiKey) {
    throw new GeminiProviderError({
      model,
      errorCode: "MISSING_API_KEY",
      message: "Gemini API key is missing or not configured on the server.",
    });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const requestBody = buildGeminiRequestBody(options);

  const maxAttempts = 3;
  let lastError: GeminiProviderError | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        const safeErrText = sanitizeErrorText(errText);
        const classification = classifyHttpStatus(response.status);

        console.error(
          `[AI] provider=gemini model=${model} status=${response.status} retry=${attempt - 1} route=${route} reqId=${requestId} latency=${latencyMs}ms`
        );

        const providerErr = new GeminiProviderError({
          model,
          errorCode: classification.errorCode,
          status: response.status,
          message: classification.message,
          details: safeErrText,
        });

        if (classification.retryable && attempt < maxAttempts) {
          lastError = providerErr;
          await delay(attempt === 1 ? 500 : 1000);
          continue;
        }

        throw providerErr;
      }

      const data = (await response.json().catch(() => null)) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
              functionCall?: { name?: string; args?: Record<string, unknown> };
            }>;
          };
        }>;
      } | null;

      if (!data) {
        throw new GeminiProviderError({
          model,
          errorCode: "GEMINI_INVALID_RESPONSE",
          message: "Gemini returned invalid response structure during tool turn.",
        });
      }

      const parts = data.candidates?.[0]?.content?.parts ?? [];
      const functionCallPart = parts.find(p => p.functionCall?.name)?.functionCall;

      if (functionCallPart?.name) {
        console.info(
          `[AI] provider=gemini model=${model} status=200 tool_call=${functionCallPart.name} latency=${latencyMs}ms route=${route} reqId=${requestId}`
        );
        return {
          functionCall: {
            name: functionCallPart.name,
            args: functionCallPart.args ?? {},
          },
          provider: "gemini",
          model,
          requestId,
          latencyMs,
        };
      }

      const text = parts.map(p => p.text ?? "").join("").trim();
      if (!text) {
        throw new GeminiProviderError({
          model,
          errorCode: "GEMINI_EMPTY_RESPONSE",
          message: "Gemini returned an empty turn during tool execution.",
        });
      }

      console.info(
        `[AI] provider=gemini model=${model} status=200 latency=${latencyMs}ms route=${route} reqId=${requestId}`
      );

      return {
        text,
        provider: "gemini",
        model,
        requestId,
        latencyMs,
      };
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      if (err instanceof GeminiProviderError) {
        if (!err.status || err.errorCode === "GEMINI_503" || err.errorCode === "GEMINI_429" || err.errorCode === "GEMINI_TIMEOUT") {
          lastError = err;
          if (attempt < maxAttempts && (err.errorCode === "GEMINI_503" || err.errorCode === "GEMINI_429")) {
            await delay(attempt === 1 ? 500 : 1000);
            continue;
          }
        }
        throw err;
      }

      if (err instanceof Error && err.name === "AbortError") {
        const timeoutErr = new GeminiProviderError({
          model,
          errorCode: "GEMINI_TIMEOUT",
          message: `Gemini API request timed out after ${timeoutMs / 1000} seconds.`,
        });
        console.error(
          `[AI] provider=gemini model=${model} status=TIMEOUT retry=${attempt - 1} route=${route} reqId=${requestId} latency=${latencyMs}ms`
        );
        if (attempt < maxAttempts) {
          lastError = timeoutErr;
          await delay(attempt === 1 ? 500 : 1000);
          continue;
        }
        throw timeoutErr;
      }

      const networkErr = new GeminiProviderError({
        model,
        errorCode: "GEMINI_NETWORK_ERROR",
        message: "Network failure during Gemini tool turn execution.",
        details: err instanceof Error ? sanitizeErrorText(err.message) : String(err),
      });

      console.error(
        `[AI] provider=gemini model=${model} status=NETWORK_ERROR retry=${attempt - 1} route=${route} reqId=${requestId} latency=${latencyMs}ms`
      );

      if (attempt < maxAttempts) {
        lastError = networkErr;
        await delay(attempt === 1 ? 500 : 1000);
        continue;
      }
      throw networkErr;
    }
  }

  throw lastError || new GeminiProviderError({
    model,
    errorCode: "GEMINI_503",
    message: "Hanna could not reach Gemini right now after multiple retries.",
  });
}
