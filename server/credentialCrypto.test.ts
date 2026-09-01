import { describe, expect, it } from "vitest";
import {
  credentialHint,
  decryptCredential,
  encryptCredential,
  maskCredential,
} from "./credentialCrypto";

describe("credentialCrypto", () => {
  it("round-trips credentials through authenticated encryption", () => {
    const original = "sk-example-secret-value-1234";
    expect(decryptCredential(encryptCredential(original))).toBe(original);
  });

  it("returns only a safe hint for UI display", () => {
    const original = "AIza-super-secret-value-1234";
    expect(maskCredential(original)).not.toContain(original);
    expect(credentialHint(original)).toBe("…1234");
  });
});
