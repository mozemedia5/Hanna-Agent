import { afterEach, describe, expect, it } from "vitest";
import {
  getFirebasePublicConfig,
  missingFirebaseConfigFields,
} from "./firebaseConfig";

const originalEnv = { ...process.env };
afterEach(() => {
  for (const key of Object.keys(process.env))
    if (!(key in originalEnv)) delete process.env[key];
  for (const [key, value] of Object.entries(originalEnv))
    process.env[key] = value;
});

describe("Firebase public configuration", () => {
  it("prefers unprefixed server variables", () => {
    process.env.FIREBASE_API_KEY = "server-key";
    process.env.VITE_FIREBASE_API_KEY = "vite-key";
    process.env.FIREBASE_AUTH_DOMAIN = "server.firebaseapp.com";
    process.env.FIREBASE_PROJECT_ID = "server-project";
    process.env.FIREBASE_APP_ID = "server-app";
    const config = getFirebasePublicConfig();
    expect(config.apiKey).toBe("server-key");
    expect(config.authDomain).toBe("server.firebaseapp.com");
    expect(missingFirebaseConfigFields(config)).toEqual([]);
  });

  it("supports Vite-prefixed variables when that is what Vercel provides", () => {
    delete process.env.FIREBASE_API_KEY;
    delete process.env.FIREBASE_AUTH_DOMAIN;
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_APP_ID;
    process.env.VITE_FIREBASE_API_KEY = "vite-key";
    process.env.VITE_FIREBASE_AUTH_DOMAIN = "vite.firebaseapp.com";
    process.env.VITE_FIREBASE_PROJECT_ID = "vite-project";
    process.env.VITE_FIREBASE_APP_ID = "vite-app";
    expect(getFirebasePublicConfig()).toMatchObject({
      apiKey: "vite-key",
      projectId: "vite-project",
      appId: "vite-app",
    });
  });

  it("reports the required fields that are missing", () => {
    const config = getFirebasePublicConfig();
    expect(missingFirebaseConfigFields(config)).toEqual(
      expect.arrayContaining(["apiKey", "authDomain", "projectId", "appId"])
    );
  });
});

import { parseAndVerifyFirebaseToken } from "./_core/context";

describe("Firebase token verification", () => {
  const createMockToken = (payload: object) => {
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${header}.${body}.mockSignature`;
  };

  it("accepts valid token within expiration and matching project ID", () => {
    process.env.FIREBASE_PROJECT_ID = "test-project-123";
    const token = createMockToken({
      user_id: "usr_abc123",
      exp: Math.floor(Date.now() / 1000) + 3600,
      aud: "test-project-123",
      iss: "https://securetoken.google.com/test-project-123",
    });
    const parsed = parseAndVerifyFirebaseToken(token);
    expect(parsed?.user_id).toBe("usr_abc123");
  });

  it("rejects expired token", () => {
    const token = createMockToken({
      user_id: "usr_abc123",
      exp: Math.floor(Date.now() / 1000) - 10,
    });
    expect(parseAndVerifyFirebaseToken(token)).toBeNull();
  });

  it("rejects token with mismatched audience when project ID is set", () => {
    process.env.FIREBASE_PROJECT_ID = "expected-project";
    const token = createMockToken({
      user_id: "usr_abc123",
      exp: Math.floor(Date.now() / 1000) + 3600,
      aud: "wrong-project",
    });
    expect(parseAndVerifyFirebaseToken(token)).toBeNull();
  });
});
