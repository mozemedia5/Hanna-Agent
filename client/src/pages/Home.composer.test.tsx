// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

// Legacy tests removed — Home.tsx has been refactored into separate page components.
// The Composer, getProviderFailureError, and getProviderKeyError helpers
// are now handled inline within the chat page and server-side routing.

describe("Home page (placeholder)", () => {
  it.skip("placeholder — real tests live in server-side and integration test suites", () => {
    expect(true).toBe(true);
  });
});
