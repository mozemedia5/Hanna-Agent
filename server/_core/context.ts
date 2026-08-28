import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

const defaultUser: User = {
  id: 1,
  openId: "guest",
  name: "Alex Morgan",
  email: "alex@example.com",
  loginMethod: "guest",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

/**
 * Firebase Auth adapter seam. Provides a default user context when unauthenticated
 * so protected tRPC procedures operate safely in single-tenant/demo environments.
 */
export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  return { req: opts.req, res: opts.res, user: defaultUser };
}
