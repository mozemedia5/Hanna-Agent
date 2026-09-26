/*
 * Settings Page — Unified Settings & Workspace Personalization
 * Unifies profile identity, customize instructions, tokens, usage, affiliate rewards, what's new & help.
 */
import { useAuth, getFirebaseIdToken } from "@/_core/hooks/useAuth";
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
} from "lucide-react";
import { useEffect, useState } from "react";

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
  const [profile, setProfile] = useState({
    displayName: "",
    photoURL: "",
    bio: "",
    customInstructions: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copiedAffiliate, setCopiedAffiliate] = useState(false);
  const [voiceChoice, setVoiceChoice] = useState<string>(() => {
    return localStorage.getItem("hanna_voice_choice") || "Hanna (Natural) - Female";
  });

  const voices = [
    { id: "Hanna (Natural) - Female", name: "Hanna (Natural)", gender: "Female", desc: "Balanced, clear, natural response tone" },
    { id: "Emma (Friendly) - Female", name: "Emma (Friendly)", gender: "Female", desc: "Warm, engaging, conversational style" },
    { id: "Sophia (Professional) - Female", name: "Sophia (Professional)", gender: "Female", desc: "Executive, authoritative, crisp articulation" },
    { id: "James (Direct) - Male", name: "James (Direct)", gender: "Male", desc: "Clear, direct, confident delivery" },
    { id: "Daniel (Calm) - Male", name: "Daniel (Calm)", gender: "Male", desc: "Soothing, measured, steady tone" },
    { id: "Alex (Warm) - Male", name: "Alex (Warm)", gender: "Male", desc: "Enthusiastic, approachable, expressive" },
  ];

  const handleVoiceSelect = (vId: string) => {
    setVoiceChoice(vId);
    localStorage.setItem("hanna_voice_choice", vId);
  };

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

  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const playVoiceSample = (voiceObj: typeof voices[0]) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const sampleText = `Hello, I am ${voiceObj.name.split(" ")[0]}. How can I help you today?`;
      const utterance = new SpeechSynthesisUtterance(sampleText);
      const systemVoices = window.speechSynthesis.getVoices();
      if (systemVoices.length > 0) {
        const nameMatch = systemVoices.find(v =>
          v.name.toLowerCase().includes(voiceObj.name.split(" ")[0].toLowerCase())
        );
        if (nameMatch) {
          utterance.voice = nameMatch;
        } else {
          const isFemale = voiceObj.gender === "Female";
          const matched = systemVoices.find(v =>
            isFemale
              ? v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("samantha")
              : v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("alex")
          );
          if (matched) utterance.voice = matched;
        }
      }
      utterance.onend = () => setPlayingVoiceId(null);
      utterance.onerror = () => setPlayingVoiceId(null);
      setPlayingVoiceId(voiceObj.id);
      window.speechSynthesis.speak(utterance);
    }
  };

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun, desc: "Paper white and graphite" },
    { value: "dark" as const, label: "Dark", icon: Moon, desc: "Charcoal and soft white" },
    { value: "system" as const, label: "System", icon: Monitor, desc: "Follow your device" },
  ];

  const currentVoiceObj = voices.find(v => v.id === voiceChoice) || voices[0];
  const [affiliateLink, setAffiliateLink] = useState(`https://hanna.ai/?ref=hn_user`);
  const [affiliateReward, setAffiliateReward] = useState(500);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getFirebaseIdToken?.();
        const headers: Record<string, string> = { "content-type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch("/api/trpc/affiliate.getLink", { headers, credentials: "include" });
        if (!res.ok) return;
        const json = await res.json();
        const data = json?.result?.data ?? json?.result?.data?.json ?? json;
        if (!cancelled && data?.url) {
          setAffiliateLink(data.url);
          if (typeof data.rewardCredits === "number") setAffiliateReward(data.rewardCredits);
        }
      } catch {
        /* keep fallback */
      }
    })();
    return () => { cancelled = true; };
  }, [user?.uid, user?.email]);

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
              <span className="credits-amount">Daily credits by tier</span>
            </div>
            <div className="credits-bar">
              <div className="credits-bar-fill" style={{ width: "80%" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)", marginTop: "8px" }}>
              <span>Free 2,500 · Lite 8,000 · Pro 40,000 · Max 120,000 / day</span>
              <span>Resets daily UTC</span>
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
              Invite businesses or creators — earn reward credits when they sign up via your link
            </span>
          </div>
        </div>
        <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "14px 16px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <strong style={{ fontSize: "13px", color: "var(--text-primary)", display: "block" }}>Your Affiliate Referral Link</strong>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{affiliateLink}</span>
              <span style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "block", marginTop: "4px" }}>+{affiliateReward} credits per successful referral signup</span>
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

      {/* Voice Selection */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div>
            <h3>Voice Choice (Read Aloud)</h3>
            <span className="settings-card-subtitle">
              Select your preferred speech synthesis voice
            </span>
          </div>
        </div>

        <div style={{ marginTop: "16px", display: "grid", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label className="settings-field-label" htmlFor="voice-select">
              Voice Choice
            </label>
            <select
              id="voice-select"
              value={voiceChoice}
              onChange={e => handleVoiceSelect(e.target.value)}
              style={{
                width: "100%",
                maxWidth: "420px",
                padding: "10px 14px",
                background: "var(--surface)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {voices.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.gender}) — {v.desc}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              maxWidth: "420px",
            }}
          >
            <div>
              <strong style={{ display: "block", fontSize: "14px", color: "var(--text-primary)" }}>
                {currentVoiceObj.name}
              </strong>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                {currentVoiceObj.desc}
              </span>
            </div>
            <button
              type="button"
              onClick={() => playVoiceSample(currentVoiceObj)}
              style={{
                background: playingVoiceId === currentVoiceObj.id ? "var(--text-primary)" : "var(--surface-raised)",
                color: playingVoiceId === currentVoiceObj.id ? "var(--surface)" : "var(--text-primary)",
                border: "1px solid var(--border)",
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {playingVoiceId === currentVoiceObj.id ? "Playing..." : "Play sample"}
            </button>
          </div>
        </div>
      </section>

      {/* Theme */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div>
            <h3>Appearance</h3>
            <span className="settings-card-subtitle">Choose light, dark, or system theme</span>
          </div>
        </div>
        <div className="theme-grid" style={{ marginTop: "16px" }}>
          {themeOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`theme-option ${theme === opt.value ? "is-selected" : ""}`}
              onClick={() => onThemeChange(opt.value)}
            >
              <opt.icon size={18} />
              <strong>{opt.label}</strong>
              <span>{opt.desc}</span>
              {theme === opt.value && <Check size={14} />}
            </button>
          ))}
        </div>
      </section>

      {/* Save */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
        <Button onClick={handleSave} disabled={saving}>
          <Save size={16} />
          {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
