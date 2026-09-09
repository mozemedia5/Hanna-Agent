import { describe, expect, it } from "vitest";
import { routeHannaRequest } from "./hannaRouting";

describe("routeHannaRequest", () => {
  it("routes document and visual work to Gemini 2.5 Flash", () => {
    const route = routeHannaRequest("Analyze this PDF and extract key points");
    expect(route.provider).toBe("gemini");
    expect(route.model).toBe("gemini-2.5-flash");
    expect(route.capability).toBe("Multimodal & Document Reasoning");
  });

  it("routes coding and software orchestration work to Gemini 2.5 Flash", () => {
    const route = routeHannaRequest("Debug my React repository and deploy it");
    expect(route.provider).toBe("gemini");
    expect(route.model).toBe("gemini-2.5-flash");
    expect(route.capability).toBe("Coding & Software Orchestration");
  });

  it("routes Shopify and store work to Gemini 2.5 Flash", () => {
    const route = routeHannaRequest("List my Shopify products and update catalog");
    expect(route.provider).toBe("gemini");
    expect(route.model).toBe("gemini-2.5-flash");
    expect(route.capability).toBe("Shopify & Store Management");
  });

  it("routes research and strategy work to Gemini 2.5 Flash", () => {
    const route = routeHannaRequest("Research competitors and compare positioning");
    expect(route.provider).toBe("gemini");
    expect(route.model).toBe("gemini-2.5-flash");
    expect(route.capability).toBe("Marketing & Research Strategy");
  });

  it("keeps general prompts on Gemini 2.5 Flash", () => {
    const route = routeHannaRequest("Help me write a welcome note");
    expect(route.provider).toBe("gemini");
    expect(route.model).toBe("gemini-2.5-flash");
    expect(route.reason).toContain("general-purpose");
  });
});
