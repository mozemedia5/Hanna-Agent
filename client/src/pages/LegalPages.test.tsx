// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PrivacyPolicyPage from "./PrivacyPolicyPage";
import TermsOfServicePage from "./TermsOfServicePage";
import LoginPage from "./LoginPage";

const mockNavigate = vi.fn();
vi.mock("wouter", () => ({
  useLocation: () => ["/", mockNavigate],
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("Legal Pages and Checkbox Enforcement", () => {
  it("renders Privacy Policy page with headings and data security details", () => {
    render(<PrivacyPolicyPage isAuthenticated={false} />);

    expect(screen.getByText("Hanna AI Privacy Policy")).toBeInTheDocument();
    expect(screen.getByText(/AES-256-GCM API Key Vault/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero AI Model Training/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/https:\/\/hanna-agent.vercel.app/i)[0]
    ).toBeInTheDocument();
  });

  it("renders Terms of Service page with plan descriptions and contributor details", () => {
    render(<TermsOfServicePage isAuthenticated={false} />);

    expect(screen.getByText("Hanna AI Terms of Service")).toBeInTheDocument();
    expect(screen.getByText(/Starter \/ Free/i)).toBeInTheDocument();
    expect(screen.getByText(/Pro Tier/i)).toBeInTheDocument();
    expect(screen.getByText(/Max Tier/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Enterprise/i)[0]).toBeInTheDocument();
  });

  it("LoginPage enforces terms checkbox before submit", async () => {
    const mockAuth = {
      error: null,
      loginWithEmail: vi.fn(),
      registerWithEmail: vi.fn(),
      loginWithGoogle: vi.fn(),
      loginWithApple: vi.fn(),
      loginWithGithub: vi.fn(),
    };

    render(<LoginPage auth={mockAuth} mode="login" />);

    // Fill in required email and password fields first
    const emailInput = screen.getByPlaceholderText("you@example.com");
    const passwordInput = screen.getByPlaceholderText("Your password");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const submitBtn = screen.getByRole("button", { name: /Log in/i });

    // Submit while terms checkbox is unchecked
    fireEvent.click(submitBtn);

    expect(
      screen.getByText(
        /You must agree to the Terms of Service and Privacy Policy to proceed/i
      )
    ).toBeInTheDocument();
    expect(mockAuth.loginWithEmail).not.toHaveBeenCalled();

    // Now check the terms checkbox
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    // Submit again
    fireEvent.click(submitBtn);

    expect(mockAuth.loginWithEmail).toHaveBeenCalledWith(
      "test@example.com",
      "password123"
    );
  });
});
