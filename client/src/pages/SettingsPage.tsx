/*
 * Settings Page — Workspace personalization only
 * Hanna name, persona context, descriptions, and theme.
 */
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
          <span className="eyebrow">Workspace</span>
          <h1 className="page-title">Settings</h1>
          <p className="page-description">
            Personalize how Hanna works for you. Set your workspace name,
            context, and how Hanna should respond.
          </p>
        </div>
      </div>

      {/* Workspace Name & Identity */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-icon">
            <User size={18} />
          </div>
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

      {/* Hanna Persona */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-icon accent">
            <Sparkles size={18} />
          </div>
          <div>
            <h3>Hanna Persona & Context</h3>
            <span className="settings-card-subtitle">
              Pick the context Hanna should use and how she should respond
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

      {/* Appearance */}
      <section className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-icon">
            {theme === "dark" ? (
              <Moon size={18} />
            ) : theme === "light" ? (
              <Sun size={18} />
            ) : (
              <Monitor size={18} />
            )}
          </div>
          <div>
            <h3>Appearance</h3>
            <span className="settings-card-subtitle">
              Choose how Hanna looks on your device
            </span>
          </div>
        </div>
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
      </section>

      {/* Save */}
      <div className="settings-save-bar">
        <Button
          onClick={handleSave}
          disabled={saving || !profile.displayName.trim()}
          className="settings-save-button"
        >
          {saved ? (
            <>
              <Check size={16} /> Saved
            </>
          ) : saving ? (
            "Saving..."
          ) : (
            <>
              <Save size={16} /> Save settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
