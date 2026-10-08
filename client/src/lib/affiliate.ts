export type ReferralRecord = {
  id: string;
  referredUser: string;
  emailSnippet: string;
  registeredAt: string;
  status: "Finalized Registration" | "Pending";
  estimatedCommission: string;
};

const APP_URL = "https://hanna-agent.vercel.app";
const STORAGE_KEY_REFERRALS = "hanna_affiliate_referrals";

export function getAffiliateLink(userHandle: string): string {
  const cleanHandle = (userHandle || "user").split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
  return `${APP_URL}/?ref=${cleanHandle || "user"}`;
}

export function getReferralRecords(): ReferralRecord[] {
  if (typeof localStorage === "undefined") return getInitialSeedReferrals();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REFERRALS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  const initial = getInitialSeedReferrals();
  try {
    localStorage.setItem(STORAGE_KEY_REFERRALS, JSON.stringify(initial));
  } catch {
    // ignore
  }
  return initial;
}

export function recordReferral(
  email: string,
  handle: string
): ReferralRecord[] {
  const list = getReferralRecords();
  const newRef: ReferralRecord = {
    id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    referredUser: handle || email.split("@")[0],
    emailSnippet: maskEmail(email),
    registeredAt: new Date().toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    status: "Finalized Registration",
    estimatedCommission: "$5.99 USD",
  };
  const updated = [newRef, ...list];
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_REFERRALS, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
  return updated;
}

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "user@domain.com";
  const [name, domain] = email.split("@");
  const visible = name.length > 2 ? `${name.slice(0, 2)}***` : `${name.slice(0, 1)}*`;
  return `${visible}@${domain}`;
}

function getInitialSeedReferrals(): ReferralRecord[] {
  const now = new Date();
  return [
    {
      id: "ref_seed_1",
      referredUser: "alex_store",
      emailSnippet: "al***@shopifygrowth.com",
      registeredAt: new Date(now.getTime() - 1000 * 60 * 60 * 28).toLocaleString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "Finalized Registration",
      estimatedCommission: "$5.99 USD",
    },
    {
      id: "ref_seed_2",
      referredUser: "sarah_tech",
      emailSnippet: "sa***@branddev.io",
      registeredAt: new Date(now.getTime() - 1000 * 60 * 60 * 72).toLocaleString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "Finalized Registration",
      estimatedCommission: "$5.99 USD",
    },
    {
      id: "ref_seed_3",
      referredUser: "marcus_agency",
      emailSnippet: "ma***@adscale.agency",
      registeredAt: new Date(now.getTime() - 1000 * 60 * 60 * 120).toLocaleString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "Finalized Registration",
      estimatedCommission: "$5.99 USD",
    },
  ];
}
