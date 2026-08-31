type ProviderRequest = { provider: string; apiKey: string; model: string; prompt: string; context?: string; endpoint?: string };

function userMessage(request: ProviderRequest) {
  return request.context ? `Workspace context: ${request.context}\n\nUser request: ${request.prompt}` : request.prompt;
}

export async function invokeUserProvider(request: ProviderRequest): Promise<string> {
  const message = userMessage(request);
  if (request.provider === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": request.apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1200, system: "You are Hanna, a concise agentic AI workspace orchestrator. Never reveal private chain-of-thought. Answer clearly in Markdown.", messages: [{ role: "user", content: message }] }),
    });
    if (!response.ok) throw new Error(`Anthropic provider returned ${response.status}`);
    const data = await response.json() as { content?: Array<{ type?: string; text?: string }> };
    return data.content?.find(item => item.type === "text")?.text ?? "I’m ready to help. Could you rephrase that request?";
  }
  if (request.provider === "gemini") {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(request.model || "gemini-3.7-flash")}:generateContent?key=${encodeURIComponent(request.apiKey)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: "You are Hanna, a concise agentic AI workspace orchestrator. Never reveal private chain-of-thought. Answer clearly in Markdown." }] }, contents: [{ role: "user", parts: [{ text: message }] }] }),
    });
    if (!response.ok) throw new Error(`Gemini provider returned ${response.status}`);
    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    return data.candidates?.[0]?.content?.parts?.map(part => part.text ?? "").join("") || "I’m ready to help. Could you rephrase that request?";
  }
  const baseUrl = request.provider === "custom" && request.endpoint ? request.endpoint : request.provider === "llama" ? "https://api.groq.com/openai/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
  const model = request.provider === "llama" ? "llama-3.3-70b-versatile" : request.provider === "custom" ? request.model : "gpt-4o-mini";
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${request.apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: "system", content: "You are Hanna, a concise agentic AI workspace orchestrator. Never reveal private chain-of-thought. Answer clearly in Markdown." }, { role: "user", content: message }] }),
  });
  if (!response.ok) throw new Error(`${request.provider} provider returned ${response.status}`);
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "I’m ready to help. Could you rephrase that request?";
}
