import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import { getFirebaseAuth, getFirebaseFirestore } from "./firebase";
export type ClientMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  time?: string;
  tokenCount?: number;
};
export type ClientConversation = {
  id: string;
  title: string;
  period: string;
  messages: ClientMessage[];
  createdAt?: string;
  updatedAt?: string;
  parentConversationId?: string;
  branchedFromMessageId?: string;
};
export type ClientProfile = {
  displayName: string;
  photoURL: string;
  bio: string;
  customInstructions?: string;
};
const requireStore = () => {
  const db = getFirebaseFirestore();
  const uid = getFirebaseAuth()?.currentUser?.uid;
  if (!db || !uid) throw new Error("Your Firebase session is not ready.");
  return { db, uid };
};
export async function listUserConversations() {
  const { db, uid } = requireStore();
  const snapshot = await getDocs(
    query(
      collection(db, "users", uid, "conversations"),
      orderBy("updatedAt", "desc")
    )
  );
  return snapshot.docs.map(item => item.data() as ClientConversation);
}

export function subscribeToUserConversations(
  onConversations: (conversations: ClientConversation[]) => void,
  onError?: (error: Error) => void
) {
  const { db, uid } = requireStore();
  const conversations = query(
    collection(db, "users", uid, "conversations"),
    orderBy("updatedAt", "desc")
  );
  return onSnapshot(
    conversations,
    snapshot =>
      onConversations(
        snapshot.docs.map(item => item.data() as ClientConversation)
      ),
    error => onError?.(error)
  );
}

export async function saveUserConversation(conversation: ClientConversation) {
  const { db, uid } = requireStore();
  const ref = doc(db, "users", uid, "conversations", conversation.id);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    const existing = snapshot.data() as Partial<ClientConversation> | undefined;
    const messagesById = new Map(
      (existing?.messages || []).map(message => [message.id, message])
    );
    for (const message of conversation.messages)
      messagesById.set(message.id, message);
    transaction.set(
      ref,
      {
        ...existing,
        ...conversation,
        messages: Array.from(messagesById.values()),
        createdAt:
          existing?.createdAt ||
          conversation.createdAt ||
          new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  });
}

export type ClientProjectFile = {
  id: string;
  name: string;
  type: "pdf" | "image" | "audio" | "video" | "other";
  size: string;
  uploadedAt: string;
  url?: string;
};

export type ClientProjectChat = {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
  isPinned?: boolean;
  isArchived?: boolean;
};

export type ClientProject = {
  id: string;
  name: string;
  description: string;
  instructions: string;
  createdAt: string;
  category: string;
  chats: ClientProjectChat[];
  files: ClientProjectFile[];
  updatedAt?: string;
};

export async function listUserProjects(): Promise<ClientProject[]> {
  try {
    const { db, uid } = requireStore();
    const snapshot = await getDocs(
      query(
        collection(db, "users", uid, "projects"),
        orderBy("updatedAt", "desc")
      )
    );
    return snapshot.docs.map(item => item.data() as ClientProject);
  } catch {
    return [];
  }
}

export async function saveUserProject(project: ClientProject): Promise<void> {
  const { db, uid } = requireStore();
  const ref = doc(db, "users", uid, "projects", project.id);
  await setDoc(
    ref,
    { ...project, updatedAt: new Date().toISOString() },
    { merge: true }
  );
}

export async function deleteUserProject(projectId: string): Promise<void> {
  try {
    const { db, uid } = requireStore();
    const ref = doc(db, "users", uid, "projects", projectId);
    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(ref);
  } catch {
    // Offline or session error fallback
  }
}

export async function deleteUserConversation(conversationId: string) {
  try {
    const { db, uid } = requireStore();
    const ref = doc(db, "users", uid, "conversations", conversationId);
    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(ref);
  } catch {
    // Session offline or unauthenticated fallback
  }
}
export async function getUserProfile() {
  const { db, uid } = requireStore();
  const authUser = getFirebaseAuth()?.currentUser;
  const snapshot = await getDocs(
    query(collection(db, "users", uid, "private"))
  );
  const profile = snapshot.docs.find(item => item.id === "profile")?.data() as
    | ClientProfile
    | undefined;
  return {
    displayName: profile?.displayName || authUser?.displayName || "",
    photoURL: profile?.photoURL || authUser?.photoURL || "",
    bio: profile?.bio || "",
    customInstructions: profile?.customInstructions || "",
  };
}
export async function saveUserProfile(profile: ClientProfile) {
  const { db, uid } = requireStore();
  await setDoc(
    doc(db, "users", uid, "private", "profile"),
    { ...profile, updatedAt: new Date().toISOString() },
    { merge: true }
  );
}
export function calculateConversationAnalytics(
  conversations: ClientConversation[]
) {
  const messages = conversations.flatMap(item => item.messages);
  const tokens = (message: ClientMessage) =>
    message.tokenCount ?? Math.max(1, Math.ceil(message.content.length / 4));
  const byDate = new Map<
    string,
    { date: string; messages: number; tokens: number }
  >();
  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    byDate.set(key, { date: key, messages: 0, tokens: 0 });
  }
  conversations.forEach(item => {
    const bucket = byDate.get((item.updatedAt || "").slice(0, 10));
    if (bucket) {
      bucket.messages += item.messages.length;
      bucket.tokens += item.messages.reduce(
        (sum, message) => sum + tokens(message),
        0
      );
    }
  });
  return {
    totalConversations: conversations.length,
    totalMessages: messages.length,
    userMessages: messages.filter(message => message.role === "user").length,
    assistantMessages: messages.filter(message => message.role === "assistant")
      .length,
    estimatedTokens: messages.reduce(
      (sum, message) => sum + tokens(message),
      0
    ),
    activeDays: new Set(
      conversations.map(item => (item.updatedAt || "").slice(0, 10))
    ).size,
    daily: Array.from(byDate.values()),
    topConversations: conversations
      .slice()
      .sort((a, b) => b.messages.length - a.messages.length)
      .slice(0, 5)
      .map(item => ({
        id: item.id,
        title: item.title,
        messages: item.messages.length,
        tokens: item.messages.reduce(
          (sum, message) => sum + tokens(message),
          0
        ),
      })),
  };
}
