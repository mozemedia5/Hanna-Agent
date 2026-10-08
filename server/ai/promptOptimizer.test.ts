import { describe, it, expect } from "vitest";
import { optimizeImagePrompt } from "./promptOptimizer";

describe("Upstream Image Prompt Optimizer Module", () => {
  it("expands a simple raw prompt ('a cat') into a structured high-fidelity prompt", () => {
    const result = optimizeImagePrompt("a cat");

    expect(result.rawPrompt).toBe("a cat");
    expect(result.expandedPrompt).toContain("Subject: a cat");
    expect(result.expandedPrompt).toContain("Background:");
    expect(result.expandedPrompt).toContain("Lighting & Material:");
    expect(result.expandedPrompt).toContain("Constraints & Quality:");
    expect(result.expandedPrompt).toContain("Aspect Ratio: 1:1");
    expect(result.seed).toBeGreaterThanOrEqual(0);
    expect(result.imageUrl).toContain("https://image.pollinations.ai/prompt/");
    expect(result.imageUrl).toContain("width=1024&height=1024");
  });

  it("detects landscape / 16:9 aspect ratio from raw input", () => {
    const result = optimizeImagePrompt("a futuristic cityscape widescreen 16:9");

    expect(result.aspectRatio).toBe("16:9");
    expect(result.imageUrl).toContain("width=1280&height=720");
  });

  it("enforces default high-fidelity quality tags when omitted", () => {
    const result = optimizeImagePrompt("a red sports car");

    expect(result.styleTags).toContain("8k resolution");
    expect(result.styleTags).toContain("crisp focus");
    expect(result.styleTags).toContain("photorealistic volumetric atmosphere");
    expect(result.styleTags).toContain("accurate formatting");
  });
});
