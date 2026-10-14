import {
  doc,
  onSnapshot,
  runTransaction,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseAuth, getFirebaseFirestore } from "./firebase";

export type CreditTransaction = {
  id: string;
  timestamp: string;
  taskType:
    | "Huge / Complex Task"
    | "Standard Task"
    | "Simple Task"
    | "Credit Top-Up";
  promptSnippet: string;
  creditsDeducted: number;
  remainingCredits: number;
};

export const WEEKLY_CREDIT_GRANT = 2500;
const STORAGE_KEY_CREDITS = "hanna_user_credits";
const STORAGE_KEY_HISTORY = "hanna_credit_history";
let activeCreditUserId: string | null = null;

export function setCreditAccountUser(uid: string | null) {
  activeCreditUserId = uid;
}
export function getActiveCreditUserId() {
  return activeCreditUserId;
}

/** ISO-week anchor: Monday at 00:00 UTC. */
export function getUtcWeekKey(now: Date = new Date()): string {
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

export function millisecondsUntilNextUtcWeek(now: Date = new Date()): number {
  const nextMonday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const daysUntilMonday = (8 - nextMonday.getUTCDay()) % 7 || 7;
  nextMonday.setUTCDate(nextMonday.getUTCDate() + daysUntilMonday);
  return Math.max(1, nextMonday.getTime() - now.getTime());
}

const creditDocument = (uid: string) => {
  const authUid = getFirebaseAuth()?.currentUser?.uid;
  const db = getFirebaseFirestore();
  if (!db || authUid !== uid)
    throw new Error("Your Firebase session is not ready for account credits.");
  return { db, ref: doc(db, "users", uid, "private", "account") };
};

function cacheCredits(amount: number, uid?: string | null, dispatch = false) {
  if (typeof localStorage === "undefined") return;
  const key = uid ? `${STORAGE_KEY_CREDITS}:${uid}` : STORAGE_KEY_CREDITS;
  localStorage.setItem(key, String(Math.max(0, Math.round(amount))));
  if (dispatch && typeof window !== "undefined")
    window.dispatchEvent(new Event("hanna_credits_updated"));
}

export function getUserCredits(
  uid: string | null = activeCreditUserId
): number {
  if (typeof localStorage === "undefined") return WEEKLY_CREDIT_GRANT;
  const key = uid ? `${STORAGE_KEY_CREDITS}:${uid}` : STORAGE_KEY_CREDITS;
  const stored = localStorage.getItem(key);
  return stored !== null && !isNaN(Number(stored))
    ? Number(stored)
    : WEEKLY_CREDIT_GRANT;
}

/** Local display cache only. Signed-in mutations use the Firestore transactions below. */
export function saveUserCredits(
  amount: number,
  uid: string | null = activeCreditUserId
): number {
  const sanitized = Math.max(0, Math.round(amount));
  cacheCredits(sanitized, uid, true);
  return sanitized;
}

export async function getWeeklyAccountCredits(uid: string): Promise<number> {
  const { db, ref } = creditDocument(uid);
  const weekKey = getUtcWeekKey();
  const balance = await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data();
    if (
      data?.weeklyCreditWeek === weekKey &&
      typeof data.weeklyCreditBalance === "number"
    )
      return Math.max(0, Math.floor(data.weeklyCreditBalance));
    transaction.set(
      ref,
      {
        weeklyCreditBalance: WEEKLY_CREDIT_GRANT,
        weeklyCreditWeek: weekKey,
        weeklyCreditsUpdatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return WEEKLY_CREDIT_GRANT;
  });
  cacheCredits(balance, uid, true);
  return balance;
}

export async function reserveWeeklyAccountCredits(
  uid: string,
  amount: number
): Promise<{ allowed: boolean; balance: number }> {
  const { db, ref } = creditDocument(uid);
  const cost = Math.max(0, Math.floor(amount));
  const weekKey = getUtcWeekKey();
  const result = await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data();
    const current =
      data?.weeklyCreditWeek === weekKey &&
      typeof data.weeklyCreditBalance === "number"
        ? Math.max(0, Math.floor(data.weeklyCreditBalance))
        : WEEKLY_CREDIT_GRANT;
    if (current < cost) {
      if (data?.weeklyCreditWeek !== weekKey)
        transaction.set(
          ref,
          {
            weeklyCreditBalance: current,
            weeklyCreditWeek: weekKey,
            weeklyCreditsUpdatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      return { allowed: false, balance: current };
    }
    const balance = current - cost;
    transaction.set(
      ref,
      {
        weeklyCreditBalance: balance,
        weeklyCreditWeek: weekKey,
        weeklyCreditsUpdatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return { allowed: true, balance };
  });
  cacheCredits(result.balance, uid, true);
  return result;
}

export async function refundWeeklyAccountCredits(
  uid: string,
  amount: number
): Promise<number> {
  const { db, ref } = creditDocument(uid);
  const refund = Math.max(0, Math.floor(amount));
  const weekKey = getUtcWeekKey();
  const balance = await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data();
    // A prior week's reservation must not inflate this week's newly granted balance.
    const current =
      data?.weeklyCreditWeek === weekKey &&
      typeof data.weeklyCreditBalance === "number"
        ? Math.max(0, Math.floor(data.weeklyCreditBalance))
        : WEEKLY_CREDIT_GRANT;
    const next =
      data?.weeklyCreditWeek === weekKey ? current + refund : current;
    transaction.set(
      ref,
      {
        weeklyCreditBalance: next,
        weeklyCreditWeek: weekKey,
        weeklyCreditsUpdatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return next;
  });
  cacheCredits(balance, uid, true);
  return balance;
}

/** Applies the existing top-up flow atomically across devices. */
export async function addWeeklyAccountCredits(
  uid: string,
  amount: number
): Promise<number> {
  const { db, ref } = creditDocument(uid);
  const addition = Math.max(0, Math.floor(amount));
  const weekKey = getUtcWeekKey();
  const balance = await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data();
    const current =
      data?.weeklyCreditWeek === weekKey &&
      typeof data.weeklyCreditBalance === "number"
        ? Math.max(0, Math.floor(data.weeklyCreditBalance))
        : WEEKLY_CREDIT_GRANT;
    const next = current + addition;
    transaction.set(
      ref,
      {
        weeklyCreditBalance: next,
        weeklyCreditWeek: weekKey,
        weeklyCreditsUpdatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return next;
  });
  cacheCredits(balance, uid, true);
  return balance;
}

export function subscribeToWeeklyAccountCredits(
  uid: string,
  onBalance: (balance: number) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const { db, ref } = creditDocument(uid);
  return onSnapshot(
    ref,
    snapshot => {
      const data = snapshot.data();
      if (
        data?.weeklyCreditWeek !== getUtcWeekKey() ||
        typeof data.weeklyCreditBalance !== "number"
      ) {
        void getWeeklyAccountCredits(uid)
          .then(onBalance)
          .catch(reason =>
            onError?.(
              reason instanceof Error ? reason : new Error(String(reason))
            )
          );
        return;
      }
      const balance = Math.max(0, Math.floor(data.weeklyCreditBalance));
      cacheCredits(balance, uid, true);
      onBalance(balance);
    },
    reason => onError?.(reason)
  );
}

export function calculateTaskCredits(
  prompt: string,
  options?: {
    agenticMode?: boolean;
    hasDeepResearch?: boolean;
    hasStudyMode?: boolean;
    hasMultipleTools?: boolean;
  }
): { credits: number; taskType: CreditTransaction["taskType"] } {
  const textLength = prompt.trim().length;
  const isHuge =
    Boolean(options?.agenticMode) ||
    Boolean(options?.hasDeepResearch) ||
    Boolean(options?.hasStudyMode) ||
    Boolean(options?.hasMultipleTools) ||
    textLength > 250;
  if (isHuge) return { credits: 20, taskType: "Huge / Complex Task" };
  if (textLength < 50) return { credits: 2, taskType: "Simple Task" };
  return { credits: 5, taskType: "Standard Task" };
}

export function getCreditHistory(
  uid: string | null = activeCreditUserId
): CreditTransaction[] {
  if (typeof localStorage === "undefined") return getInitialSeedHistory();
  const key = uid ? `${STORAGE_KEY_HISTORY}:${uid}` : STORAGE_KEY_HISTORY;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* fallback */
  }
  const initial = getInitialSeedHistory();
  try {
    localStorage.setItem(key, JSON.stringify(initial));
  } catch {
    /* ignore quota error */
  }
  return initial;
}

export function recordCreditTransaction(
  taskType: CreditTransaction["taskType"],
  promptSnippet: string,
  creditsDeducted: number,
  remainingCredits: number,
  uid: string | null = activeCreditUserId
): CreditTransaction[] {
  const history = getCreditHistory(uid);
  const newTx: CreditTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    taskType,
    promptSnippet: promptSnippet.slice(0, 45) || "Workspace execution",
    creditsDeducted,
    remainingCredits,
  };
  const updated = [newTx, ...history].slice(0, 50);
  if (typeof localStorage !== "undefined") {
    const key = uid ? `${STORAGE_KEY_HISTORY}:${uid}` : STORAGE_KEY_HISTORY;
    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event("hanna_credits_updated"));
  }
  return updated;
}

function getInitialSeedHistory(): CreditTransaction[] {
  const now = Date.now();
  return [
    {
      id: "tx_seed_1",
      timestamp: new Date(now - 900000).toISOString(),
      taskType: "Huge / Complex Task",
      promptSnippet: "Deep market analysis & Shopify store audit",
      creditsDeducted: 20,
      remainingCredits: 2480,
    },
    {
      id: "tx_seed_2",
      timestamp: new Date(now - 7200000).toISOString(),
      taskType: "Standard Task",
      promptSnippet: "Generate product title and meta description",
      creditsDeducted: 5,
      remainingCredits: 2495,
    },
    {
      id: "tx_seed_3",
      timestamp: new Date(now - 18000000).toISOString(),
      taskType: "Simple Task",
      promptSnippet: "Summarize bullet points",
      creditsDeducted: 2,
      remainingCredits: 2500,
    },
  ];
}
