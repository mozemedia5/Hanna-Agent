import { describe, expect, it } from "vitest";
import handler from "./index";

describe("Vercel API entrypoint", () => {
  it("exports an Express-compatible request handler without opening a listener", () => {
    expect(typeof handler).toBe("function");
    expect((handler as any).listen).toBeTypeOf("function");
  });

  it("serves firebase configuration from environment variables", async () => {
    const originalEnv = { ...process.env };
    process.env.FIREBASE_API_KEY = "test-api-key";
    process.env.FIREBASE_AUTH_DOMAIN = "test.firebaseapp.com";
    process.env.FIREBASE_PROJECT_ID = "test-project";
    process.env.FIREBASE_STORAGE_BUCKET = "test.appspot.com";
    process.env.FIREBASE_MESSAGING_SENDER_ID = "123456789";
    process.env.FIREBASE_APP_ID = "1:123:web:abc";
    process.env.FIREBASE_MEASUREMENT_ID = "G-TEST123";

    let jsonResult: any = null;
    const req = { method: "GET", url: "/api/config", headers: {} } as any;
    const res = {
      setHeader: () => res,
      end: () => res,
      json: (data: any) => {
        jsonResult = data;
        return res;
      },
    } as any;

    (handler as any).handle(req, res);

    expect(jsonResult).toEqual({
      apiKey: "test-api-key",
      authDomain: "test.firebaseapp.com",
      projectId: "test-project",
      storageBucket: "test.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123:web:abc",
      measurementId: "G-TEST123",
    });

    process.env = originalEnv;
  });

  it("falls back to VITE_FIREBASE_* environment variables if non-VITE keys are omitted", async () => {
    const originalEnv = { ...process.env };
    delete process.env.FIREBASE_API_KEY;
    delete process.env.FIREBASE_AUTH_DOMAIN;
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_STORAGE_BUCKET;
    delete process.env.FIREBASE_MESSAGING_SENDER_ID;
    delete process.env.FIREBASE_APP_ID;
    delete process.env.FIREBASE_MEASUREMENT_ID;

    process.env.VITE_FIREBASE_API_KEY = "vite-api-key";
    process.env.VITE_FIREBASE_AUTH_DOMAIN = "vite.firebaseapp.com";
    process.env.VITE_FIREBASE_PROJECT_ID = "vite-project";
    process.env.VITE_FIREBASE_STORAGE_BUCKET = "vite.appspot.com";
    process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = "987654321";
    process.env.VITE_FIREBASE_APP_ID = "1:987:web:xyz";
    process.env.VITE_FIREBASE_MEASUREMENT_ID = "G-VITE123";

    let jsonResult: any = null;
    const req = { method: "GET", url: "/api/config", headers: {} } as any;
    const res = {
      setHeader: () => res,
      end: () => res,
      json: (data: any) => {
        jsonResult = data;
        return res;
      },
    } as any;

    (handler as any).handle(req, res);

    expect(jsonResult).toEqual({
      apiKey: "vite-api-key",
      authDomain: "vite.firebaseapp.com",
      projectId: "vite-project",
      storageBucket: "vite.appspot.com",
      messagingSenderId: "987654321",
      appId: "1:987:web:xyz",
      measurementId: "G-VITE123",
    });

    process.env = originalEnv;
  });
});
