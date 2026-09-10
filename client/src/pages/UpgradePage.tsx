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
            Unlock high-speed Gemini 2.5 Flash intelligence, store automations, multimodal research, and higher credit limits.
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
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "24px",
        alignItems: "stretch",
        maxWidth: "1080px",
        margin: "0 auto"
      }}>
        {/* Starter Free Plan */}
        <div className="pricing-card" style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "28px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-tertiary)" }}>
                Starter
              </span>
              <span style={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: "11px", padding: "4px 10px", borderRadius: "999px", color: "var(--text-secondary)" }}>
                Free Plan
              </span>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "36px", fontWeight: "800", color: "var(--text-primary)" }}>Free</span>
                <span style={{ color: "var(--text-tertiary)", fontSize: "14px" }}>/ free forever</span>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px" }}>
                500 credits weekly refreshed automatically. Perfect for getting started with Hanna.
              </p>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px", marginBottom: "24px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", display: "block", marginBottom: "12px" }}>
                Plan Benefits
              </span>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "10px" }}>
                {[
                  "500 credits weekly (auto-refreshes)",
                  "Gemini 2.5 Flash default AI model",
                  "Basic Shopify & web search tools",
                  "Up to 10 saved conversation threads",
                  "Standard file & image uploads",
                  "Community support & docs"
                ].map(feat => (
                  <li key={feat} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "var(--text-primary)" }}>
                    <Check size={16} style={{ color: "var(--gemini-accent)", flexShrink: 0 }} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Button
            variant="outline"
            style={{ width: "100%", borderRadius: "12px", padding: "12px" }}
            onClick={() => showToast("You are currently on the Starter Free Plan")}
          >
            Current Plan
          </Button>
        </div>

        {/* Pro Plan (Highlighted) */}
        <div className="pricing-card is-popular" style={{
          background: "var(--surface-raised)",
          border: "2px solid var(--gemini-accent)",
          borderRadius: "20px",
          padding: "28px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          boxShadow: "0 12px 32px rgba(26,115,232,0.15)"
        }}>
          <div style={{
            position: "absolute",
            top: "-14px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--gemini-accent)",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: "700",
            padding: "4px 14px",
            borderRadius: "999px",
            textTransform: "uppercase",
            letterSpacing: "0.06em"
          }}>
            Most Popular
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", marginTop: "4px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gemini-accent)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Zap size={16} /> Pro Plan
              </span>
              <span style={{ background: "rgba(26,115,232,0.15)", color: "var(--gemini-accent)", fontSize: "11px", padding: "4px 10px", borderRadius: "999px", fontWeight: "600" }}>
                3-Day Free Trial
              </span>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontSize: "36px", fontWeight: "800", color: "var(--text-primary)" }}>
                  {isAnnual ? "16.99 USD" : "19.99 USD"}
                </span>
                <span style={{ color: "var(--text-tertiary)", fontSize: "14px" }}>/ mo</span>
              </div>
              {isAnnual && (
                <div style={{ fontSize: "11px", color: "var(--gemini-accent)", fontWeight: "600", marginTop: "2px" }}>
                  Billed annually ($203.88/yr) · 15% discount applied
                </div>
              )}
              <div style={{
                marginTop: "10px",
                padding: "8px 12px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "var(--text-primary)"
              }}>
                <strong style={{ color: "var(--gemini-accent)" }}>Introductory Offer:</strong> 3-day free trial, 50% off for the first month ($9.99 USD), then $19.99 USD in following months. Canceled at anytime.
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px", marginBottom: "24px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", display: "block", marginBottom: "12px" }}>
                Everything in Starter, plus:
              </span>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "10px" }}>
                {[
                  "1,000 credits per week (auto-refreshed)",
                  "Priority Gemini 2.5 Flash & Pro reasoning models",
                  "3-day free trial with 50% off month 1 ($9.99 USD)",
                  "Advanced Shopify store automations & inventory sync",
                  "Deep web research & native image generation",
                  "Unlimited file, PDF & visual attachments",
                  "Priority customer support & workflow templates",
                  "Cancel at anytime with no contract"
                ].map(feat => (
                  <li key={feat} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "var(--text-primary)" }}>
                    <Check size={16} style={{ color: "var(--gemini-accent)", flexShrink: 0 }} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Button
            style={{ width: "100%", borderRadius: "12px", padding: "12px", background: "var(--gemini-accent)", color: "#ffffff", fontWeight: "700" }}
            onClick={() => handleSelectPlan("Pro")}
          >
            Start 3-Day Free Trial
          </Button>
        </div>

        {/* Enterprise Plan */}
        <div className="pricing-card" style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "28px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Crown size={16} /> Enterprise
              </span>
              <span style={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: "11px", padding: "4px 10px", borderRadius: "999px", color: "var(--text-secondary)" }}>
                Enterprise Grade
              </span>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontSize: "36px", fontWeight: "800", color: "var(--text-primary)" }}>
                  {isAnnual ? "42.49 USD" : "49.99 USD"}
                </span>
                <span style={{ color: "var(--text-tertiary)", fontSize: "14px" }}>/ mo</span>
              </div>
              {isAnnual && (
                <div style={{ fontSize: "11px", color: "var(--gemini-accent)", fontWeight: "600", marginTop: "2px" }}>
                  Billed annually ($509.88/yr) · 15% discount applied
                </div>
              )}
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px" }}>
                For high-volume e-commerce brands and teams requiring custom credits, collaboration, and custom integrations.
              </p>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px", marginBottom: "24px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", display: "block", marginBottom: "12px" }}>
                Everything in Pro, plus:
              </span>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "10px" }}>
                {[
                  "Custom credits tailored to your team volume",
                  "Team collaboration & workspace role permissions",
                  "Dedicated multi-agent Shopify & store orchestration",
                  "Custom API key connectors & webhooks",
                  "Dedicated account manager & 99.9% SLA uptime"
                ].map(feat => (
                  <li key={feat} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "var(--text-primary)" }}>
                    <Check size={16} style={{ color: "var(--gemini-accent)", flexShrink: 0 }} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Button
            variant="outline"
            style={{ width: "100%", borderRadius: "12px", padding: "12px" }}
            onClick={() => handleSelectPlan("Enterprise")}
          >
            Upgrade to Enterprise
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
