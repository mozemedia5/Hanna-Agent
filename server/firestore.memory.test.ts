import { describe, expect, it } from "vitest";
import { deleteUserMemory, getProfile, getRelevantUserMemories, listUserMemories, saveProfile, saveUserMemory } from "./firestore";

describe("cross-session user profile and memory", () => {
  it("persists response preferences with the user's profile", async () => {
    const uid = `profile-memory-${crypto.randomUUID()}`;
    await saveProfile(uid, {
      displayName: "Avery",
      photoURL: "",
      bio: "",
      customInstructions: "Use TypeScript",
      responseStyle: "concise",
      tone: "technical",
      preferredLanguage: "English",
    });
    await expect(getProfile(uid)).resolves.toMatchObject({
      displayName: "Avery",
      responseStyle: "concise",
      tone: "technical",
      preferredLanguage: "English",
    });
  });

  it("lists, ranks, scopes, and deletes the owner's saved memories", async () => {
    const owner = `memory-owner-${crypto.randomUUID()}`;
    const other = `memory-other-${crypto.randomUUID()}`;
    const typescript = await saveUserMemory(owner, "Use TypeScript for Hanna-Agent UI work", "preference");
    const handoff = await saveUserMemory(owner, "PR 113 uses signed single-use Shopify OAuth state", "handoff");
    await saveUserMemory(other, "Use TypeScript for all work", "preference");

    await expect(listUserMemories(owner)).resolves.toHaveLength(2);
    const relevant = await getRelevantUserMemories(owner, "TypeScript UI", 5);
    expect(relevant.map(item => item.id)).toContain(typescript.id);
    expect(relevant.map(item => item.id)).not.toContain(handoff.id);
    expect(relevant.some(item => item.content.includes("other"))).toBe(false);

    await deleteUserMemory(owner, typescript.id);
    await expect(listUserMemories(owner)).resolves.toHaveLength(1);
    await expect(listUserMemories(other)).resolves.toHaveLength(1);
  });
});
