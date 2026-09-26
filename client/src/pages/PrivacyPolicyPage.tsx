import React from "react";
import { ArrowLeft, Check, Lock, ShieldCheck, Database, Key, Server, UserCheck, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

type PrivacyPolicyPageProps = {
  isAuthenticated?: boolean;
  onBack?: () => void;
};

export default function PrivacyPolicyPage({ isAuthenticated = false, onBack }: PrivacyPolicyPageProps) {
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
          Domain: <strong>https://hanna-agent.vercel.app</strong> · Last Updated: May 2026
        </span>
      </div>

      <header style={{ marginBottom: "36px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(26,115,232,0.12)", color: "var(--gemini-accent)", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "600", marginBottom: "12px" }}>
          <ShieldCheck size={14} /> Official Data Protection &amp; Security Policy
        </div>
        <h1 style={{ fontSize: "32px", fontWeight: "800", color: "var(--text-primary)", marginBottom: "12px" }}>
          Hanna AI Privacy Policy
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          At Hanna AI (hosted on <strong>https://hanna-agent.vercel.app</strong>), protecting your privacy, enterprise API credentials, connected store data, and customer information is our foundational commitment. This policy details how we collect, process, encrypt, and secure your data.
        </p>
      </header>

      {/* Highlights Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginBottom: "40px" }}>
        <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px" }}>
          <Key size={20} style={{ color: "var(--gemini-accent)", marginBottom: "10px" }} />
          <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "6px" }}>AES-256-GCM API Key Vault</h3>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            All OAuth tokens, connector API keys, and database secrets are encrypted at rest using AES-256-GCM.
          </p>
        </div>

        <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px" }}>
          <Lock size={20} style={{ color: "var(--gemini-accent)", marginBottom: "10px" }} />
          <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "6px" }}>Zero AI Model Training</h3>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Your private workspace data, prompt inputs, store metrics, and customer lists are NEVER used to train base AI models.
          </p>
        </div>

        <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px" }}>
          <Database size={20} style={{ color: "var(--gemini-accent)", marginBottom: "10px" }} />
          <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "6px" }}>Granular Connector Isolation</h3>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Third-party store connectors (Shopify, Meta Ads, Gmail, HeyGen) run in isolated security contexts with strict scope bounds.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gap: "28px", lineHeight: 1.7, color: "var(--text-primary)", fontSize: "14px" }}>
        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            1. Information We Collect
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>
            We collect only the essential information required to provide intelligent agent orchestration and workspace collaboration:
          </p>
          <ul style={{ paddingLeft: "20px", display: "grid", gap: "8px", color: "var(--text-secondary)" }}>
            <li><strong>Account Credentials:</strong> Email address, display name, profile photo, and password hashes handled securely via Firebase Authentication.</li>
            <li><strong>Connector &amp; Plugin Credentials:</strong> Third-party API keys, OAuth access tokens, and server configurations provided when connecting store tools (Shopify, Meta Ads, HeyGen, Gmail, Google Workspace, payment gateways, etc.).</li>
            <li><strong>Workspace &amp; Chat Content:</strong> Conversation threads, uploaded documents (PDF, images, media), custom system instructions, and task scheduler configs.</li>
            <li><strong>Telemetry &amp; Usage Logs:</strong> Anonymized credit usage metrics, request correlation IDs (`x-request-id`), and system error logs for performance maintenance.</li>
          </ul>
        </section>

        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            2. Connector &amp; API Key Security Architecture
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>
            Hanna integrates with 390+ ecosystem tools and Model Context Protocol (MCP) servers. Security of your API keys and store connections is paramount:
          </p>
          <div style={{ background: "var(--surface-raised)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)", display: "grid", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <Check size={16} style={{ color: "var(--gemini-accent)", marginTop: "2px", flexShrink: 0 }} />
              <div>
                <strong>Military-Grade Key Encryption:</strong> API keys and secrets are encrypted in transit via TLS 1.3 and at rest using AES-256-GCM envelope encryption keys managed securely.
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <Check size={16} style={{ color: "var(--gemini-accent)", marginTop: "2px", flexShrink: 0 }} />
              <div>
                <strong>Sandboxed MCP Execution:</strong> Connector tool requests are executed through isolated runtime adapters with standard JSON-RPC 2.0 payloads.
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <Check size={16} style={{ color: "var(--gemini-accent)", marginTop: "2px", flexShrink: 0 }} />
              <div>
                <strong>Financial Hard Cap Guards:</strong> Payment authorization connectors enforce a mandatory $500 billing safety cap per transaction.
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <Check size={16} style={{ color: "var(--gemini-accent)", marginTop: "2px", flexShrink: 0 }} />
              <div>
                <strong>1-Click Revocation:</strong> You can disconnect any plugin or delete API keys instantly from the Plugins &amp; Settings pages.
              </div>
            </div>
          </div>
        </section>

        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px" }}>
            3. How We Use Your Data
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>
            Your data is strictly processed to execute requested tasks within your active workspace session:
          </p>
          <ul style={{ paddingLeft: "20px", display: "grid", gap: "8px", color: "var(--text-secondary)" }}>
            <li>To synthesize answers, summarize uploaded files, and perform authorized store management actions.</li>
            <li>To sync workspace projects, contributor permissions, scheduled tasks, and chat history across your authorized devices.</li>
            <li>To monitor system health, route AI prompts to high-performance model providers (Google Gemini), and enforce plan credit limits.</li>
          </ul>
        </section>

        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px" }}>
            4. Third-Party Model Providers &amp; Sub-processors
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>
            When you interact with Hanna, prompts are transmitted via encrypted HTTPS endpoints to top-tier AI inference providers (such as Google Generative AI / Gemini API). All sub-processors adhere to commercial enterprise agreements guaranteeing zero data retention for training purposes.
          </p>
        </section>

        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px" }}>
            5. User Data Rights &amp; Retention
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>
            You maintain complete ownership and control over your data:
          </p>
          <ul style={{ paddingLeft: "20px", display: "grid", gap: "8px", color: "var(--text-secondary)" }}>
            <li><strong>Right to Export:</strong> Download or copy all chat histories, project summaries, and agent outputs at any time.</li>
            <li><strong>Right to Erasure:</strong> Deleting a conversation or project permanently purges the underlying records from primary state and Firestore.</li>
            <li><strong>Account Deletion:</strong> You can request full account and workspace termination directly from Settings.</li>
          </ul>
        </section>

        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px" }}>
            6. Contact &amp; Privacy Officer
          </h2>
          <p style={{ color: "var(--text-secondary)" }}>
            For questions regarding data security or privacy inquiries on <strong>https://hanna-agent.vercel.app</strong>, please reach out to our team at <code>privacy@hanna-agent.vercel.app</code> or through the Workspace Settings tab.
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
