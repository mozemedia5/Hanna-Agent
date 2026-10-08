// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import {
  ToolExecutionStatusBlock,
  getToolFeedbackText,
} from "./ToolExecutionStatusBlock";

afterEach(() => {
  cleanup();
});

describe("ToolExecutionStatusBlock", () => {
  it("generates human-friendly feedback text based on tool type", () => {
    expect(getToolFeedbackText("Web Search", "search")).toBe("Searching the web...");
    expect(getToolFeedbackText("python", "run")).toBe("Executing Python script...");
    expect(getToolFeedbackText("shopify", "list_products")).toBe("Searching Shopify store data...");
    expect(getToolFeedbackText("Web Search", "search", "quantum physics")).toBe('Searching for "quantum physics"...');
  });

  it("renders active running state with tool feedback text", () => {
    render(
      <ToolExecutionStatusBlock
        toolInfo={{
          connector: "Web Search",
          action: "search",
          status: "running",
          startTime: Date.now(),
        }}
        isStreaming={true}
      />
    );
    expect(screen.getByText("Searching the web...")).toBeInTheDocument();
  });

  it("renders completed state with 'Worked for {x} seconds' text", () => {
    render(
      <ToolExecutionStatusBlock
        toolInfo={{
          connector: "Web Search",
          action: "search",
          status: "completed",
          durationSeconds: 1.8,
        }}
        isStreaming={false}
      />
    );
    expect(screen.getByText("Worked for 1.8 seconds")).toBeInTheDocument();
  });
});
