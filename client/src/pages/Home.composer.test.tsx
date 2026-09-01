// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Composer, getProviderFailureError, getProviderKeyError } from "./Home";

describe("Composer API-key error state", () => {
  it("blocks a selected provider when no matching key is connected", () => {
    expect(
      getProviderKeyError({ id: 1 }, { defaultProvider: "openai" }, [
        { provider: "gemini" },
      ])
    ).toBe("Connect your openai API key in Settings to send this request.");
    expect(
      getProviderKeyError({ id: 1 }, { defaultProvider: "automatic" }, [])
    ).toBeNull();
  });

  it("recognizes the backend response for an invalid connected provider", () => {
    expect(
      getProviderFailureError(
        "Your connected provider could not complete this request. Check its API key in Settings and try again."
      )
    ).toContain("Check its API key in Settings");
    expect(getProviderFailureError("A normal Hanna response")).toBeNull();
  });
  it("shows recovery guidance, disables send, opens settings, and clears on input", () => {
    const setPrompt = vi.fn();
    const clearComposerError = vi.fn();
    const setActive = vi.fn();
    render(
      <Composer
        prompt="Build a report"
        setPrompt={setPrompt}
        submit={vi.fn()}
        isWorking={false}
        composerError="Connect your OpenAI API key in Settings to send this request."
        clearComposerError={clearComposerError}
        setActive={setActive}
      />
    );
    expect(screen.getByText(/Connect your OpenAI API key/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(setActive).toHaveBeenCalledWith("Settings");
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Build a better report" },
    });
    expect(clearComposerError).toHaveBeenCalled();
    expect(setPrompt).toHaveBeenCalledWith("Build a better report");
  });
});
