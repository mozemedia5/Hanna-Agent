import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};
import { getUserByOpenId } from "../db";

type FirebaseDecodedToken = {
  iss?: string;
  aud?: string;
  sub?: string;
  user_id?: string;
  exp?: number;
  iat?: number;
  email?: string;
  name?: string;
  firebase?: { sign_in_provider?: string };
};

export function parseAndVerifyFirebaseToken(token: string): FirebaseDecodedToken | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payloadRaw = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload: FirebaseDecodedToken = JSON.parse(payloadRaw);

    const nowSec = Math.floor(Date.now() / 1000);

    // Reject expired tokens
    if (typeof payload.exp === "number" && payload.exp <= nowSec) {
      return null;
    }

    // Reject tokens issued in the future (with 300s clock skew tolerance)
    if (typeof payload.iat === "number" && payload.iat > nowSec + 300) {
      return null;
    }

    // Reject tokens with mismatched audience or issuer when project ID is configured
    const configuredProjectId = (
      process.env.FIREBASE_PROJECT_ID ||
      process.env.VITE_FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      ""
    ).trim();

    if (configuredProjectId) {
      if (payload.aud !== configuredProjectId) {
        return null;
      }
      const expectedIss = `https://securetoken.google.com/${configuredProjectId}`;
      if (payload.iss && payload.iss !== expectedIss) {
        return null;
      }
    }

    const uid = payload.user_id || payload.sub;
    if (!uid || typeof uid !== "string" || !uid.trim()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function deriveUserId(uid: string): number {
  let hash = 0;
  for (let i = 0; i < uid.length; i += 1) {
    hash = ((hash << 5) - hash + uid.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const header = opts.req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  const decoded = token ? parseAndVerifyFirebaseToken(token) : null;
  const uid = decoded?.user_id || decoded?.sub;

  if (!uid) {
    return { req: opts.req, res: opts.res, user: null };
  }

  const dbUser = await getUserByOpenId(uid).catch(() => undefined);

  const user: User = dbUser ?? {
    id: deriveUserId(uid),
    openId: uid,
    name: decoded?.name ?? decoded?.email ?? "Hanna user",
    email: decoded?.email ?? null,
    loginMethod: decoded?.firebase?.sign_in_provider ?? "firebase",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return { req: opts.req, res: opts.res, user };
}
