import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
};

let authInstance: Auth | null = null;

export function initializeFirebase(config: FirebaseClientConfig) {
  const app: FirebaseApp = getApps().length ? getApp() : initializeApp(config);
  authInstance = getAuth(app);
  return authInstance;
}

export function getFirebaseAuth() {
  return authInstance;
}

export async function loadFirebaseConfig(): Promise<FirebaseClientConfig> {
  const response = await fetch("/api/config", { credentials: "same-origin" });
  if (!response.ok) throw new Error("Firebase configuration is unavailable.");
  return response.json() as Promise<FirebaseClientConfig>;
}
