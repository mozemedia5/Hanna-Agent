import { getFirestore, type Firestore, FieldValue } from "firebase-admin/firestore";
import { getApps } from "firebase-admin/app";
import { cert, initializeApp } from "firebase-admin/app";

export type ConversationMessage = { id: string; role: "user" | "assistant"; content: string; time?: string };
export type ConversationRecord = { id: string; title: string; period: string; messages: ConversationMessage[]; createdAt?: string; updatedAt?: string };
export type ProfileRecord = { displayName: string; photoURL: string; bio: string; jobTitle: string; updatedAt?: string };

let firestore: Firestore | null | undefined;
function getStore() {
  if (firestore !== undefined) return firestore;
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) return (firestore = null);
  const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") }) });
  return (firestore = getFirestore(app));
}
const now = () => new Date().toISOString();

export async function listConversations(uid: string): Promise<ConversationRecord[]> {
  const db = getStore();
  if (!db) return [];
  const snapshot = await db.collection("users").doc(uid).collection("conversations").orderBy("updatedAt", "desc").limit(100).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<ConversationRecord, "id">) }));
}
export async function saveConversation(uid: string, conversation: ConversationRecord) {
  const db = getStore();
  if (!db) return conversation;
  const ref = db.collection("users").doc(uid).collection("conversations").doc(conversation.id);
  const existing = await ref.get();
  await ref.set({ ...conversation, createdAt: conversation.createdAt || (existing.data()?.createdAt ?? now()), updatedAt: now() }, { merge: true });
  return conversation;
}
export async function deleteConversation(uid: string, id: string) {
  const db = getStore();
  if (db) await db.collection("users").doc(uid).collection("conversations").doc(id).delete();
  return { success: true as const };
}
export async function getProfile(uid: string): Promise<ProfileRecord> {
  const db = getStore();
  if (!db) return { displayName: "", photoURL: "", bio: "", jobTitle: "" };
  const snapshot = await db.collection("users").doc(uid).collection("private").doc("profile").get();
  return (snapshot.data() as ProfileRecord | undefined) ?? { displayName: "", photoURL: "", bio: "", jobTitle: "" };
}
export async function saveProfile(uid: string, profile: ProfileRecord) {
  const db = getStore();
  if (db) await db.collection("users").doc(uid).collection("private").doc("profile").set({ ...profile, updatedAt: now() }, { merge: true });
  return { ...profile, updatedAt: now() };
}
