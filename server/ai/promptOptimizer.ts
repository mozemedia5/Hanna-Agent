/**
 * Upstream Image Prompt Expansion Pipeline
 * Replicates ChatGPT's image prompt optimization process by expanding simple user requests
 * into structured, highly descriptive prompts enforcing aspect ratio, lighting, materials, and quality tags.
 */

export interface OptimizedImagePromptResult {
  rawPrompt: string;
  expandedPrompt: string;
  seed: number;
  aspectRatio: string;
  styleTags: string[];
  imageUrl: string;
}

export interface PromptOptimizationOptions {
  seed?: number;
  width?: number;
  height?: number;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
}

/**
 * Normalizes and strips leading trigger phrases from user text.
 */
function extractCoreSubject(prompt: string): string {
  return prompt
    .replace(/^(draw|generate|create|make|paint|render|show me|picture of|image of|a photo of|an illustration of|a visual of|design a|draw a|create an image of)\s+/i, "")
    .trim() || prompt;
}

/**
 * Determines whether user specified an aspect ratio or format.
 */
function detectAspectRatio(prompt: string, defaultRatio = "1:1"): { aspectRatio: string; width: number; height: number } {
  const lower = prompt.toLowerCase();
  if (lower.includes("16:9") || lower.includes("landscape") || lower.includes("widescreen")) {
    return { aspectRatio: "16:9", width: 1280, height: 720 };
  }
  if (lower.includes("9:16") || lower.includes("portrait") || lower.includes("vertical") || lower.includes("wallpaper")) {
    return { aspectRatio: "9:16", width: 720, height: 1280 };
  }
  if (lower.includes("4:3")) {
    return { aspectRatio: "4:3", width: 1024, height: 768 };
  }
  if (lower.includes("3:4")) {
    return { aspectRatio: "3:4", width: 768, height: 1024 };
  }
  return { aspectRatio: defaultRatio, width: 1024, height: 1024 };
}

/**
 * High-fidelity default quality and material constraint tags.
 */
const HIGH_FIDELITY_DEFAULT_TAGS = [
  "8k resolution",
  "crisp focus",
  "highly detailed texturing",
  "vibrant studio lighting",
  "cinematic composition",
  "photorealistic volumetric atmosphere",
  "sharp material definition",
  "accurate formatting",
];

/**
 * Expands a raw user input string into a structured, descriptive image prompt matching ChatGPT standards.
 */
export function optimizeImagePrompt(
  rawPrompt: string,
  options: PromptOptimizationOptions = {}
): OptimizedImagePromptResult {
  const coreSubject = extractCoreSubject(rawPrompt);
  const seed = options.seed ?? Math.floor(Math.random() * 100000);
  const { aspectRatio, width, height } = detectAspectRatio(rawPrompt, options.aspectRatio ?? "1:1");

  const hasStyleKeywords = /(photorealistic|cinematic|octane render|vector|3d render|oil painting|watercolor|minimalist|anime|cyberpunk|sketch|isometric)/i.test(rawPrompt);

  let styleContext = "";
  if (!hasStyleKeywords) {
    styleContext = "A photorealistic, highly detailed 8k render with cinematic lighting, depth of field, and rich natural textures";
  }

  const enrichedParts: string[] = [
    `Subject: ${coreSubject}`,
    styleContext,
    "Background: thoughtfully composed ambient setting with harmonious color palette and atmospheric depth",
    "Lighting & Material: soft directional highlights, precise surface reflections, physically accurate material rendering",
    "Constraints & Quality: sharp focus, zero distortion, exact proportion formatting, high clarity",
    `Aspect Ratio: ${aspectRatio} (${width}x${height})`,
  ].filter(Boolean);

  const expandedPrompt = enrichedParts.join(", ");
  const encodedPrompt = encodeURIComponent(`${coreSubject}, ${HIGH_FIDELITY_DEFAULT_TAGS.join(", ")}`);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}`;

  return {
    rawPrompt,
    expandedPrompt,
    seed,
    aspectRatio,
    styleTags: HIGH_FIDELITY_DEFAULT_TAGS,
    imageUrl,
  };
}
