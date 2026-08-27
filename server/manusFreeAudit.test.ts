import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const activeEntrypoints = [
  "api/index.ts",
  "server/_core/index.ts",
  "server/_core/context.ts",
  "server/routers.ts",
  "server/agentCore.ts",
  "server/providerAdapters.ts",
  "server/providerDb.ts",
  "server/settingsDb.ts",
  "client/src/main.tsx",
  "client/src/pages/Home.tsx",
];

const forbiddenRuntimeReferences = [
  "invokeLLM",
  "manus-cookie",
  "startLogin",
  "getSessionCookieOptions",
  "BUILT_IN_FORGE_API",
  "OAUTH_SERVER_URL",
  "./_core/llm",
  "./_core/oauth",
  "./_core/sdk",
  "./_core/storageProxy",
  "./_core/systemRouter",
];

describe("Manus-free runtime audit", () => {
  it("keeps active entrypoints independent of legacy Manus runtime modules", () => {
    const source = activeEntrypoints
      .map(path => readFileSync(path, "utf8"))
      .join("\n");

    for (const reference of forbiddenRuntimeReferences) {
      expect(source, `unexpected legacy reference: ${reference}`).not.toContain(reference);
    }
  });
});
