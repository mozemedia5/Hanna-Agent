import React from "react";
import { ArrowLeft, Check, ShieldCheck, Users, Zap, Crown, HelpCircle } from "lucide-react";
import { useLocation } from "wouter";

type TermsOfServicePageProps = {
  isAuthenticated?: boolean;
  onBack?: () => void;
};

export default function TermsOfServicePage({ isAuthenticated = false, onBack }: TermsOfServicePageProps) {
  const [, navigate] = useLocation();

  const handleReturn = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (isAuthenticated) {
      navigate("/");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="page-container custom-scroll" style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 20px 60px" }}>
      {/* Top Header Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
        <button
          className="back-button"
          onClick={handleReturn}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--surface-raised)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "8px 14px",
            color: "var(--text-primary)",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer"
          }}
        >
          <ArrowLeft size={16} />
          <span>{isAuthenticated ? "Return to Workspace Dashboard" : "Return to Login / Home"}</span>
        </button>

        <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
          Domain: <strong>https://hanna-agent.vercel.app</strong> · Effective Date: May 2026
        </span>
      </div>

      <header style={{ marginBottom: "36px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(26,115,232,0.12)", color: "var(--gemini-accent)", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "600", marginBottom: "12px" }}>
          <ShieldCheck size={14} /> Master Subscription &amp; User Terms
        </div>
        <h1 style={{ fontSize: "32px", fontWeight: "800", color: "var(--text-primary)", marginBottom: "12px" }}>
          Hanna AI Terms of Service
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Welcome to Hanna AI, accessible at <strong>https://hanna-agent.vercel.app</strong>. These Terms of Service ("Terms") govern your access to and use of our AI workspace platform, automated agent services, store connectors, and contributor seat management.
        </p>
      </header>

      {/* Plan Structure Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "36px" }}>
        <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: "14px", padding: "16px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Starter / Free</span>
          <div style={{ fontSize: "20px", fontWeight: "800", marginTop: "4px" }}>$5.99 <span style={{ fontSize: "12px", fontWeight: "normal", color: "var(--text-secondary)" }}>/mo</span></div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
            500 weekly credits · Hanna Lite engine · 1 contributor seat.
          </p>
        </div>

        <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: "14px", padding: "16px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--gemini-accent)" }}>Pro Tier</span>
          <div style={{ fontSize: "20px", fontWeight: "800", marginTop: "4px" }}>$19.99 <span style={{ fontSize: "12px", fontWeight: "normal", color: "var(--text-secondary)" }}>/mo</span></div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
            1,000 weekly credits · Hanna Pro reasoning · Up to 5 contributors.
          </p>
        </div>

        <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: "14px", padding: "16px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#7c3aed" }}>Max Tier</span>
          <div style={{ fontSize: "20px", fontWeight: "800", marginTop: "4px" }}>$49.99 <span style={{ fontSize: "12px", fontWeight: "normal", color: "var(--text-secondary)" }}>/mo</span></div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
            5,000 weekly credits · Priority execution · Up to 20 contributors.
          </p>
        </div>

        <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: "14px", padding: "16px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-primary)" }}>Enterprise</span>
          <div style={{ fontSize: "20px", fontWeight: "800", marginTop: "4px" }}>$99.99+ <span style={{ fontSize: "12px", fontWeight: "normal", color: "var(--text-secondary)" }}>/mo base</span></div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
            Custom credits · Custom seats · Dedicated SLA &amp; account manager.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gap: "28px", lineHeight: 1.7, color: "var(--text-primary)", fontSize: "14px" }}>
        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px" }}>
            1. Acceptance of Terms
          </h2>
          <p style={{ color: "var(--text-secondary)" }}>
            By creating an account, checking the Terms agreement box on login/registration, or using the Hanna AI platform at <strong>https://hanna-agent.vercel.app</strong>, you agree to be bound by these Terms. If you are entering into these Terms on behalf of an organization, you represent that you have authority to bind that entity.
          </p>
        </section>

        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px" }}>
            2. Workspace Plans, Credit Allowances &amp; Billing
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>
            Hanna offers structured tiers tailored for creators, store operators, and enterprise teams:
          </p>
          <ul style={{ paddingLeft: "20px", display: "grid", gap: "10px", color: "var(--text-secondary)" }}>
            <li><strong>Starter Plan ($5.99/mo):</strong> Grants 500 AI credits per week and 1 seat. Ideal for basic chat and store queries.</li>
            <li><strong>Pro Plan ($19.99/mo standard or $16.99/mo annual):</strong> Grants 1,000 AI credits per week, deep reasoning with Hanna Pro, and up to 5 contributor seats. Special 3-day free trial offer includes 50% off Month 1 ($9.99).</li>
            <li><strong>Max Plan ($49.99/mo standard or $39.99/mo annual):</strong> Grants 5,000 AI credits per week and up to 20 contributor seats with granular chat control.</li>
            <li><strong>Enterprise Plan ($99.99/mo base):</strong> Custom credit allowances and contributor seat capacities configured directly by the Head/Owner of Contributors.</li>
            <li><strong>Credit Expiration:</strong> Weekly credits reset on your billing cycle. Unused credits do not roll over to subsequent billing periods.</li>
            <li><strong>Cancellations &amp; Refunds:</strong> You may cancel your subscription at any time with 1-click in the Settings / Upgrade page. Subscriptions remain active until the end of the current paid billing period.</li>
          </ul>
        </section>

        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px" }}>
            3. Contributors &amp; Workspace Collaboration
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>
            Workspace collaboration is managed via the Contributors module:
          </p>
          <ul style={{ paddingLeft: "20px", display: "grid", gap: "8px", color: "var(--text-secondary)" }}>
            <li>The account creator is designated as the <strong>Head/Owner of Contributors</strong>.</li>
            <li>Seat allocations are bounded by your plan tier (1 seat for Starter, 5 seats for Pro, 20 seats for Max, custom for Enterprise).</li>
            <li>The Head of Contributors is responsible for all activity conducted by added contributors in the workspace.</li>
          </ul>
        </section>

        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px" }}>
            4. Connectors, API Keys &amp; Third-Party Services
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>
            Hanna enables direct connection with third-party platforms (Shopify, Meta Ads, HeyGen, Gmail, payment processors):
          </p>
          <ul style={{ paddingLeft: "20px", display: "grid", gap: "8px", color: "var(--text-secondary)" }}>
            <li>You represent that you hold necessary rights and credentials to connect external API keys and accounts.</li>
            <li>API keys are encrypted using AES-256-GCM. Payment authorizations enforce an automatic $500 transaction cap for security.</li>
            <li>Hanna is not responsible for third-party outage delays or policy changes on external platforms.</li>
          </ul>
        </section>

        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px" }}>
            5. Acceptable Use Policy
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>
            You agree not to use Hanna to generate illegal content, attempt unauthorized API exploitation, bypass billing thresholds, or distribute malicious code.
          </p>
        </section>

        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px" }}>
            6. Limitation of Liability &amp; Disclaimers
          </h2>
          <p style={{ color: "var(--text-secondary)" }}>
            Hanna AI is provided "AS IS" and "AS AVAILABLE". AI outputs are generated stochastically; you should review critical store or financial operations before execution.
          </p>
        </section>

        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px" }}>
            7. Contact Information
          </h2>
          <p style={{ color: "var(--text-secondary)" }}>
            For legal or billing inquiries on <strong>https://hanna-agent.vercel.app</strong>, contact <code>support@hanna-agent.vercel.app</code>.
          </p>
        </section>
      </div>

      {/* Bottom Comeback Navigation Bar */}
      <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
        <button
          onClick={handleReturn}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--text-primary)",
            color: "var(--surface)",
            border: "none",
            borderRadius: "12px",
            padding: "12px 24px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          <ArrowLeft size={16} />
          <span>{isAuthenticated ? "Back to Hanna Workspace Dashboard" : "Back to Sign In / Registration"}</span>
        </button>
      </div>
    </div>
  );
}
