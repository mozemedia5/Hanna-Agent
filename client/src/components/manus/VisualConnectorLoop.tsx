import React from "react";
import { Bot, Globe, Code, FileSpreadsheet, DollarSign, Database, Sparkles } from "lucide-react";

export interface VisualConnectorLoopProps {
  agentName?: string;
  activeConnectorName: string;
  activeConnectorIcon?: React.ElementType;
  activeConnectorColor?: string;
  statusText?: string;
  isLooping?: boolean;
}

export function VisualConnectorLoop({
  agentName = "Manus AI",
  activeConnectorName,
  activeConnectorIcon: ActiveIcon = Globe,
  activeConnectorColor = "#1A73E8",
  statusText = "Communicating with integration...",
  isLooping = true,
}: VisualConnectorLoopProps) {
  return (
    <div
      className="visual-connector-loop-frame"
      style={{
        background: "var(--surface-raised, #1e1e24)",
        border: "1px solid var(--border, #2d2d38)",
        borderRadius: "14px",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        width: "100%",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
      }}
    >
      {/* 1. Agent Icon */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #1A73E8, #A142F4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 15px rgba(26, 115, 232, 0.4)",
          }}
        >
          <Bot size={22} style={{ color: "#ffffff" }} />
        </div>
        <div>
          <strong style={{ display: "block", fontSize: "13px", color: "var(--text-primary, #ffffff)" }}>
            {agentName}
          </strong>
          <span style={{ fontSize: "11px", color: "var(--text-tertiary, #707080)" }}>
            Autonomous Core
          </span>
        </div>
      </div>

      {/* 2. Animated Connection Line */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          padding: "0 12px",
        }}
      >
        <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-secondary, #9e9ea8)" }}>
          {statusText}
        </span>
        <div
          style={{
            width: "100%",
            height: "4px",
            background: "var(--surface, #141418)",
            borderRadius: "2px",
            position: "relative",
            overflow: "hidden",
            border: "1px solid var(--border, #2d2d38)",
          }}
        >
          {isLooping && (
            <div
              className="connector-pulse-bar"
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: "40%",
                background: `linear-gradient(90deg, transparent, ${activeConnectorColor}, transparent)`,
                borderRadius: "2px",
                animation: "pulseMove 1.5s infinite linear",
              }}
            />
          )}
        </div>
      </div>

      {/* 3. Targeted Integration / Connector Icon */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: `${activeConnectorColor}22`,
            border: `1px solid ${activeConnectorColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 15px ${activeConnectorColor}44`,
          }}
        >
          <ActiveIcon size={22} style={{ color: activeConnectorColor }} />
        </div>
        <div>
          <strong style={{ display: "block", fontSize: "13px", color: "var(--text-primary, #ffffff)" }}>
            {activeConnectorName}
          </strong>
          <span style={{ fontSize: "11px", color: activeConnectorColor, fontWeight: "600" }}>
            Active Integration
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulseMove {
          0% { left: -40%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
