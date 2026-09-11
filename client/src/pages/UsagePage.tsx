/*
 * Usage Page — Usage analytics, credit tracking, and plan details
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
} from "lucide-react";
import React, { useEffect, useState } from "react";

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

  useEffect(() => {
    void listUserConversations()
      .then(conversations =>
        setAnalytics(calculateConversationAnalytics(conversations))
      )
      .catch(() => setAnalytics(calculateConversationAnalytics([])));
  }, []);

  const formatNumber = (n: number) => new Intl.NumberFormat().format(n);

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
        {onNavigateToUpgrade && (
          <div className="page-header-actions">
            <Button
              className="send-button"
              onClick={onNavigateToUpgrade}
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
          </div>
        )}
      </div>

      {/* Active Plan Overview */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-icon">
            <CreditCard size={20} />
          </div>
          <div>
            <h3>Starter Free Plan</h3>
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
            <strong style={{ fontSize: "20px", color: "var(--text-primary)" }}>Free</strong>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginTop: "2px" }}>
              Free forever
            </span>
          </div>

          <div>
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "block", marginBottom: "4px" }}>
              Weekly Allowance
            </span>
            <strong style={{ fontSize: "20px", color: "var(--text-primary)" }}>500 Credits</strong>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginTop: "2px" }}>
              Refreshed automatically
            </span>
          </div>

          <div>
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "block", marginBottom: "4px" }}>
              AI Model Access
            </span>
            <strong style={{ fontSize: "20px", color: "var(--text-primary)" }}>Gemini 2.5 Flash</strong>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginTop: "2px" }}>
              High-speed multimodal
            </span>
          </div>
        </div>

        {/* Credit Meter */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
            <span>Weekly Credit Usage</span>
            <span>500 / 500 Credits Available</span>
          </div>
          <div className="credits-bar">
            <div className="credits-bar-fill" style={{ width: "100%" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", fontSize: "11px", color: "var(--text-tertiary)" }}>
            <RefreshCw size={12} />
            <span>Resets weekly at 00:00 UTC</span>
          </div>
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
    </div>
  );
}
