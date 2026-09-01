export type HannaRoute = {
  model: string;
  capability: string;
  reason: string;
};

export function routeHannaRequest(prompt: string): HannaRoute {
  const value = prompt.toLowerCase();
  if (/(pdf|document|image|video|visual|scan)/.test(value)) {
    return {
      model: "gemini-3.6-flash",
      capability: "Multimodal reasoning",
      reason: "The request may include visual or long-context material.",
    };
  }
  if (/(code|github|debug|deploy|repository|typescript|react)/.test(value)) {
    return {
      model: "claude-sonnet-4-6",
      capability: "Coding and reasoning",
      reason: "The request benefits from strong code comprehension.",
    };
  }
  if (/(research|compare|strategy|analy[sz]e|plan)/.test(value)) {
    return {
      model: "gpt-5-mini",
      capability: "Structured analysis",
      reason: "The request is primarily analytical and text-based.",
    };
  }
  return {
    model: "gemini-3.6-flash",
    capability: "General assistance",
    reason: "Automatic routing selected a fast general-purpose model.",
  };
}
