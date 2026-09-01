import { describe, expect, it } from "vitest";
import {
  assertFirebaseBackend,
  type FirebaseBackend,
} from "./firebaseContracts";

describe("Firebase backend contract", () => {
  it("fails closed when the custom backend is not configured", () => {
    expect(() => assertFirebaseBackend(undefined)).toThrow(
      "Firebase backend is not configured"
    );
  });

  it("accepts an adapter with auth, secret, and storage capabilities", () => {
    const backend: FirebaseBackend = {
      authenticate: async () => ({ id: "user-1" }),
      getSecret: async () => null,
      saveSecret: async () => undefined,
      deleteSecret: async () => undefined,
      putFile: async () => ({ path: "files/demo.txt" }),
    };
    expect(() => assertFirebaseBackend(backend)).not.toThrow();
  });
});
