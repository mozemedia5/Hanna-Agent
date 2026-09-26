export type HannaTier = "free" | "lite" | "pro" | "max" | "enterprise";

/** Daily credit budgets (token-equivalent units) per tier */
export const DAILY_TOKEN_LIMITS: Record<HannaTier, number> = {
  free: 2500,
  lite: 8000,
  pro: 40000,
  max: 120000,
  enterprise: 500000,
};

type Usage = { day: string; tokens: number };
const usage = new Map<string, Usage>();

const today = () => new Date().toISOString().slice(0, 10);

export function getTierLimit(tier: HannaTier) {
  return DAILY_TOKEN_LIMITS[tier];
}

export function resolveTierFromModel(model?: string): HannaTier {
  const m = (model || "").toLowerCase();
  if (m.includes("enterprise")) return "enterprise";
  if (m.includes("max") || m.includes("ultra")) return "max";
  if (m.includes("pro") || m.includes("advanced")) return "pro";
  if (m.includes("lite") || m.includes("fast")) return "lite";
  return "free";
}

export function estimatePromptCredits(prompt: string, context?: string): number {
  const chars = (prompt?.length || 0) + (context?.length || 0);
  // ~4 chars per token; minimum 8 credits per turn
  return Math.max(8, Math.ceil(chars / 4));
}

export function getDailyQuota(uid: string, tier: HannaTier) {
  const key = `${uid}:${tier}`;
  const day = today();
  const current =
    usage.get(key)?.day === day ? usage.get(key)! : { day, tokens: 0 };
  const limit = getTierLimit(tier);
  return {
    used: current.tokens,
    limit,
    remaining: Math.max(0, limit - current.tokens),
    resetAt: `${day}T23:59:59.999Z`,
    tier,
  };
}

export function consumeDailyTokens(
  uid: string,
  requestedTokens: number,
  tier: HannaTier
) {
  const key = `${uid}:${tier}`;
  const day = today();
  const current =
    usage.get(key)?.day === day ? usage.get(key)! : { day, tokens: 0 };
  const limit = getTierLimit(tier);
  const cost = Math.max(1, requestedTokens);
  const next = current.tokens + cost;
  if (next > limit) {
    return {
      allowed: false as const,
      used: current.tokens,
      limit,
      remaining: Math.max(0, limit - current.tokens),
      resetAt: `${day}T23:59:59.999Z`,
      tier,
    };
  }
  usage.set(key, { day, tokens: next });
  return {
    allowed: true as const,
    used: next,
    limit,
    remaining: limit - next,
    resetAt: `${day}T23:59:59.999Z`,
    tier,
  };
}

export function resetUsageForTests() {
  usage.clear();
}
