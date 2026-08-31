import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";

export type TrpcContext = { req: CreateExpressContextOptions["req"]; res: CreateExpressContextOptions["res"]; user: User | null };
function decodePayload(token: string): { user_id?: string; sub?: string; email?: string; name?: string; firebase?: { sign_in_provider?: string } } | null {
  try { const part = token.split(".")[1]; return part ? JSON.parse(Buffer.from(part, "base64url").toString("utf8")) : null; } catch { return null; }
}
export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  const header = opts.req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  const decoded = token ? decodePayload(token) : null;
  const uid = decoded?.user_id || decoded?.sub;
  const user = uid ? { id: Math.abs(uid.split("").reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0)) || 1, openId: uid, name: decoded?.name ?? decoded?.email ?? "Hanna user", email: decoded?.email ?? null, loginMethod: decoded?.firebase?.sign_in_provider ?? "firebase", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } : null;
  return { req: opts.req, res: opts.res, user };
}
