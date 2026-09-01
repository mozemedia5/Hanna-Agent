import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
};

let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;

export function initializeFirebase(config: FirebaseClientConfig) {
  const app: FirebaseApp = getApps().length ? getApp() : initializeApp(config);
  authInstance = getAuth(app);
  firestoreInstance = getFirestore(app);
  return authInstance;
}

export function getFirebaseAuth() {
  return authInstance;
}
export function getFirebaseFirestore() {
  return firestoreInstance;
}

const isCompleteConfig = (
  config: Partial<FirebaseClientConfig>
): config is FirebaseClientConfig =>
  Boolean(
    config.apiKey && config.authDomain && config.projectId && config.appId
  );
const browserConfig = (): Partial<FirebaseClientConfig> => ({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim(),
});

export async function loadFirebaseConfig(): Promise<FirebaseClientConfig> {
  let endpointError = "";
  try {
    const response = await fetch("/api/config", {
      credentials: "same-origin",
      cache: "no-store",
    });
    const payload = (await response
      .json()
      .catch(() => ({}))) as Partial<FirebaseClientConfig> & {
      error?: string;
      missing?: string[];
    };
    if (response.ok && isCompleteConfig(payload)) return payload;
    endpointError =
      payload.error || `Config endpoint returned HTTP ${response.status}.`;
  } catch (reason) {
    endpointError =
      reason instanceof Error
        ? reason.message
        : "Config endpoint could not be reached.";
  }
  const fallback = browserConfig();
  if (isCompleteConfig(fallback)) return fallback;
  throw new Error(
    `Firebase configuration is unavailable. ${endpointError || "Set FIREBASE_* variables in Vercel."}`
  );
}
