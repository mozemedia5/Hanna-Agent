// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LandingPage from "./LandingPage";

// Mock wouter useLocation
const mockNavigate = vi.fn();
vi.mock("wouter", () => ({
  useLocation: () => ["/", mockNavigate],
}));

describe("LandingPage Component", () => {
  it("renders main hero heading and Gemini badge", () => {
    render(<LandingPage />);
    expect(screen.getByText("Gemini Powered")).toBeInTheDocument();
    expect(screen.getByText(/Build next-generation AI experiences/i)).toBeInTheDocument();
    expect(screen.getByText("unmatched speed & precision.")).toBeInTheDocument();
  });

  it("switches hero media tabs between video walkthrough and interactive preview", () => {
    render(<LandingPage />);

    // Default tab is Product Walkthrough
    const mediaTabs = screen.getAllByText("Product Walkthrough");
    expect(mediaTabs[0]).toBeInTheDocument();

    // Click Live Interactive Preview
    const interactiveTab = screen.getAllByText("Live Interactive Preview")[0];
    fireEvent.click(interactiveTab);

    // Interactive playground elements should now be visible
    expect(screen.getByText("LIVE PROMPT PLAYGROUND")).toBeInTheDocument();
    expect(screen.getByText("Execute Prompt")).toBeInTheDocument();
  });

  it("switches code playground snippets between TypeScript, Python, and cURL", () => {
    render(<LandingPage />);

    const pythonTab = screen.getAllByRole("button", { name: "Python" })[0];
    fireEvent.click(pythonTab);

    expect(screen.getByText(/from hanna import HannaClient/i)).toBeInTheDocument();

    const curlTab = screen.getAllByRole("button", { name: "cURL" })[0];
    fireEvent.click(curlTab);

    expect(screen.getByText(/curl https:\/\/api.hanna.ai\/v1\/chat\/completions/i)).toBeInTheDocument();
  });

  it("toggles dark and light mode theme class", () => {
    render(<LandingPage />);

    const themeToggle = screen.getAllByRole("button", { name: /Switch to light mode|Switch to dark mode/i })[0];
    expect(themeToggle).toBeInTheDocument();

    fireEvent.click(themeToggle);
    const isDarkOrLight =
      document.documentElement.classList.contains("dark") ||
      document.documentElement.classList.contains("light");
    expect(isDarkOrLight).toBe(true);
  });

  it("navigates to create-account when primary hero button is clicked", () => {
    render(<LandingPage />);

    const ctaButton = screen.getAllByText("Start building for free")[0].closest("button");
    expect(ctaButton).not.toBeNull();
    if (ctaButton) {
      fireEvent.click(ctaButton);
      expect(mockNavigate).toHaveBeenCalledWith("/create-account");
    }
  });
});
