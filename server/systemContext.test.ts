import { describe, expect, it } from "vitest";
import { buildHannaSystemContext } from "./systemContext";
import { saveUserMemory, listUserMemories, getRelevantMemories, deleteUserMemory } from "./memoryDb";

describe("Unified Hanna System Context & Memory Tests", () => {
  it("builds authoritative Hanna system context with identity directives", () => {
    const context = buildHannaSystemContext({
      user: {
        uid: "user_test_123",
        displayName: "Alice Developer",
        email: "alice@example.com",
        tier: "pro",
      },
      settings: {
        responseStyle: "concise",
        tone: "professional",
        studyMode: true,
      },
      integrations: [
        { id: "shopify", name: "Shopify Store", connected: true },
        { id: "github", name: "GitHub", connected: false },
      ],
      modelName: "gemini-3.5-flash",
    });

    expect(context).toContain("YOU ARE HANNA.");
    expect(context).toContain("Alice Developer");
    expect(context).toContain("alice@example.com");
    expect(context).toContain("[CONNECTED] Shopify Store");
    expect(context).toContain("[NOT CONNECTED] GitHub");
    expect(context).toContain("Study Mode / Socratic Mode: ACTIVE");
  });

  it("handles user persistent memories properly", async () => {
    const testUid = `test_user_${Date.now()}`;
    const mem1 = await saveUserMemory(testUid, "User prefers dark mode and TypeScript for code snippets", "preferences");
    const mem2 = await saveUserMemory(testUid, "User Shopify store URL is my-store.myshopify.com", "e-commerce");

    expect(mem1.uid).toBe(testUid);
    expect(mem2.uid).toBe(testUid);

    const allMems = await listUserMemories(testUid);
    expect(allMems.length).toBe(2);

    const relevant = await getRelevantMemories(testUid, "TypeScript code");
    expect(relevant.length).toBeGreaterThan(0);
    expect(relevant[0].content).toContain("TypeScript");

    await deleteUserMemory(testUid, mem1.id);
    const afterDelete = await listUserMemories(testUid);
    expect(afterDelete.length).toBe(1);
    expect(afterDelete[0].id).toBe(mem2.id);
  });
});
