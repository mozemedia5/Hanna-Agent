export type HannaTier = "lite" | "pro";
export const DAILY_TOKEN_LIMITS: Record<HannaTier, number> = { lite: 300, pro: 1500 };
type Usage = { day: string; tokens: number };
const usage = new Map<string, Usage>();
const today = () => new Date().toISOString().slice(0, 10);
export function getTierLimit(tier: HannaTier) { return DAILY_TOKEN_LIMITS[tier]; }
export function getDailyQuota(uid: string, tier: HannaTier) {
  const key = `${uid}:${tier}`;
  const day = today();
  const current = usage.get(key)?.day === day ? usage.get(key)! : { day, tokens: 0 };
  const limit = getTierLimit(tier);
  return {
    used: current.tokens,
    limit,
    remaining: Math.max(0, limit - current.tokens),
    resetAt: `${day}T23:59:59.999Z`,
  };
}

export function consumeDailyTokens(uid: string, requestedTokens: number, tier: HannaTier) {
  const key = `${uid}:${tier}`; const day = today(); const current = usage.get(key)?.day === day ? usage.get(key)! : { day, tokens: 0 }; const limit = getTierLimit(tier); const next = current.tokens + Math.max(1, requestedTokens);
  if (next > limit) return { allowed: false as const, used: current.tokens, limit, remaining: Math.max(0, limit - current.tokens), resetAt: `${day}T23:59:59.999Z` };
  usage.set(key, { day, tokens: next }); return { allowed: true as const, used: next, limit, remaining: limit - next, resetAt: `${day}T23:59:59.999Z` };
}
export function resetUsageForTests() { usage.clear(); }
