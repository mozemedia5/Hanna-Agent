type ProviderRequest = { provider: string; apiKey: string; model: string; prompt: string; context?: string; endpoint?: string };

const HANNA_SYSTEM_PROMPT = `You are Hanna, an advanced agentic AI workspace orchestrator and command center.
You assist users with e-commerce, dropshipping, software development, marketing, research, visual direction, content creation, workflow automation, and task scheduling.
You have access to connected workspace services (Shopify, Google Drive, Gmail, Slack, GitHub, Vercel, HeyGen, TikTok, Instagram, Meta Ads, WhatsApp, CJ Dropshipping, Zendrop, AutoDS, Google Trends) and MCP tools.
Always provide thoughtful, well-structured, actionable responses formatted cleanly in Markdown. Keep a calm, professional, and clear tone. Never expose raw chain-of-thought.`;

function userMessage(request: ProviderRequest) {
  return request.context ? `Workspace context: ${request.context}\n\nUser request: ${request.prompt}` : request.prompt;
}

export async function invokeUserProvider(request: ProviderRequest): Promise<string> {
  const message = userMessage(request);
  if (request.provider === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": request.apiKey.trim(), "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-3-5-sonnet-20241022", max_tokens: 1500, system: HANNA_SYSTEM_PROMPT, messages: [{ role: "user", content: message }] }),
    });
    if (!response.ok) {
      const errText = typeof response.text === "function" ? await response.text().catch(() => "") : "";
      throw new Error(`Anthropic provider returned ${response.status}${errText ? `: ${errText.slice(0, 100)}` : ""}`);
    }
    const data = typeof response.json === "function" ? await response.json().catch(() => null) : null;
    if (!data) throw new Error("Anthropic returned an invalid response format.");
    return (data as { content?: Array<{ type?: string; text?: string }> }).content?.find(item => item.type === "text")?.text ?? "I’m ready to help. Could you rephrase that request?";
  }

  if (request.provider === "gemini") {
    const rawModel = (request.model || process.env.GEMINI_MODEL || "gemini-3.7-flash").trim();
    // Normalize model strings like "Gemini 3.7 Flash" or "3.7-flash" into API-compatible model names
    let primaryModel = rawModel.toLowerCase().replaceAll(" ", "-");
    if (primaryModel.includes("3.7")) primaryModel = "gemini-3.7-flash";
    else if (primaryModel.includes("2.5")) primaryModel = "gemini-2.5-flash";
    else if (primaryModel.includes("2.0")) primaryModel = "gemini-2.0-flash";
    else if (primaryModel.includes("1.5")) primaryModel = "gemini-1.5-flash";

    const candidateModels = Array.from(new Set([
      primaryModel,
      "gemini-3.7-flash",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ]));

    let lastError = "";
    for (const modelName of candidateModels) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(request.apiKey.trim())}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: HANNA_SYSTEM_PROMPT }] }, contents: [{ role: "user", parts: [{ text: message }] }] }),
        });

        if (!response.ok) {
          const errText = typeof response.text === "function" ? await response.text().catch(() => "") : "";
          lastError = `Gemini (${modelName}) returned status ${response.status}${errText ? `: ${errText.slice(0, 150)}` : ""}`;
          if (response.status === 404) continue; // Try next fallback model if specific model name wasn't found
          throw new Error(lastError);
        }

        const data = typeof response.json === "function" ? await response.json().catch(() => null) : null;
        if (!data) throw new Error("Gemini returned an invalid response format.");
        const text = (data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates?.[0]?.content?.parts?.map(part => part.text ?? "").join("");
        if (text && text.trim()) return text;
      } catch (err) {
        if (err instanceof Error) {
          lastError = err.message;
          if (err.message.includes("404")) continue;
        }
        throw err;
      }
    }
    throw new Error(lastError || "Gemini provider could not complete the request with configured models.");
  }

  const baseUrl = request.provider === "custom" && request.endpoint ? request.endpoint : request.provider === "llama" ? "https://api.groq.com/openai/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
  const model = request.provider === "llama" ? "llama-3.3-70b-versatile" : request.provider === "custom" ? request.model : "gpt-4o-mini";
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${request.apiKey.trim()}` },
    body: JSON.stringify({ model, messages: [{ role: "system", content: HANNA_SYSTEM_PROMPT }, { role: "user", content: message }] }),
  });
  if (!response.ok) {
    const errText = typeof response.text === "function" ? await response.text().catch(() => "") : "";
    throw new Error(`${request.provider} provider returned ${response.status}${errText ? `: ${errText.slice(0, 100)}` : ""}`);
  }
  const data = await response.json().catch(() => null) as { choices?: Array<{ message?: { content?: string } }> } | null;
  if (!data) throw new Error(`${request.provider} returned an invalid response format.`);
  return data.choices?.[0]?.message?.content ?? "I’m ready to help. Could you rephrase that request?";
}
