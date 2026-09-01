export type ConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  time?: string;
  tokenCount?: number;
};
export type ConversationRecord = {
  id: string;
  title: string;
  period: string;
  messages: ConversationMessage[];
  createdAt?: string;
  updatedAt?: string;
};
export type ProfileRecord = {
  displayName: string;
  photoURL: string;
  bio: string;
  jobTitle: string;
  updatedAt?: string;
};
const conversations = new Map<string, Map<string, ConversationRecord>>();
const profiles = new Map<string, ProfileRecord>();
const now = () => new Date().toISOString();
export async function listConversations(
  uid: string
): Promise<ConversationRecord[]> {
  return Array.from(conversations.get(uid)?.values() ?? []).sort((a, b) =>
    (b.updatedAt || "").localeCompare(a.updatedAt || "")
  );
}
export async function saveConversation(
  uid: string,
  conversation: ConversationRecord
) {
  const bucket =
    conversations.get(uid) ?? new Map<string, ConversationRecord>();
  const existing = bucket.get(conversation.id);
  const saved = {
    ...conversation,
    createdAt: conversation.createdAt || existing?.createdAt || now(),
    updatedAt: now(),
  };
  bucket.set(conversation.id, saved);
  conversations.set(uid, bucket);
  return saved;
}
export async function deleteConversation(uid: string, id: string) {
  conversations.get(uid)?.delete(id);
  return { success: true as const };
}
export async function getAnalytics(uid: string) {
  const rows = await listConversations(uid);
  const estimate = (message: ConversationMessage) =>
    message.tokenCount ?? Math.max(1, Math.ceil(message.content.length / 4));
  const messages = rows.flatMap(row => row.messages);
  const daily = new Map<
    string,
    { date: string; messages: number; tokens: number }
  >();
  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    daily.set(key, { date: key, messages: 0, tokens: 0 });
  }
  rows.forEach(row => {
    const bucket = daily.get((row.updatedAt || now()).slice(0, 10));
    if (bucket) {
      bucket.messages += row.messages.length;
      bucket.tokens += row.messages.reduce(
        (total, message) => total + estimate(message),
        0
      );
    }
  });
  return {
    totalConversations: rows.length,
    totalMessages: messages.length,
    userMessages: messages.filter(message => message.role === "user").length,
    assistantMessages: messages.filter(message => message.role === "assistant")
      .length,
    estimatedTokens: messages.reduce(
      (total, message) => total + estimate(message),
      0
    ),
    activeDays: new Set(rows.map(row => (row.updatedAt || now()).slice(0, 10)))
      .size,
    daily: Array.from(daily.values()),
    topConversations: rows
      .slice()
      .sort((a, b) => b.messages.length - a.messages.length)
      .slice(0, 5)
      .map(row => ({
        id: row.id,
        title: row.title,
        messages: row.messages.length,
        tokens: row.messages.reduce(
          (total, message) => total + estimate(message),
          0
        ),
      })),
  };
}
export async function getProfile(uid: string): Promise<ProfileRecord> {
  return (
    profiles.get(uid) ?? {
      displayName: "",
      photoURL: "",
      bio: "",
      jobTitle: "",
    }
  );
}
export async function saveProfile(uid: string, profile: ProfileRecord) {
  const saved = { ...profile, updatedAt: now() };
  profiles.set(uid, saved);
  return saved;
}
