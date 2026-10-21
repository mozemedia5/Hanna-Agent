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
  const sampleSrc = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='32'%20height='32'%3E%3Crect%20width='32'%20height='32'%20fill='%231a73e8'/%3E%3C/svg%3E#expandedPrompt=Subject%3A%20cat%2C%208k%20render&seed=12345";
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
