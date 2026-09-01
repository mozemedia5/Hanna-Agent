import { describe, expect, it } from "vitest";
import { routeHannaRequest } from "./hannaRouting";

describe("routeHannaRequest", () => {
  it("routes document and visual work to Gemini", () => {
    expect(
      routeHannaRequest("Analyze this PDF and extract the key points").model
    ).toBe("gemini-3.6-flash");
  });

  it("routes coding and deployment work to Claude", () => {
    expect(
      routeHannaRequest("Debug my React repository and deploy it").capability
    ).toBe("Coding and reasoning");
  });

  it("routes research work to a structured analysis model", () => {
    expect(
      routeHannaRequest("Research competitors and compare their positioning")
        .model
    ).toBe("gpt-5-mini");
  });

  it("keeps general prompts on a fast general model", () => {
    expect(routeHannaRequest("Help me write a welcome note").reason).toContain(
      "general-purpose"
    );
  });
});
