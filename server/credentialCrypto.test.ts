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

  it("fails safely when HANNA_ENCRYPTION_KEY is missing outside test environment", () => {
    const originalEnv = process.env.NODE_ENV;
    const originalKey = process.env.HANNA_ENCRYPTION_KEY;
    const originalJwt = process.env.JWT_SECRET;
    try {
      delete process.env.HANNA_ENCRYPTION_KEY;
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = "production";
      expect(() => encryptCredential("test-val")).toThrow("HANNA_ENCRYPTION_KEY");
    } finally {
      process.env.NODE_ENV = originalEnv;
      if (originalKey !== undefined) process.env.HANNA_ENCRYPTION_KEY = originalKey;
      if (originalJwt !== undefined) process.env.JWT_SECRET = originalJwt;
    }
  });
});
