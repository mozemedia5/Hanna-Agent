/*
 * Settings Page — Unified Settings & Workspace Personalization
 * Unifies profile identity, customize instructions, tokens, usage, affiliate rewards, what's new & help.
 */
import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  getUserProfile,
  saveUserProfile,
} from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Moon,
  Sun,
  Monitor,
  Check,
  User,
  Sparkles,
  Save,
  Volume2,
  BarChart3,
  CreditCard,
  Gift,
  HelpCircle,
  TrendingUp,
  Copy,
  ExternalLink,
  Zap,
  Download,
  CheckCircle2,
  Laptop,
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePwaInstall } from "@/hooks/usePwaInstall";

type SettingsPageProps = {
  theme: "light" | "dark" | "system";
  onThemeChange: (theme: "light" | "dark" | "system") => void;
  onBack?: () => void;
};

export default function SettingsPage({
  theme,
  onThemeChange,
  onBack,
}: SettingsPageProps) {
  const { user } = useAuth();
  const { isInstalled: isPwaInstalled, installing: pwaInstalling, installApp: triggerPwaInstall } = usePwaInstall();
  const [profile, setProfile] = useState({
    displayName: "",
    photoURL: "",
    bio: "",
    customInstructions: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copiedAffiliate, setCopiedAffiliate] = useState(false);

  useEffect(() => {
    void getUserProfile()
      .then(res =>
        setProfile({
          displayName: res.displayName,
          photoURL: res.photoURL,
          bio: res.bio,
          customInstructions: res.customInstructions || "",
        })
      )
      .catch(() => undefined);
  }, []);

  const updateField = (field: keyof typeof profile, value: string) =>
    setProfile(current => ({ ...current, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveUserProfile({
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        bio: profile.bio,
        customInstructions: profile.customInstructions,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };


  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun, desc: "Paper white and graphite" },
    { value: "dark" as const, label: "Dark", icon: Moon, desc: "Charcoal and soft white" },
    { value: "system" as const, label: "System", icon: Monitor, desc: "Follow your device" },
  ];

  const [accentColor, setAccentColor] = useState<string>(() => {
    return localStorage.getItem("hanna_user_bubble_color") || "cream";
  });

  const accentOptions = [
    { id: "cream", label: "Cream", bg: "#2c2a24", border: "#4a4538" },
    { id: "green", label: "Soft Green", bg: "#1c2e22", border: "#2d4e38" },
    { id: "red", label: "Rose/Red", bg: "#321f20", border: "#562f32" },
    { id: "blue", label: "Sky Blue", bg: "#1c273a", border: "#2e3f5c" },
    { id: "default", label: "Graphite", bg: "var(--surface-raised)", border: "var(--border)" },
  ];

  const handleAccentSelect = (id: string) => {
    setAccentColor(id);
    localStorage.setItem("hanna_user_bubble_color", id);
  };

  const affiliateLink = `https://hanna.ai/ref/${(user?.email || "user").split("@")[0]}`;

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
          <span className="eyebrow">Workspace & Account</span>
          <h1 className="page-title">Settings</h1>
          <p className="page-description">
            Personalize how Hanna works for you. Manage profile identity, custom persona instructions, tokens, usage, affiliate rewards, and system options.
          </p>
        </div>
      </div>

      {/* User Account Overview */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div>
            <h3>Profile & Account</h3>
            <span className="settings-card-subtitle">
              Your account details and personal workspace identity
            </span>
          </div>
        </div>
        <div className="profile-card-top" style={{ padding: "16px 0 0" }}>
          <div className="profile-avatar-large">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" />
            ) : (
              (user?.displayName || user?.email || "U")
                .slice(0, 1)
                .toUpperCase()
            )}
          </div>
          <div className="profile-info">
            <h2>{profile.displayName || user?.displayName || "User"}</h2>
            <span>{user?.email || "No email"}</span>
          </div>
        </div>
      </section>

      {/* Workspace Identity */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div>
            <h3>Workspace Identity</h3>
            <span className="settings-card-subtitle">
              How Hanna addresses you and your workspace
            </span>
          </div>
        </div>
        <div className="settings-form">
          <label className="settings-field">
            <span className="settings-field-label">Display name</span>
            <input
              value={profile.displayName}
              onChange={e => updateField("displayName", e.target.value)}
              placeholder="Your name or workspace name"
            />
          </label>
          <label className="settings-field">
            <span className="settings-field-label">About you</span>
            <textarea
              value={profile.bio}
              onChange={e => updateField("bio", e.target.value)}
              placeholder="A background context for Hanna: your role, business, or interests"
              maxLength={500}
              rows={3}
            />
            <span className="settings-field-hint">
              {profile.bio.length}/500 characters
            </span>
          </label>
        </div>
      </section>

      {/* Hanna Persona & Custom Instructions */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div>
            <h3>Hanna Persona & Custom Instructions</h3>
            <span className="settings-card-subtitle">
              Define instructions for how Hanna should answer all your prompts
            </span>
          </div>
        </div>
        <div className="settings-form">
          <label className="settings-field">
            <span className="settings-field-label">
              Custom instructions for Hanna
            </span>
            <textarea
              value={profile.customInstructions}
              onChange={e =>
                updateField("customInstructions", e.target.value)
              }
              placeholder="E.g. Be concise, focus on E-Commerce strategies, write code in TypeScript, always include actionable steps..."
              maxLength={1000}
              rows={5}
            />
            <span className="settings-field-hint">
              Hanna will follow these instructions across all conversations.{" "}
              {profile.customInstructions.length}/1000 characters.
            </span>
          </label>

          <div className="persona-presets">
            <span className="settings-field-label">Quick personas</span>
            <div className="persona-grid">
              {[
                {
                  label: "E-Commerce Expert",
                  desc: "Focus on Shopify, products, and conversions",
                  instructions:
                    "Focus on e-commerce strategies. Help me with Shopify store optimization, product descriptions, marketing campaigns, and conversion rate improvements.",
                },
                {
                  label: "Code Assistant",
                  desc: "TypeScript, React, debugging help",
                  instructions:
                    "Be a technical code assistant. Write clean TypeScript and React code. Help me debug issues, review code, and suggest architectural improvements.",
                },
                {
                  label: "Research Analyst",
                  desc: "Deep research and analysis",
                  instructions:
                    "Act as a research analyst. Provide thorough, well-sourced analysis. Break down complex topics, compare options with pros/cons, and deliver actionable insights.",
                },
                {
                  label: "Creative Writer",
                  desc: "Content, copy, and storytelling",
                  instructions:
                    "Be a creative writing assistant. Help me craft engaging content, social media copy, blog posts, and marketing materials with a compelling voice.",
                },
              ].map(preset => (
                <button
                  key={preset.label}
                  className="persona-preset-card"
                  onClick={() =>
                    updateField("customInstructions", preset.instructions)
                  }
                >
                  <strong>{preset.label}</strong>
                  <span>{preset.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Desktop & Mobile App (PWA) */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div>
            <h3>Desktop & Mobile Application (PWA)</h3>
            <span className="settings-card-subtitle">
              Install Hanna on your desktop dock or mobile home screen for instant access
            </span>
          </div>
        </div>
        <div style={{ marginTop: "16px", display: "grid", gap: "12px" }}>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              padding: "16px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <img src="/hanna-icon-192.png" alt="Hanna AI App" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>Hanna Workspace App</strong>
                  {isPwaInstalled ? (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        background: "rgba(34, 197, 94, 0.15)",
                        color: "#22c55e",
                        border: "1px solid rgba(34, 197, 94, 0.3)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <CheckCircle2 size={12} /> Installed
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        background: "rgba(26, 115, 232, 0.15)",
                        color: "var(--gemini-accent, #1a73e8)",
                        border: "1px solid rgba(26, 115, 232, 0.3)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Zap size={12} /> Installable
                    </span>
                  )}
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginTop: "2px" }}>
                  {isPwaInstalled
                    ? "Running in standalone application mode. Access Hanna directly from your launcher, dock, or home screen."
                    : "Install as a Progressive Web App for instant launch, native window controls, and zero browser tab clutter."}
                </span>
              </div>
            </div>

            {isPwaInstalled ? (
              <Button variant="outline" size="sm" disabled style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={15} className="text-green-500" />
                <span>App Installed</span>
              </Button>
            ) : (
              <Button
                onClick={() => void triggerPwaInstall()}
                disabled={pwaInstalling}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "var(--gemini-accent, #1a73e8)",
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: "13px",
                  borderRadius: "10px",
                  padding: "8px 16px",
                  cursor: "pointer",
                }}
              >
                <Download size={15} />
                <span>{pwaInstalling ? "Installing..." : "Install Hanna App"}</span>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Usage, Tokens & Credit Quota */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div>
            <h3>Usage, Tokens & Credits</h3>
            <span className="settings-card-subtitle">
              Track your daily allowance, token quota, and workspace credits
            </span>
          </div>
        </div>
        <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
          <div className="profile-credits-card" style={{ margin: 0 }}>
            <div className="credits-header">
              <CreditCard size={18} />
              <span>Workspace Allowance</span>
              <span className="credits-amount">2,500 credits left</span>
            </div>
            <div className="credits-bar">
              <div className="credits-bar-fill" style={{ width: "80%" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)", marginTop: "8px" }}>
              <span>Daily Token Quota: 300 tokens/day (Hanna Lite)</span>
              <span>Refreshes daily at 00:00 UTC</span>
            </div>
          </div>
        </div>
      </section>

      {/* Affiliate Program & Commissions */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div>
            <h3>Affiliate Program</h3>
            <span className="settings-card-subtitle">
              Invite businesses or creators and earn 100% commission on referrals
            </span>
          </div>
        </div>
        <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "14px 16px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <strong style={{ fontSize: "13px", color: "var(--text-primary)", display: "block" }}>Your Affiliate Referral Link</strong>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{affiliateLink}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(affiliateLink);
                setCopiedAffiliate(true);
                setTimeout(() => setCopiedAffiliate(false), 2000);
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              {copiedAffiliate ? <Check size={14} /> : <Copy size={14} />}
              {copiedAffiliate ? "Copied" : "Copy Link"}
            </Button>
          </div>
        </div>
      </section>

      {/* What's New & Help Section */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div>
            <h3>What's New & Workspace Help</h3>
            <span className="settings-card-subtitle">
              Recent system updates and assistance guide
            </span>
          </div>
        </div>
        <div style={{ display: "grid", gap: "10px", marginTop: "16px" }}>
          <div style={{ padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>
            <strong style={{ fontSize: "13px", color: "var(--text-primary)", display: "block", marginBottom: "4px" }}>
              ⚡ Intent Router & Dual-Track Execution (Route A / Route B)
            </strong>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              Fast streaming for Q&A (Route A) and multi-step ReAct agentic execution with MCP ecosystem tool calls (Route B).
            </span>
          </div>

          <div style={{ padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px" }}>
            <strong style={{ fontSize: "13px", color: "var(--text-primary)", display: "block", marginBottom: "4px" }}>
              ☁️ Cloudinary Preset (`hanna_agent`) Integration
            </strong>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              Full functional image & media uploads powered by Cloudinary preset `hanna_agent`.
            </span>
          </div>
        </div>
      </section>


      {/* Appearance & Prompt Accent Style */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div>
            <h3>Appearance & User Prompt Accent</h3>
            <span className="settings-card-subtitle">
              Choose theme and user message bubble accent color
            </span>
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <span className="settings-field-label" style={{ display: "block", marginBottom: "8px" }}>
            Workspace Theme
          </span>
          <div className="theme-options-grid">
            {themeOptions.map(opt => (
              <button
                key={opt.value}
                className={`theme-option-card ${theme === opt.value ? "is-selected" : ""}`}
                onClick={() => onThemeChange(opt.value)}
              >
                <opt.icon size={20} />
                <span className="theme-option-label">{opt.label}</span>
                <span className="theme-option-desc">{opt.desc}</span>
                {theme === opt.value && (
                  <span className="theme-check">
                    <Check size={14} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="settings-field-label" style={{ display: "block", marginBottom: "8px" }}>
            User Message Accent Color
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px" }}>
            {accentOptions.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleAccentSelect(opt.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "12px 8px",
                  borderRadius: "12px",
                  background: opt.bg,
                  border: `2px solid ${accentColor === opt.id ? "var(--gemini-accent)" : opt.border}`,
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                <span>{opt.label}</span>
                {accentColor === opt.id && <Check size={14} style={{ color: "var(--gemini-accent)" }} />}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="settings-save-bar">
        <Button
          onClick={handleSave}
          disabled={saving || !profile.displayName.trim()}
          style={{
            background: "var(--text-primary)",
            color: "var(--surface)",
            border: "1px solid var(--text-primary)",
            borderRadius: "10px",
            padding: "10px 24px",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {saved ? "Saved" : saving ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </div>
  );
}
