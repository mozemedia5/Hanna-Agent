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

describe("SettingsPage Component PWA Section", () => {
  it("renders PWA installation section and Install Hanna App button", async () => {
    render(<SettingsPage theme="dark" onThemeChange={vi.fn()} />);

    expect(screen.getByText(/Desktop & Mobile Application \(PWA\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Hanna Workspace App/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Install Hanna App/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Installable/i)).toBeInTheDocument();
  });

  it("calls back navigation handler when back button is clicked", () => {
    const onBackMock = vi.fn();
    render(<SettingsPage theme="dark" onThemeChange={vi.fn()} onBack={onBackMock} />);

    const backBtn = screen.getByRole("button", { name: /Go back/i });
    fireEvent.click(backBtn);

    expect(onBackMock).toHaveBeenCalledTimes(1);
  });
});
