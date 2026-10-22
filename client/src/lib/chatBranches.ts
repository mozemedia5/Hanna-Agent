export type BranchableMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Array<{ name: string; type: string }>;
};

export type BranchableConversation<TMessage extends BranchableMessage> = {
  id: number;
  title: string;
  period: string;
  messages: TMessage[];
};

export function createConversationBranch<TMessage extends BranchableMessage>(
  conversation: BranchableConversation<TMessage>,
  messageId: string,
  branchId: number,
  period = "Today"
) {
  const branchPointIndex = conversation.messages.findIndex(
    message => message.id === messageId
  );
  if (branchPointIndex < 0) return null;

  const branchedMessages = conversation.messages
    .slice(0, branchPointIndex + 1)
    .map((message, index) => ({
      ...message,
      id: `${branchId}-branch-${index}`,
    }));

  return {
    ...conversation,
    id: branchId,
    title: `Branch: ${conversation.title}`.slice(0, 200),
    period,
    messages: branchedMessages,
    parentConversationId: String(conversation.id),
    branchedFromMessageId: messageId,
  };
}

export function formatConversationHistory(
  messages: readonly BranchableMessage[]
): string | undefined {
  if (messages.length === 0) return undefined;

  const history = messages
    .map(message => {
      const speaker = message.role === "user" ? "User" : "Hanna";
      const attachments = message.attachments?.length
        ? `\n[Attachments: ${message.attachments
            .map(attachment => `${attachment.name} (${attachment.type})`)
            .join(", ")}]`
        : "";
      return `${speaker}: ${message.content}${attachments}`;
    })
    .join("\n\n");

  return `[Complete conversation history, oldest first]\n${history}`;
}
