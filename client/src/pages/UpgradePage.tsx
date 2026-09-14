/*
 * Upgrade Page — Pricing plans, trial offers, annual discounts, and benefits
 */
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Check,
  Crown,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import React, { useState } from "react";

type UpgradePageProps = {
  onBack?: () => void;
};

export default function UpgradePage({ onBack }: UpgradePageProps) {
  const [isAnnual, setIsAnnual] = useState(true);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleSelectPlan = (planName: string) => {
    showToast(`Selected ${planName} plan! Starting checkout...`);
  };

  return (
    <div className="page-container upgrade-page-container custom-scroll">
      {/* Back Navigation */}
      <div className="page-header-top" style={{ marginBottom: "16px" }}>
        {onBack && (
          <button
            className="back-button"
            onClick={onBack}
            aria-label="Back to workspace"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        )}
      </div>

      <div className="page-header" style={{ textAlign: "center", maxWidth: "720px", margin: "0 auto 32px" }}>
        <div className="page-header-text">
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            Workspace Plans
          </span>
          <h1 className="page-title" style={{ fontSize: "32px", marginTop: "8px" }}>
            Upgrade your Hanna Experience
          </h1>
          <p className="page-description" style={{ fontSize: "15px", color: "var(--text-secondary)" }}>
            Unlock high-speed Hanna Lite &amp; Hanna Pro intelligence, team contributor collaboration, store automations, multimodal research, and custom credit limits.
          </p>
        </div>

        {/* Promo Trial Banner */}
        <div className="upgrade-promo-banner" style={{
          marginTop: "20px",
          padding: "14px 20px",
          background: "linear-gradient(135deg, rgba(26,115,232,0.12) 0%, rgba(124,58,237,0.12) 100%)",
          border: "1px solid var(--gemini-accent)",
          borderRadius: "14px",
          display: "inline-flex",
          alignItems: "center",
          gap: "12px",
          textAlign: "left"
        }}>
          <Sparkles size={22} style={{ color: "var(--gemini-accent)", flexShrink: 0 }} />
          <div>
            <strong style={{ display: "block", fontSize: "14px", color: "var(--text-primary)" }}>
              Special Limited Offer: 3-Day Free Trial
            </strong>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Get 50% off for your first month ($9.99 USD), then $19.99/mo in following months. Cancel anytime!
            </span>
          </div>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="billing-toggle-wrapper" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "12px",
          marginTop: "24px",
          background: "var(--surface-raised)",
          padding: "6px 8px",
          borderRadius: "999px",
          border: "1px solid var(--border)"
        }}>
          <button
            className={`billing-toggle-btn ${!isAnnual ? "is-active" : ""}`}
            onClick={() => setIsAnnual(false)}
            style={{
              padding: "8px 18px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: "600",
              border: "none",
              background: !isAnnual ? "var(--surface)" : "transparent",
              color: !isAnnual ? "var(--text-primary)" : "var(--text-secondary)",
              boxShadow: !isAnnual ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            Monthly Billing
          </button>
          <button
            className={`billing-toggle-btn ${isAnnual ? "is-active" : ""}`}
            onClick={() => setIsAnnual(true)}
            style={{
              padding: "8px 18px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: "600",
              border: "none",
              background: isAnnual ? "var(--surface)" : "transparent",
              color: isAnnual ? "var(--text-primary)" : "var(--text-secondary)",
              boxShadow: isAnnual ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span>Annual Billing</span>
            <span style={{
              background: "var(--gemini-accent)",
              color: "#ffffff",
              fontSize: "10px",
              fontWeight: "700",
              padding: "2px 8px",
              borderRadius: "999px",
              textTransform: "uppercase"
            }}>
              Save 15%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="pricing-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "20px",
        alignItems: "stretch",
        maxWidth: "1180px",
        margin: "0 auto"
      }}>
        {/* Starter Free Plan */}
        <div className="pricing-card" style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-tertiary)" }}>
                Starter
              </span>
              <span style={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: "11px", padding: "3px 8px", borderRadius: "999px", color: "var(--text-secondary)" }}>
                Free
              </span>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "32px", fontWeight: "800", color: "var(--text-primary)" }}>Free</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                500 credits weekly. Great for single workspace creators.
              </p>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginBottom: "20px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", display: "block", marginBottom: "10px" }}>
                Includes:
              </span>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "8px" }}>
                {[
                  "500 credits weekly",
                  "Hanna Lite fast engine",
                  "Up to 1 contributor seat",
                  "Standard Shopify & web tools",
                ].map(feat => (
                  <li key={feat} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-primary)" }}>
                    <Check size={14} style={{ color: "var(--gemini-accent)", flexShrink: 0 }} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Button
            variant="outline"
            style={{ width: "100%", borderRadius: "10px", padding: "10px" }}
            onClick={() => showToast("You are on the Starter Free Plan")}
          >
            Current Plan
          </Button>
        </div>

        {/* Pro Plan ($19.99/mo) - 5 contributors */}
        <div className="pricing-card is-popular" style={{
          background: "var(--surface-raised)",
          border: "2px solid var(--gemini-accent)",
          borderRadius: "20px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gemini-accent)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Zap size={15} /> Pro
              </span>
              <span style={{ background: "rgba(26,115,232,0.15)", color: "var(--gemini-accent)", fontSize: "11px", padding: "3px 8px", borderRadius: "999px", fontWeight: "600" }}>
                5 Seats
              </span>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "32px", fontWeight: "800", color: "var(--text-primary)" }}>
                  {isAnnual ? "$16.99" : "$19.99"}
                </span>
                <span style={{ color: "var(--text-tertiary)", fontSize: "13px" }}>/ mo</span>
              </div>
              {isAnnual && (
                <div style={{ fontSize: "11px", color: "var(--gemini-accent)", fontWeight: "600", marginTop: "2px" }}>
                  15% discount applied
                </div>
              )}
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                Up to <strong>5 contributors</strong> max.
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginBottom: "20px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", display: "block", marginBottom: "10px" }}>
                Pro Benefits:
              </span>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "8px" }}>
                {[
                  "1,000 credits per week",
                  "Hanna Pro deep reasoning",
                  "Up to 5 contributors",
                  "Chat sharing & control panel",
                  "Priority store automations"
                ].map(feat => (
                  <li key={feat} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-primary)" }}>
                    <Check size={14} style={{ color: "var(--gemini-accent)", flexShrink: 0 }} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Button
            style={{ width: "100%", borderRadius: "10px", padding: "10px", background: "var(--gemini-accent)", color: "#ffffff", fontWeight: "700" }}
            onClick={() => handleSelectPlan("Pro")}
          >
            Upgrade to Pro
          </Button>
        </div>

        {/* Max Plan ($49.99/mo) - 20 contributors */}
        <div className="pricing-card" style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Sparkles size={15} /> Max
              </span>
              <span style={{ background: "rgba(124,58,237,0.15)", color: "#7c3aed", fontSize: "11px", padding: "3px 8px", borderRadius: "999px", fontWeight: "600" }}>
                20 Seats
              </span>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "32px", fontWeight: "800", color: "var(--text-primary)" }}>
                  {isAnnual ? "$39.99" : "$49.99"}
                </span>
                <span style={{ color: "var(--text-tertiary)", fontSize: "13px" }}>/ mo</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                Up to <strong>20 contributors</strong> max.
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginBottom: "20px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", display: "block", marginBottom: "10px" }}>
                Max Benefits:
              </span>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "8px" }}>
                {[
                  "5,000 credits per week",
                  "Hanna Pro priority reasoning",
                  "Up to 20 contributors",
                  "Advanced contributor control panel",
                  "Granular chat & task permissions"
                ].map(feat => (
                  <li key={feat} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-primary)" }}>
                    <Check size={14} style={{ color: "var(--gemini-accent)", flexShrink: 0 }} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Button
            variant="outline"
            style={{ width: "100%", borderRadius: "10px", padding: "10px" }}
            onClick={() => handleSelectPlan("Max")}
          >
            Upgrade to Max
          </Button>
        </div>

        {/* Enterprise Plan ($99.99 USD starting - Custom everything) */}
        <div className="pricing-card" style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Crown size={15} /> Enterprise
              </span>
              <span style={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: "11px", padding: "3px 8px", borderRadius: "999px", color: "var(--text-secondary)" }}>
                Custom
              </span>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "32px", fontWeight: "800", color: "var(--text-primary)" }}>$99.99</span>
                <span style={{ color: "var(--text-tertiary)", fontSize: "13px" }}>/ mo base</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                Everything custom (credits &amp; seats set by Head of Contributors).
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginBottom: "20px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", display: "block", marginBottom: "10px" }}>
                Enterprise Benefits:
              </span>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "8px" }}>
                {[
                  "Custom credits & monthly credit allocation",
                  "Custom / unlimited contributors",
                  "Head of Contributors Control Panel",
                  "Custom API key connectors & SLA",
                  "99.99% uptime guarantee & support"
                ].map(feat => (
                  <li key={feat} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-primary)" }}>
                    <Check size={14} style={{ color: "var(--gemini-accent)", flexShrink: 0 }} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Button
            variant="outline"
            style={{ width: "100%", borderRadius: "10px", padding: "10px" }}
            onClick={() => handleSelectPlan("Enterprise")}
          >
            Contact Enterprise
          </Button>
        </div>
      </div>

      {/* Guarantee and FAQs */}
      <div style={{ maxWidth: "800px", margin: "48px auto 0", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", color: "var(--text-secondary)", fontSize: "13px", marginBottom: "24px" }}>
          <ShieldCheck size={18} style={{ color: "var(--gemini-accent)" }} />
          <span>3-day free trial · 50% off month 1 · Cancel at anytime with 1-click</span>
        </div>
      </div>

      {toast && (
        <div className="hanna-toast">
          <Check size={15} /> {toast}
        </div>
      )}
    </div>
  );
}
