import { getUserByOpenId } from "./db";

export function deriveUserId(uid: string): number {
  let hash = 0;
  for (let i = 0; i < uid.length; i += 1) {
    hash = ((hash << 5) - hash + uid.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

/**
 * Resolves any user identity representation (Firebase openId string, numeric application ID, or numeric string)
 * into a single canonical application user ID string (e.g., "42" or "8101").
 */
export async function resolveCanonicalUserId(userIdOrOpenId: string | number): Promise<string> {
  if (typeof userIdOrOpenId === "number") {
    return String(userIdOrOpenId);
  }

  const str = String(userIdOrOpenId).trim();
  if (!str) {
    throw new Error("Invalid empty user identity.");
  }

  // If already a numeric string (e.g. "42" or "8101"), return directly
  if (/^\d+$/.test(str)) {
    return str;
  }

  // Otherwise, it's a Firebase Auth UID / openId string (e.g. "firebase_abc123")
  try {
    const dbUser = await getUserByOpenId(str);
    if (dbUser?.id !== undefined && dbUser.id !== null) {
      return String(dbUser.id);
    }
  } catch (err) {
    console.warn("[UserResolver] Database lookup failed for openId, falling back to derived ID:", err);
  }

  // Fallback to deriveUserId numeric hash string
  return String(deriveUserId(str));
}
