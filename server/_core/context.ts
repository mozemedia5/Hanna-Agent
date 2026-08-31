import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { verifyFirebaseToken } from "../firebaseAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  const header = opts.req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  const decoded = token ? await verifyFirebaseToken(token) : null;
  const user = decoded ? {
    id: Math.abs(decoded.uid.split("").reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0)) || 1,
    openId: decoded.uid,
    name: decoded.name ?? decoded.email ?? "Hanna user",
    email: decoded.email ?? null,
    loginMethod: decoded.firebase?.sign_in_provider ?? "firebase",
    role: "user" as const,
    createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
  } : null;
  return { req: opts.req, res: opts.res, user };
}
