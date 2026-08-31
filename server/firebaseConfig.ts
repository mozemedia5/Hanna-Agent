export type FirebasePublicConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
};

const firstEnv = (...names: string[]) => names.map((name) => process.env[name]?.trim()).find(Boolean) ?? "";

export function getFirebasePublicConfig(): FirebasePublicConfig {
  return {
    apiKey: firstEnv("FIREBASE_API_KEY", "VITE_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: firstEnv("FIREBASE_AUTH_DOMAIN", "VITE_FIREBASE_AUTH_DOMAIN", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: firstEnv("FIREBASE_PROJECT_ID", "VITE_FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: firstEnv("FIREBASE_STORAGE_BUCKET", "VITE_FIREBASE_STORAGE_BUCKET", "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: firstEnv("FIREBASE_MESSAGING_SENDER_ID", "VITE_FIREBASE_MESSAGING_SENDER_ID", "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    appId: firstEnv("FIREBASE_APP_ID", "VITE_FIREBASE_APP_ID", "NEXT_PUBLIC_FIREBASE_APP_ID"),
    measurementId: firstEnv("FIREBASE_MEASUREMENT_ID", "VITE_FIREBASE_MEASUREMENT_ID", "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"),
  };
}

export function missingFirebaseConfigFields(config: FirebasePublicConfig) {
  return (["apiKey", "authDomain", "projectId", "appId"] as const).filter((key) => !config[key]);
}
