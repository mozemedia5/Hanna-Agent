// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import UsagePage from "./UsagePage";

afterEach(() => {
  cleanup();
});

describe("UsagePage Component", () => {
  it("renders Starter Free plan, credit allowance, and usage stats", () => {
    render(<UsagePage />);

    expect(screen.getByText(/Usage & Credit Limits/i)).toBeInTheDocument();
    expect(screen.getByText(/Starter Free Plan/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Free/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/500 Credits/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Weekly Credit Usage/i)).toBeInTheDocument();
    expect(screen.getByText(/Conversation Analytics/i)).toBeInTheDocument();
  });

  it("calls onNavigateToUpgrade when Upgrade button is clicked", () => {
    const onUpgradeMock = vi.fn();
    render(<UsagePage onNavigateToUpgrade={onUpgradeMock} />);

    const upgradeBtns = screen.getAllByRole("button", { name: /Upgrade Plan|Start Free Trial/i });
    expect(upgradeBtns.length).toBeGreaterThan(0);
    fireEvent.click(upgradeBtns[0]);

    expect(onUpgradeMock).toHaveBeenCalledTimes(1);
  });

  it("calls onBack when Back button is clicked", () => {
    const onBackMock = vi.fn();
    render(<UsagePage onBack={onBackMock} />);

    const backBtn = screen.getByRole("button", { name: /Go back/i });
    fireEvent.click(backBtn);

    expect(onBackMock).toHaveBeenCalledTimes(1);
  });
});
