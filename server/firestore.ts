import crypto from "node:crypto";

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
  customInstructions?: string;
  responseStyle?: "concise" | "standard" | "detailed";
  tone?: "professional" | "friendly" | "technical" | "casual";
  preferredLanguage?: string;
  updatedAt?: string;
};
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let dbInstance: Firestore | null = null;

export function getAdminFirestore(): Firestore | null {
  if (dbInstance) return dbInstance;

  try {
    const apps = getApps();
    if (apps.length > 0) {
      dbInstance = getFirestore(apps[0]);
      return dbInstance;
    }

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

    if (serviceAccountJson) {
      const sa = JSON.parse(serviceAccountJson);
      const app = initializeApp({ credential: cert(sa) });
      dbInstance = getFirestore(app);
      return dbInstance;
    }

    if (projectId && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const app = initializeApp({ projectId });
      dbInstance = getFirestore(app);
      return dbInstance;
    }

    // Default application credentials / environment initialization if available
    if (process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST) {
      const app = initializeApp({ projectId: projectId || "demo-hanna" });
      dbInstance = getFirestore(app);
      return dbInstance;
    }
  } catch (err) {
    console.warn("[AdminFirestore] Initialization skipped or failed:", err instanceof Error ? err.message : err);
  }

  return null;
}

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
  const db = getAdminFirestore();
  if (db) {
    try {
      const snapshot = await db.collection("users").doc(uid).collection("private").doc("profile").get();
      if (snapshot.exists) return snapshot.data() as ProfileRecord;
    } catch (err) {
      console.warn("[Profile] Firestore read failed; using local fallback:", err instanceof Error ? err.message : err);
    }
  }
  return (
    profiles.get(uid) ?? {
      displayName: "",
      photoURL: "",
      bio: "",
      customInstructions: "",
    }
  );
}
export async function saveProfile(uid: string, profile: ProfileRecord) {
  const saved = { ...profile, updatedAt: now() };
  const db = getAdminFirestore();
  if (db) {
    try {
      await db.collection("users").doc(uid).collection("private").doc("profile").set(saved, { merge: true });
    } catch (err) {
      console.warn("[Profile] Firestore write failed; using local fallback:", err instanceof Error ? err.message : err);
    }
  }
  profiles.set(uid, saved);
  return saved;
}

export type UserMemory = {
  id: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
};

const userMemories = new Map<string, Map<string, UserMemory>>();

export async function listUserMemories(uid: string, limit = 100): Promise<UserMemory[]> {
  const db = getAdminFirestore();
  if (db) {
    try {
      const snapshot = await db.collection("users").doc(uid).collection("memories").orderBy("updatedAt", "desc").limit(limit).get();
      return snapshot.docs.map(item => item.data() as UserMemory);
    } catch (err) {
      console.warn("[Memory] Firestore read failed; using local fallback:", err instanceof Error ? err.message : err);
    }
  }
  return Array.from(userMemories.get(uid)?.values() ?? []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit);
}

export async function saveUserMemory(uid: string, content: string, category = "general", id?: string): Promise<UserMemory> {
  const existing = id ? (await listUserMemories(uid, 200)).find(item => item.id === id) : undefined;
  const timestamp = now();
  const memory: UserMemory = { id: id || `mem_${crypto.randomUUID()}`, content, category, createdAt: existing?.createdAt || timestamp, updatedAt: timestamp };
  const db = getAdminFirestore();
  if (db) {
    try {
      await db.collection("users").doc(uid).collection("memories").doc(memory.id).set(memory, { merge: true });
    } catch (err) {
      console.warn("[Memory] Firestore write failed; using local fallback:", err instanceof Error ? err.message : err);
    }
  }
  const bucket = userMemories.get(uid) ?? new Map<string, UserMemory>();
  bucket.set(memory.id, memory);
  userMemories.set(uid, bucket);
  return memory;
}

export async function deleteUserMemory(uid: string, id: string): Promise<boolean> {
  const db = getAdminFirestore();
  if (db) {
    try {
      await db.collection("users").doc(uid).collection("memories").doc(id).delete();
    } catch (err) {
      console.warn("[Memory] Firestore delete failed; using local fallback:", err instanceof Error ? err.message : err);
    }
  }
  userMemories.get(uid)?.delete(id);
  return true;
}

export async function getRelevantUserMemories(uid: string, prompt: string, limit = 5): Promise<UserMemory[]> {
  const all = await listUserMemories(uid, 100);
  const terms = Array.from(new Set(prompt.toLowerCase().match(/[a-z0-9_-]{3,}/g) || []));
  if (!terms.length) return all.slice(0, limit);
  return all.map((memory, index) => {
    const text = `${memory.content} ${memory.category}`.toLowerCase();
    const score = terms.reduce((total, term) => total + (text.includes(term) ? 1 : 0), 0);
    return { memory, score, index };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, limit).map(item => item.memory);
}
