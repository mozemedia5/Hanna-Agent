import { afterEach, describe, expect, it } from "vitest";
import { getFirebasePublicConfig, missingFirebaseConfigFields } from "./firebaseConfig";

const originalEnv = { ...process.env };
afterEach(() => {
  for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
  for (const [key, value] of Object.entries(originalEnv)) process.env[key] = value;
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
    expect(getFirebasePublicConfig()).toMatchObject({ apiKey: "vite-key", projectId: "vite-project", appId: "vite-app" });
  });

  it("reports the required fields that are missing", () => {
    const config = getFirebasePublicConfig();
    expect(missingFirebaseConfigFields(config)).toEqual(expect.arrayContaining(["apiKey", "authDomain", "projectId", "appId"]));
  });
});
