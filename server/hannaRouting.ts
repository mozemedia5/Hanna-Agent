import { DEFAULT_AI_MODEL, DEFAULT_AI_PROVIDER } from "./aiConfig";

export type HannaRoute = {
  provider: string;
  model: string;
  capability: string;
  reason: string;
};

/**
 * Routes a prompt to Hanna's general-purpose default model (Gemini 3.6 Flash).
 * Respects Gemini 3.6 Flash as the default general-purpose intelligence for all business,
 * Shopify, research, content, multimodal, and software automation requests.
 */
export function routeHannaRequest(prompt: string): HannaRoute {
  const value = prompt.toLowerCase();

  if (/(pdf|document|image|video|visual|scan|photo|file)/.test(value)) {
    return {
      provider: DEFAULT_AI_PROVIDER,
      model: DEFAULT_AI_MODEL,
      capability: "Multimodal & Document Reasoning",
      reason: "Gemini 3.6 Flash provides high-throughput multimodal context analysis.",
    };
  }

  if (/(shopify|store|product|inventory|order|customer|ecommerce|catalog)/.test(value)) {
    return {
      provider: DEFAULT_AI_PROVIDER,
      model: DEFAULT_AI_MODEL,
      capability: "Shopify & Store Management",
      reason: "Gemini 3.6 Flash orchestrates connected Shopify and commerce workflows.",
    };
  }

  if (/(market|campaign|ad|social|copy|seo|marketing|content|research|strategy|analy[sz]e)/.test(value)) {
    return {
      provider: DEFAULT_AI_PROVIDER,
      model: DEFAULT_AI_MODEL,
      capability: "Marketing & Research Strategy",
      reason: "Gemini 3.6 Flash generates high-converting marketing campaigns, research briefs, and creative content.",
    };
  }

  if (/(code|github|debug|deploy|repository|typescript|react|python)/.test(value)) {
    return {
      provider: DEFAULT_AI_PROVIDER,
      model: DEFAULT_AI_MODEL,
      capability: "Coding & Software Orchestration",
      reason: "Gemini 3.6 Flash handles code comprehension, debugging, and deployment planning.",
    };
  }

  return {
    provider: DEFAULT_AI_PROVIDER,
    model: DEFAULT_AI_MODEL,
    capability: "General Assistance",
    reason: "Gemini 3.6 Flash is Hanna's primary general-purpose intelligence engine.",
  };
}
