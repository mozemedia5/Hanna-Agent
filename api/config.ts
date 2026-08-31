import { getFirebasePublicConfig, missingFirebaseConfigFields } from "../server/firebaseConfig";

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (value: unknown) => VercelResponse;
  setHeader: (name: string, value: string) => void;
};

export default function handler(_request: unknown, response: VercelResponse) {
  const config = getFirebasePublicConfig();
  const missing = missingFirebaseConfigFields(config);
  if (missing.length) return response.status(503).json({ error: "Firebase configuration is incomplete.", missing });
  response.setHeader("cache-control", "no-store");
  return response.status(200).json(config);
}
