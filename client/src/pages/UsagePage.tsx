/*
 * Usage Page — Usage analytics, credit tracking, top-up, and plan details
 */
import { Button } from "@/components/ui/button";
import {
  calculateConversationAnalytics,
  listUserConversations,
} from "@/lib/firestore";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  CreditCard,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Zap,
  Plus,
  Check,
  X,
  History,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  getUserCredits,
  saveUserCredits,
  getCreditHistory,
  recordCreditTransaction,
  type CreditTransaction,
} from "@/lib/credits";

type UsagePageProps = {
  onNavigateToUpgrade?: () => void;
  onBack?: () => void;
};

export default function UsagePage({
  onNavigateToUpgrade,
  onBack,
}: UsagePageProps) {
  const [analytics, setAnalytics] = useState<ReturnType<
    typeof calculateConversationAnalytics
  > | null>(null);

  const [userCredits, setUserCredits] = useState<number>(getUserCredits);
  const [creditHistory, setCreditHistory] = useState<CreditTransaction[]>(getCreditHistory);

  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  useEffect(() => {
    const syncCredits = () => {
      setUserCredits(getUserCredits());
      setCreditHistory(getCreditHistory());
    };
    window.addEventListener("hanna_credits_updated", syncCredits);
    window.addEventListener("storage", syncCredits);
    return () => {
      window.removeEventListener("hanna_credits_updated", syncCredits);
      window.removeEventListener("storage", syncCredits);
    };
  }, []);

  useEffect(() => {
    void listUserConversations()
      .then(conversations =>
        setAnalytics(calculateConversationAnalytics(conversations))
      )
      .catch(() => setAnalytics(calculateConversationAnalytics([])));
  }, []);

  const formatNumber = (n: number) => new Intl.NumberFormat().format(n);

  const handleAddCredits = (amount: number) => {
    const newBalance = saveUserCredits(userCredits + amount);
    setUserCredits(newBalance);
    const updatedLog = recordCreditTransaction("Credit Top-Up", `Top-up package +${amount}`, 0, newBalance);
    setCreditHistory(updatedLog);
    setShowTopUpModal(false);
    showToast(`Successfully added +${amount} credits to your workspace!`);
  };

  return (
    <div className="page-container">
      {/* Back Navigation */}
      <div className="page-header-top">
        {onBack && (
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        )}
      </div>

      <div className="page-header">
        <div className="page-header-text">
          <span className="eyebrow">Workspace Usage</span>
          <h1 className="page-title">Usage &amp; Credit Limits</h1>
          <p className="page-description">
            Track your weekly token allowance, active conversation threads, and model credit usage.
          </p>
        </div>
        <div className="page-header-actions" style={{ display: "flex", gap: "10px" }}>
          <Button
            onClick={() => setShowTopUpModal(true)}
            style={{
              background: "var(--gemini-accent)",
              color: "var(--ink-contrast)",
              borderRadius: "9999px",
              padding: "0 18px",
              height: "40px",
              fontSize: "13px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={15} /> Top Up Credits
          </Button>

          {onNavigateToUpgrade && (
            <Button
              className="send-button"
              onClick={onNavigateToUpgrade}
              variant="outline"
              style={{
                width: "auto",
                height: "40px",
                padding: "0 18px",
                borderRadius: "9999px",
                fontSize: "13px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Sparkles size={15} />
              <span>Upgrade Plan</span>
            </Button>
          )}
        </div>
      </div>

      {/* Active Plan Overview */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-icon">
            <CreditCard size={20} />
          </div>
          <div>
            <h3>Starter Plan</h3>
            <span className="settings-card-subtitle">Default Workspace Plan</span>
          </div>
          <span
            style={{
              marginLeft: "auto",
              background: "color-mix(in srgb, #34a853 15%, transparent)",
              color: "#34a853",
              fontSize: "11px",
              fontWeight: 700,
              padding: "4px 12px",
              borderRadius: "9999px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <CheckCircle2 size={13} /> Active
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            background: "var(--surface-raised)",
            padding: "18px",
            borderRadius: "14px",
            border: "1px solid var(--border)",
            marginBottom: "20px",
          }}
        >
          <div>
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "block", marginBottom: "4px" }}>
              Plan Price
            </span>
            <strong style={{ fontSize: "20px", color: "var(--text-primary)" }}>$5.99 USD</strong>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginTop: "2px" }}>
              Monthly billing
            </span>
          </div>

          <div>
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "block", marginBottom: "4px" }}>
              Available Credits
            </span>
            <strong style={{ fontSize: "20px", color: "var(--gemini-accent)" }}>{formatNumber(userCredits)} Credits</strong>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginTop: "2px" }}>
              Live workspace balance
            </span>
          </div>

          <div>
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "block", marginBottom: "4px" }}>
              AI Model Access
            </span>
            <strong style={{ fontSize: "20px", color: "var(--text-primary)" }}>Hanna Lite / Hanna Pro</strong>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginTop: "2px" }}>
              Multimodal intelligence
            </span>
          </div>
        </div>

        {/* Credit Meter */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
            <span>Weekly Credit Usage</span>
            <span>{userCredits} Credits Available</span>
          </div>
          <div className="credits-bar">
            <div className="credits-bar-fill" style={{ width: `${Math.min(100, Math.max(5, (userCredits / 1000) * 100))}%` }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-tertiary)" }}>
              <RefreshCw size={12} />
              <span>Resets weekly at 00:00 UTC</span>
            </div>
            <button
              onClick={() => setShowTopUpModal(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--gemini-accent)",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                padding: 0,
              }}
            >
              + Add Credits
            </button>
          </div>
        </div>
      </div>

      {/* Credit Usage Accountability & History */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-icon">
            <History size={20} />
          </div>
          <div>
            <h3>Credit Usage &amp; Task Accountability Log</h3>
            <span className="settings-card-subtitle">
              Detailed tracking of consumed credits per task complexity (Huge tasks: ~20 credits, Standard: 5 credits, Simple: ~2 credits)
            </span>
          </div>
        </div>

        <div style={{ marginTop: "16px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", color: "var(--text-primary)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", textTransform: "uppercase", fontSize: "11px", color: "var(--text-tertiary)", letterSpacing: ".05em" }}>
                <th style={{ textAlign: "left", padding: "8px 12px" }}>Time</th>
                <th style={{ textAlign: "left", padding: "8px 12px" }}>Task Complexity</th>
                <th style={{ textAlign: "left", padding: "8px 12px" }}>Prompt Snippet</th>
                <th style={{ textAlign: "right", padding: "8px 12px" }}>Deduction</th>
                <th style={{ textAlign: "right", padding: "8px 12px" }}>Remaining Balance</th>
              </tr>
            </thead>
            <tbody>
              {creditHistory.map(tx => (
                <tr key={tx.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 12px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                    {tx.timestamp}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 600,
                        background:
                          tx.taskType === "Huge / Complex Task"
                            ? "rgba(234, 67, 53, 0.12)"
                            : tx.taskType === "Credit Top-Up"
                            ? "rgba(52, 168, 83, 0.12)"
                            : "rgba(26, 115, 232, 0.12)",
                        color:
                          tx.taskType === "Huge / Complex Task"
                            ? "#ea4335"
                            : tx.taskType === "Credit Top-Up"
                            ? "#34a853"
                            : "var(--gemini-accent)",
                      }}
                    >
                      {tx.taskType}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>
                    {tx.promptSnippet}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: tx.creditsDeducted > 0 ? "#ea4335" : "#34a853" }}>
                    {tx.creditsDeducted > 0 ? `-${tx.creditsDeducted}` : "+Top Up"}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>
                    {tx.remainingCredits}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="profile-usage-section">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <BarChart3 size={18} style={{ color: "var(--ink)" }} />
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
            Conversation Analytics
          </h3>
        </div>

        <div className="usage-stat-grid">
          <div className="usage-stat">
            <span>Conversations Created</span>
            <strong>{formatNumber(analytics?.totalConversations ?? 0)}</strong>
          </div>
          <div className="usage-stat">
            <span>Total Messages</span>
            <strong>{formatNumber(analytics?.totalMessages ?? 0)}</strong>
          </div>
          <div className="usage-stat">
            <span>Estimated Tokens Used</span>
            <strong>{formatNumber(analytics?.estimatedTokens ?? 0)}</strong>
          </div>
          <div className="usage-stat">
            <span>Active Days</span>
            <strong>{formatNumber(analytics?.activeDays ?? 0)}</strong>
          </div>
        </div>
      </div>

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="modal-overlay" onClick={() => setShowTopUpModal(false)}>
          <div className="modal-content" style={{ maxWidth: "480px", padding: "24px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                <Zap size={20} style={{ color: "var(--gemini-accent)" }} /> Workspace Credit Top-Up
              </h3>
              <button onClick={() => setShowTopUpModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                <X size={16} />
              </button>
            </div>

            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--text-secondary)" }}>
              Current Balance: <strong style={{ color: "var(--gemini-accent)" }}>{userCredits} Credits</strong>. Select a package to add credits instantly to your workspace.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              {[
                { amount: 100, price: "$1.99 USD", label: "Starter Pack" },
                { amount: 500, price: "$5.99 USD", label: "Popular Pack" },
                { amount: 1000, price: "$9.99 USD", label: "Pro Operator" },
                { amount: 2500, price: "$19.99 USD", label: "Enterprise Boost" },
              ].map(pack => (
                <button
                  key={pack.amount}
                  type="button"
                  onClick={() => handleAddCredits(pack.amount)}
                  style={{
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "14px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--gemini-accent)", display: "block" }}>
                    {pack.label}
                  </span>
                  <strong style={{ fontSize: "18px", color: "var(--text-primary)", display: "block", margin: "4px 0 2px" }}>
                    +{pack.amount} Credits
                  </strong>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{pack.price}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Callout */}
      <div
        style={{
          border: "1px solid var(--gemini-accent)",
          borderRadius: "20px",
          background: "linear-gradient(135deg, color-mix(in srgb, var(--ink) 10%, var(--surface)) 0%, var(--surface) 100%)",
          padding: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--gemini-accent)", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
            <Zap size={15} /> Need More Capacity?
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
            Upgrade to Hanna Pro
          </h3>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", maxWidth: "480px", lineHeight: 1.5 }}>
            Get 1,000 credits per week, priority access to Gemini reasoning models, advanced Shopify store automations, and a 3-day free trial with 50% off your first month ($9.99 USD).
          </p>
        </div>

        {onNavigateToUpgrade && (
          <Button
            onClick={onNavigateToUpgrade}
            style={{
              background: "var(--gemini-accent)",
              color: "#ffffff",
              borderRadius: "9999px",
              padding: "12px 24px",
              fontSize: "13px",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>Start Free Trial</span>
            <ArrowUpRight size={16} />
          </Button>
        )}
      </div>

      {toast && <div className="hanna-toast"><Check size={15} /> {toast}</div>}
    </div>
  );
}
