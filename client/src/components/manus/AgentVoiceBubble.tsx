import React from "react";
import { Volume2, ArrowDownCircle, Bot, Sparkles, CheckCircle2 } from "lucide-react";

interface AgentVoiceBubbleProps {
  statusText: string;
  stepProgressText?: string;
  isComplete?: boolean;
  onSkipToResults?: () => void;
}

export function AgentVoiceBubble({
  statusText = "Step 2/4: Reading competitor pricing pages and extracting tier features...",
  stepProgressText = "Step 2/4",
  isComplete = false,
  onSkipToResults,
}: AgentVoiceBubbleProps) {
  return (
    <div
      className="agent-voice-bubble-container"
      style={{
        background: "var(--surface-raised, #1e1e24)",
        border: `1px solid ${isComplete ? "#34A853" : "var(--border, #2d2d38)"}`,
        borderRadius: "14px",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        width: "100%",
        boxShadow: "0 4px 18px rgba(0, 0, 0, 0.2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
        {/* Agent Avatar Badge */}
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: isComplete ? "#34A853" : "var(--gemini-accent, #1A73E8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isComplete ? (
            <CheckCircle2 size={18} style={{ color: "#ffffff" }} />
          ) : (
            <Bot size={18} style={{ color: "#ffffff" }} />
          )}
        </div>

        {/* Task-Oriented Speech Content */}
        <div style={{ overflow: "hidden" }}>
          {stepProgressText && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: isComplete ? "#34A853" : "var(--gemini-accent, #1A73E8)",
                display: "block",
                marginBottom: "2px",
              }}
            >
              {isComplete ? "Task Complete" : stepProgressText}
            </span>
          )}
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              fontWeight: "600",
              color: "var(--text-primary, #ffffff)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {statusText}
          </p>
        </div>
      </div>

      {/* Prominent "Skip to Results" Action Button */}
      {onSkipToResults && (
        <button
          type="button"
          onClick={onSkipToResults}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "8px",
            background: "var(--surface, #141418)",
            border: "1px solid var(--border, #2d2d38)",
            color: "var(--text-primary, #ffffff)",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "var(--gemini-accent, #1A73E8)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "var(--border, #2d2d38)";
          }}
        >
          <ArrowDownCircle size={14} style={{ color: "var(--gemini-accent, #1A73E8)" }} />
          <span>Skip to Results</span>
        </button>
      )}
    </div>
  );
}
