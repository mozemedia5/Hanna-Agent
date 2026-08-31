import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function adminAuth() {
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) return null;
  const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") }), storageBucket: process.env.FIREBASE_STORAGE_BUCKET });
  return getAuth(app);
}
export async function verifyFirebaseToken(token: string) {
  const auth = adminAuth();
  if (!auth) return null;
  try { return await auth.verifyIdToken(token); } catch { return null; }
}
