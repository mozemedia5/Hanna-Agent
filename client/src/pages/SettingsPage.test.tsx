// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import SettingsPage from "./SettingsPage";

// Mock useAuth
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      displayName: "Demo User",
      email: "demo@example.com",
      photoURL: "",
    },
    isAuthenticated: true,
  }),
}));

// Mock firestore
vi.mock("@/lib/firestore", () => ({
  getUserProfile: vi.fn().mockResolvedValue({
    displayName: "Demo User",
    photoURL: "",
    bio: "Test bio",
    customInstructions: "Test instructions",
  }),
  saveUserProfile: vi.fn().mockResolvedValue(undefined),
}));

afterEach(() => {
  cleanup();
});

describe("SettingsPage Component", () => {
  it("renders profile settings, credit quota, and functional hanna-agent.vercel.app affiliate referral link", async () => {
    render(<SettingsPage theme="dark" onThemeChange={vi.fn()} />);

    expect(screen.getByText(/Profile & Account/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Workspace Identity" })).toBeInTheDocument();
    expect(screen.getAllByText(/Weekly Credit Allowance/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Affiliate Program & Referral Accountability/i)).toBeInTheDocument();
    expect(screen.getByText(/https:\/\/hanna-agent\.vercel\.app\/\?ref=demo/i)).toBeInTheDocument();
  });

  it("calls back navigation handler when back button is clicked", () => {
    const onBackMock = vi.fn();
    render(<SettingsPage theme="dark" onThemeChange={vi.fn()} onBack={onBackMock} />);

    const backBtn = screen.getByRole("button", { name: /Go back/i });
    fireEvent.click(backBtn);

    expect(onBackMock).toHaveBeenCalledTimes(1);
  });
});
