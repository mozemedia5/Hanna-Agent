/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatGPTImageCard } from "./ChatGPTImageCard";

// Mock clipboard API
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
  writable: true,
});

describe("ChatGPTImageCard Component", () => {
  const sampleSrc = "https://image.pollinations.ai/prompt/a%20cute%20cat?width=1024&height=1024&nologo=true&seed=12345#expandedPrompt=Subject%3A%20cat%2C%208k%20render&seed=12345";
  const sampleAlt = "a cute cat";

  it("renders the image card container and toolbars", () => {
    render(<ChatGPTImageCard src={sampleSrc} alt={sampleAlt} />);

    expect(screen.getByText("AI Visual Synthesis")).toBeInTheDocument();
    expect(screen.getByTitle("Copy description")).toBeInTheDocument();
    expect(screen.getByTitle("Save image asset")).toBeInTheDocument();
  });

  it("displays the skeleton loader with expanded prompt in muted italic format before load", () => {
    render(<ChatGPTImageCard src={sampleSrc} alt={sampleAlt} />);

    expect(screen.getAllByText("Synthesizing visual asset...").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Subject: cat, 8k render/i).length).toBeGreaterThan(0);
  });

  it("triggers clipboard copy on Copy button click", async () => {
    render(<ChatGPTImageCard src={sampleSrc} alt={sampleAlt} />);

    const copyBtns = screen.getAllByTitle("Copy description");
    fireEvent.click(copyBtns[0]);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Subject: cat, 8k render");
  });
});
