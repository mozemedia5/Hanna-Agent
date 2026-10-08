export type CreditTransaction = {
  id: string;
  timestamp: string;
  taskType: "Huge / Complex Task" | "Standard Task" | "Simple Task" | "Credit Top-Up";
  promptSnippet: string;
  creditsDeducted: number;
  remainingCredits: number;
};

const DEFAULT_CREDITS = 500;
const STORAGE_KEY_CREDITS = "hanna_user_credits";
const STORAGE_KEY_HISTORY = "hanna_credit_history";

export function getUserCredits(): number {
  if (typeof localStorage === "undefined") return DEFAULT_CREDITS;
  const stored = localStorage.getItem(STORAGE_KEY_CREDITS);
  if (stored !== null && !isNaN(Number(stored))) {
    return Number(stored);
  }
  localStorage.setItem(STORAGE_KEY_CREDITS, String(DEFAULT_CREDITS));
  return DEFAULT_CREDITS;
}

export function saveUserCredits(amount: number): number {
  const sanitized = Math.max(0, Math.round(amount));
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY_CREDITS, String(sanitized));
    window.dispatchEvent(new Event("hanna_credits_updated"));
  }
  return sanitized;
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

  if (isHuge) {
    return { credits: 20, taskType: "Huge / Complex Task" };
  }

  if (textLength < 50) {
    return { credits: 2, taskType: "Simple Task" };
  }

  return { credits: 5, taskType: "Standard Task" };
}

export function getCreditHistory(): CreditTransaction[] {
  if (typeof localStorage === "undefined") return getInitialSeedHistory();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  const initial = getInitialSeedHistory();
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(initial));
  } catch {
    // ignore quota error
  }
  return initial;
}

export function recordCreditTransaction(
  taskType: CreditTransaction["taskType"],
  promptSnippet: string,
  creditsDeducted: number,
  remainingCredits: number
): CreditTransaction[] {
  const history = getCreditHistory();
  const newTx: CreditTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    taskType,
    promptSnippet: promptSnippet.slice(0, 45) || "Workspace execution",
    creditsDeducted,
    remainingCredits,
  };
  const updated = [newTx, ...history].slice(0, 50);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event("hanna_credits_updated"));
  }
  return updated;
}

function getInitialSeedHistory(): CreditTransaction[] {
  const now = new Date();
  return [
    {
      id: "tx_seed_1",
      timestamp: new Date(now.getTime() - 1000 * 60 * 15).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      taskType: "Huge / Complex Task",
      promptSnippet: "Deep market analysis & Shopify store audit",
      creditsDeducted: 20,
      remainingCredits: 480,
    },
    {
      id: "tx_seed_2",
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      taskType: "Standard Task",
      promptSnippet: "Generate product title and meta description",
      creditsDeducted: 5,
      remainingCredits: 500,
    },
    {
      id: "tx_seed_3",
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 5).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      taskType: "Simple Task",
      promptSnippet: "Summarize bullet points",
      creditsDeducted: 2,
      remainingCredits: 505,
    },
  ];
}
