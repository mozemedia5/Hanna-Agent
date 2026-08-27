import { eq } from "drizzle-orm";
import { workspaceSettings } from "../drizzle/schema";
import { getDb } from "./db";

export async function getWorkspaceSettings(userId: number) {
  const db = await getDb();
  if (!db) return { userId, theme: "light", defaultProvider: "automatic", autoRouting: true };
  const rows = await db.select().from(workspaceSettings).where(eq(workspaceSettings.userId, userId)).limit(1);
  return rows[0] ?? { userId, theme: "light", defaultProvider: "automatic", autoRouting: true };
}

export async function updateWorkspaceSettings(userId: number, values: { theme?: string; defaultProvider?: string; autoRouting?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(workspaceSettings).values({ userId, theme: values.theme ?? "light", defaultProvider: values.defaultProvider ?? "automatic", autoRouting: values.autoRouting ?? true }).onDuplicateKeyUpdate({ set: values });
  return getWorkspaceSettings(userId);
}
