type VercelRequest = { method?: string };
type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (value: unknown) => VercelResponse;
  setHeader: (name: string, value: string) => void;
};

const firstEnv = (...names: string[]) => names.map((name) => process.env[name]?.trim()).find(Boolean) ?? "";

export default function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method && request.method !== "GET") return response.status(405).json({ error: "Method not allowed." });
  const config = {
    apiKey: firstEnv("FIREBASE_API_KEY", "VITE_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: firstEnv("FIREBASE_AUTH_DOMAIN", "VITE_FIREBASE_AUTH_DOMAIN", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: firstEnv("FIREBASE_PROJECT_ID", "VITE_FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: firstEnv("FIREBASE_STORAGE_BUCKET", "VITE_FIREBASE_STORAGE_BUCKET", "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: firstEnv("FIREBASE_MESSAGING_SENDER_ID", "VITE_FIREBASE_MESSAGING_SENDER_ID", "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    appId: firstEnv("FIREBASE_APP_ID", "VITE_FIREBASE_APP_ID", "NEXT_PUBLIC_FIREBASE_APP_ID"),
    measurementId: firstEnv("FIREBASE_MEASUREMENT_ID", "VITE_FIREBASE_MEASUREMENT_ID", "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"),
  };
  const missing = ["apiKey", "authDomain", "projectId", "appId"].filter((key) => !config[key as keyof typeof config]);
  if (missing.length) return response.status(503).json({ error: "Firebase configuration is incomplete.", missing });
  response.setHeader("cache-control", "no-store");
  return response.status(200).json(config);
}
