import { describe, expect, it } from "vitest";
import {
  createConversationBranch,
  formatConversationHistory,
  type BranchableMessage,
} from "./chatBranches";

type TestMessage = BranchableMessage & { extra?: string };

const conversation = {
  id: 42,
  title: "Original conversation",
  period: "Yesterday",
  messages: [
    { id: "m1", role: "user", content: "First question" },
    { id: "m2", role: "assistant", content: "First answer" },
    {
      id: "m3",
      role: "user",
      content: "Second question",
      attachments: [{ name: "brief.pdf", type: "pdf" }],
    },
    { id: "m4", role: "assistant", content: "Second answer" },
    { id: "m5", role: "user", content: "Later question" },
  ] satisfies TestMessage[],
};

describe("chat branches", () => {
  it("copies all messages through the selected reply and leaves the source untouched", () => {
    const branch = createConversationBranch(conversation, "m4", 100, "Today");

    expect(branch).not.toBeNull();
    expect(branch?.messages.map(message => message.content)).toEqual([
      "First question",
      "First answer",
      "Second question",
      "Second answer",
    ]);
    expect(branch?.messages[2].attachments).toEqual([
      { name: "brief.pdf", type: "pdf" },
    ]);
    expect(branch?.messages[0].id).toBe("100-branch-0");
    expect(branch?.parentConversationId).toBe("42");
    expect(branch?.branchedFromMessageId).toBe("m4");
    expect(conversation.messages).toHaveLength(5);
    expect(conversation.messages[0].id).toBe("m1");
  });

  it("returns null for a message that is not in the conversation", () => {
    expect(createConversationBranch(conversation, "missing", 100)).toBeNull();
  });

  it("formats every historical message in chronological order, including attachments", () => {
    const context = formatConversationHistory(conversation.messages);

    expect(context).toContain("First question");
    expect(context).toContain("Second answer");
    expect(context).toContain("Later question");
    expect(context).toContain("Attachments: brief.pdf (pdf)");
    expect(context?.indexOf("First question")).toBeLessThan(
      context?.indexOf("Later question") ?? 0
    );
  });

  it("returns no context for an empty conversation", () => {
    expect(formatConversationHistory([])).toBeUndefined();
  });
});
