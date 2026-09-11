// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import UpgradePage from "./UpgradePage";

afterEach(() => {
  cleanup();
});

describe("UpgradePage Component", () => {
  it("renders pricing plans, trial offers, and weekly starter credits", () => {
    render(<UpgradePage />);

    expect(screen.getByText(/Upgrade your Hanna Experience/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Starter/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Free/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/500 credits weekly/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1,000 credits per week/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Max/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Enterprise/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Custom credits/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$16.99/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Annual Billing/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Save 15%/i).length).toBeGreaterThan(0);
  });

  it("toggles billing cycle between annual and monthly", () => {
    render(<UpgradePage />);

    const monthlyBtn = screen.getByText("Monthly Billing");
    const annualBtn = screen.getByText("Annual Billing");

    fireEvent.click(monthlyBtn);
    expect(screen.queryAllByText(/15% discount applied/i).length).toBe(0);

    fireEvent.click(annualBtn);
    expect(screen.getAllByText(/15% discount applied/i).length).toBeGreaterThan(0);
  });

  it("triggers onBack when back button is clicked", () => {
    const onBackMock = vi.fn();
    render(<UpgradePage onBack={onBackMock} />);

    const backBtn = screen.getByRole("button", { name: /Back/i });
    fireEvent.click(backBtn);

    expect(onBackMock).toHaveBeenCalledTimes(1);
  });
});
