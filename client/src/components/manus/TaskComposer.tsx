import React, { useState, useRef } from "react";
import {
  Plus,
  ArrowUp,
  FileText,
  Presentation,
  Palette,
  Clock,
  Search,
  Code,
  FileSpreadsheet,
  Globe,
  DollarSign,
  TrendingUp,
  X,
  Paperclip,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export type OperationalProfile = "Lite" | "Pro" | "Max";

export type ArmModeChip = "Slides" | "Design" | "Meeting Minutes" | "Market Research" | "Code Analysis";

export interface SuggestedConnectorCard {
  id: string;
  connectorName: string;
  connectorIcon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  outcome: string;
  promptTemplate: string;
}

export const SUGGESTED_CONNECTOR_CARDS: SuggestedConnectorCard[] = [
  {
    id: "sheets-roi",
    connectorName: "Google Sheets",
    connectorIcon: FileSpreadsheet,
    iconBg: "rgba(15, 157, 88, 0.15)",
    iconColor: "#0F9D58",
    title: "Google Sheets Analytics",
    outcome: "Analyze ad campaign ROI and export performance spreadsheet",
    promptTemplate: "Connect to Google Sheets, pull recent Facebook & Google Ads conversion data, compute ROI metrics, and export a formatted performance summary sheet.",
  },
  {
    id: "fb-ads",
    connectorName: "Facebook Ads",
    connectorIcon: TrendingUp,
    iconBg: "rgba(24, 119, 242, 0.15)",
    iconColor: "#1877F2",
    title: "Meta Ads Optimization",
    outcome: "Analyze ad campaigns, compute ROAS, and generate creative recommendations",
    promptTemplate: "Analyze my Facebook ad campaigns for the past 30 days. Identify high-CPA ad sets and output actionable creative optimization recommendations.",
  },
  {
    id: "stripe-audit",
    connectorName: "Stripe",
    connectorIcon: DollarSign,
    iconBg: "rgba(99, 91, 255, 0.15)",
    iconColor: "#635BFF",
    title: "Stripe Financial Audit",
    outcome: "Audit monthly subscriber retention and flag high-churn customer cohorts",
    promptTemplate: "Audit my Stripe subscription billing metrics for Q3. Calculate MRR churn, identify subscriber drops, and build a cohort retention breakdown.",
  },
  {
    id: "web-browser",
    connectorName: "Web Browser",
    connectorIcon: Globe,
    iconBg: "rgba(26, 115, 232, 0.15)",
    iconColor: "#1A73E8",
    title: "Competitive Intelligence",
    outcome: "Scrape competitor pricing pages and build a market comparison report",
    promptTemplate: "Browse competitor pricing pages across top 5 ecommerce platforms, extract plan tiers and features, and synthesize a market comparison matrix.",
  },
];

interface TaskComposerProps {
  onAssignTask: (task: {
    prompt: string;
    profile: OperationalProfile;
    armChips: ArmModeChip[];
    attachments: File[];
  }) => void;
  isExecuting?: boolean;
}

export function TaskComposer({ onAssignTask, isExecuting = false }: TaskComposerProps) {
  const [prompt, setPrompt] = useState("");
  const [profile, setProfile] = useState<OperationalProfile>("Pro");
  const [activeArmChips, setActiveArmChips] = useState<ArmModeChip[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableArmChips: { label: ArmModeChip; icon: React.ElementType; color: string }[] = [
    { label: "Slides", icon: Presentation, color: "#EA4335" },
    { label: "Design", icon: Palette, color: "#A142F4" },
    { label: "Meeting Minutes", icon: Clock, color: "#FBBC04" },
    { label: "Market Research", icon: Search, color: "#1A73E8" },
    { label: "Code Analysis", icon: Code, color: "#34A853" },
  ];

  const toggleArmChip = (chip: ArmModeChip) => {
    setActiveArmChips(prev =>
      prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleTaskSubmit = () => {
    if (!prompt.trim() && attachments.length === 0) return;
    onAssignTask({
      prompt: prompt.trim(),
      profile,
      armChips: activeArmChips,
      attachments,
    });
    setPrompt("");
    setAttachments([]);
    setPlusMenuOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTaskSubmit();
    }
  };

  return (
    <div className="manus-task-composer-container" style={{ width: "100%", maxWidth: "900px", margin: "0 auto" }}>
      {/* Task Assignment Bar Frame */}
      <div
        className="manus-composer-frame"
        style={{
          background: "var(--surface-raised, #1e1e24)",
          border: "1px solid var(--border, #2d2d38)",
          borderRadius: "16px",
          padding: "16px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
          position: "relative",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        {/* Top Control Header: Profile Selector + Active Arm Chips */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          {/* Operational Profiles Button Group */}
          <div
            className="operational-profile-selector"
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "var(--surface, #141418)",
              border: "1px solid var(--border, #2d2d38)",
              borderRadius: "10px",
              padding: "3px",
              gap: "2px",
            }}
          >
            {(["Lite", "Pro", "Max"] as OperationalProfile[]).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setProfile(p)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "7px",
                  fontSize: "12px",
                  fontWeight: profile === p ? "700" : "500",
                  color: profile === p ? "#FFFFFF" : "var(--text-secondary, #9e9ea8)",
                  background:
                    profile === p
                      ? p === "Max"
                        ? "linear-gradient(135deg, #1A73E8, #A142F4)"
                        : "var(--gemini-accent, #1A73E8)"
                      : "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {p === "Max" && <Sparkles size={11} style={{ marginRight: "4px", display: "inline-block" }} />}
                {p}
              </button>
            ))}
          </div>

          {/* Mode Indicator Badge */}
          <div
            style={{
              fontSize: "11px",
              color: "var(--text-tertiary, #707080)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: "600",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: isExecuting ? "#34A853" : "var(--gemini-accent, #1A73E8)",
              }}
            />
            {isExecuting ? "Agent Executing..." : "Task Assignment Composer"}
          </div>
        </div>

        {/* Arm Mode Chips Row */}
        <div
          className="arm-mode-chips-row"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "12px",
          }}
        >
          {availableArmChips.map(chip => {
            const isActive = activeArmChips.includes(chip.label);
            const IconComponent = chip.icon;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => toggleArmChip(chip.label)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 11px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: isActive ? "600" : "500",
                  border: `1px solid ${isActive ? chip.color : "var(--border, #2d2d38)"}`,
                  background: isActive ? `${chip.color}22` : "var(--surface, #141418)",
                  color: isActive ? chip.color : "var(--text-secondary, #9e9ea8)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <IconComponent size={13} style={{ color: isActive ? chip.color : "inherit" }} />
                <span>{chip.label}</span>
                {isActive && <CheckCircle2 size={12} style={{ marginLeft: "2px" }} />}
              </button>
            );
          })}
        </div>

        {/* Attachment Files Preview Badges */}
        {attachments.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
            {attachments.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  background: "var(--surface, #141418)",
                  border: "1px solid var(--border, #2d2d38)",
                  fontSize: "12px",
                  color: "var(--text-primary, #ffffff)",
                }}
              >
                <Paperclip size={13} style={{ color: "var(--gemini-accent, #1A73E8)" }} />
                <span>{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-tertiary, #707080)",
                    cursor: "pointer",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Task Composer Input Row */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", position: "relative" }}>
          {/* '+' Attachment Menu Button */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setPlusMenuOpen(p => !p)}
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: plusMenuOpen ? "var(--gemini-accent, #1A73E8)" : "var(--surface, #141418)",
                border: "1px solid var(--border, #2d2d38)",
                color: plusMenuOpen ? "#ffffff" : "var(--text-primary, #ffffff)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Add attachment or activate arm mode"
            >
              <Plus size={18} />
            </button>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileUpload}
              multiple
            />

            {/* '+' Attachment Menu Popover */}
            {plusMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 8px)",
                  left: 0,
                  width: "240px",
                  background: "var(--surface-raised, #1e1e24)",
                  border: "1px solid var(--border, #2d2d38)",
                  borderRadius: "12px",
                  padding: "10px",
                  boxShadow: "0 12px 30px rgba(0, 0, 0, 0.4)",
                  zIndex: 100,
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-tertiary, #707080)", padding: "4px 8px", textTransform: "uppercase" }}>
                  Inject Context
                </div>
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setPlusMenuOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-primary, #ffffff)",
                    fontSize: "13px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <Paperclip size={15} style={{ color: "var(--gemini-accent, #1A73E8)" }} />
                  <span>Attach External Files</span>
                </button>
                <div style={{ height: "1px", background: "var(--border, #2d2d38)", margin: "6px 0" }} />
                <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-tertiary, #707080)", padding: "4px 8px", textTransform: "uppercase" }}>
                  Toggle Arm Chips
                </div>
                {availableArmChips.map(chip => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      toggleArmChip(chip.label);
                      setPlusMenuOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      background: activeArmChips.includes(chip.label) ? "rgba(26, 115, 232, 0.12)" : "transparent",
                      border: "none",
                      color: "var(--text-primary, #ffffff)",
                      fontSize: "13px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <chip.icon size={15} style={{ color: chip.color }} />
                    <span>{chip.label} Mode</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Task Placeholder Textarea */}
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Assign a task or ask anything..."
            rows={2}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary, #ffffff)",
              fontSize: "14px",
              lineHeight: "1.5",
              resize: "none",
              padding: "4px 0",
              fontFamily: "inherit",
            }}
          />

          {/* Submit Task Action Button */}
          <button
            type="button"
            onClick={handleTaskSubmit}
            disabled={!prompt.trim() && attachments.length === 0}
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: prompt.trim() || attachments.length > 0 ? "var(--gemini-accent, #1A73E8)" : "var(--surface, #141418)",
              border: "1px solid var(--border, #2d2d38)",
              color: prompt.trim() || attachments.length > 0 ? "#ffffff" : "var(--text-tertiary, #707080)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: prompt.trim() || attachments.length > 0 ? "pointer" : "not-allowed",
              transition: "all 0.15s ease",
            }}
            title="Assign task to Manus Agent"
          >
            <ArrowUp size={18} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      {/* Suggested Connector Cards Section */}
      <div style={{ marginTop: "24px" }}>
        <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-secondary, #9e9ea8)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
          Suggested Autonomous Integrations
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
          }}
        >
          {SUGGESTED_CONNECTOR_CARDS.map(card => {
            const IconComponent = card.connectorIcon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  setPrompt(card.promptTemplate);
                  onAssignTask({
                    prompt: card.promptTemplate,
                    profile: "Pro",
                    armChips: activeArmChips,
                    attachments,
                  });
                }}
                style={{
                  background: "var(--surface-raised, #1e1e24)",
                  border: "1px solid var(--border, #2d2d38)",
                  borderRadius: "12px",
                  padding: "14px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--gemini-accent, #1A73E8)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--border, #2d2d38)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: card.iconBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconComponent size={18} style={{ color: card.iconColor }} />
                  </div>
                  <div>
                    <strong style={{ display: "block", fontSize: "13px", color: "var(--text-primary, #ffffff)" }}>
                      {card.connectorName}
                    </strong>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary, #707080)" }}>
                      {card.title}
                    </span>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary, #9e9ea8)", lineHeight: "1.4" }}>
                  "{card.outcome}"
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
