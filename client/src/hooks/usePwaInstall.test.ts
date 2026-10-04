// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { usePwaInstall } from "./usePwaInstall";

afterEach(() => {
  cleanup();
});

describe("usePwaInstall Hook", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with default installable state when not installed", () => {
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.isInstalled).toBe(false);
    expect(result.current.canInstallPrompt).toBe(false);
    expect(result.current.installing).toBe(false);
  });

  it("handles beforeinstallprompt event correctly", () => {
    const { result } = renderHook(() => usePwaInstall());

    const promptMock = vi.fn().mockResolvedValue(undefined);
    const mockEvent = new Event("beforeinstallprompt") as any;
    mockEvent.prompt = promptMock;
    mockEvent.userChoice = Promise.resolve({ outcome: "accepted", platform: "web" });

    act(() => {
      window.dispatchEvent(mockEvent);
    });

    expect(result.current.canInstallPrompt).toBe(true);
  });

  it("triggers install prompt and updates state upon acceptance", async () => {
    const { result } = renderHook(() => usePwaInstall());

    const promptMock = vi.fn().mockResolvedValue(undefined);
    const mockEvent = new Event("beforeinstallprompt") as any;
    mockEvent.prompt = promptMock;
    mockEvent.userChoice = Promise.resolve({ outcome: "accepted", platform: "web" });

    act(() => {
      window.dispatchEvent(mockEvent);
    });

    let installResult = false;
    await act(async () => {
      installResult = await result.current.installApp();
    });

    expect(promptMock).toHaveBeenCalled();
    expect(installResult).toBe(true);
    expect(result.current.isInstalled).toBe(true);
  });

  it("handles appinstalled window event", () => {
    const { result } = renderHook(() => usePwaInstall());

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    expect(result.current.isInstalled).toBe(true);
  });
});
