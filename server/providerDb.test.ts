import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDb } = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => ({ getDb }));

import { deleteProviderCredential, listProviderCredentials, upsertProviderCredential } from "./providerDb";

function makeDb() {
  const saved: any[] = [];
  const db = {
    insert: vi.fn(() => ({ values: vi.fn((value: any) => ({ onDuplicateKeyUpdate: vi.fn(() => { saved.push({ ...value, id: 1 }); }) })) })),
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(async () => saved.map(({ encryptedKey: _encryptedKey, ...row }) => row)) })) })) })),
    delete: vi.fn(() => ({ where: vi.fn(async () => { saved.splice(0); }) })),
  };
  return { db, saved };
}

describe("providerDb CRUD", () => {
  beforeEach(() => getDb.mockReset());

  it("saves encrypted provider data and returns masked metadata", async () => {
    const { db, saved } = makeDb();
    getDb.mockResolvedValue(db);
    const result = await upsertProviderCredential(7, "openai", "OpenAI", "sk-secret-value-1234");
    expect(result.maskedKey).not.toContain("sk-secret-value-1234");
    expect(saved[0].encryptedKey).not.toBe("sk-secret-value-1234");
  });

  it("lists saved providers without returning encrypted keys", async () => {
    const { db, saved } = makeDb();
    saved.push({ id: 1, provider: "gemini", displayName: "Gemini", keyHint: "…1234", isEnabled: true, updatedAt: new Date(), encryptedKey: "ciphertext" });
    getDb.mockResolvedValue(db);
    const result = await listProviderCredentials(7);
    expect(result[0]).toMatchObject({ provider: "gemini", maskedKey: "…1234" });
    expect(JSON.stringify(result)).not.toContain("ciphertext");
  });

  it("removes a user provider credential", async () => {
    const { db } = makeDb();
    getDb.mockResolvedValue(db);
    await expect(deleteProviderCredential(7, "openai")).resolves.toEqual({ success: true });
    expect(db.delete).toHaveBeenCalled();
  });
});
