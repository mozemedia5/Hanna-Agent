import React, { useState, useEffect } from "react";
import { Globe, Code2, ShoppingBag, MessageSquare, FileText, Wrench, Sparkles, Check } from "lucide-react";

export type ToolStatusInfo = {
  connector?: string;
  action?: string;
  query?: string;
  status?: "running" | "completed" | "error";
  startTime?: number;
  endTime?: number;
  durationSeconds?: number;
};

type Props = {
  toolInfo?: ToolStatusInfo;
  isStreaming?: boolean;
};

export function getToolIcon(connector?: string, action?: string, isRunning = false) {
  const c = (connector || "").toLowerCase();
  const a = (action || "").toLowerCase();

  let Icon = Sparkles;
  if (c.includes("search") || c.includes("web") || a.includes("search") || a.includes("google")) {
    Icon = Globe;
  } else if (c.includes("python") || c.includes("code") || a.includes("code") || a.includes("script") || a.includes("python")) {
    Icon = Code2;
  } else if (c.includes("shopify") || c.includes("store") || c.includes("product")) {
    Icon = ShoppingBag;
  } else if (c.includes("slack") || c.includes("mail") || c.includes("gmail") || c.includes("message")) {
    Icon = MessageSquare;
  } else if (c.includes("drive") || c.includes("doc") || c.includes("sheet") || c.includes("file")) {
    Icon = FileText;
  } else {
    Icon = Wrench;
  }

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${isRunning ? "animate-spin" : ""}`}
      style={{ display: "inline-flex", alignItems: "center" }}
    >
      <Icon size={14} style={{ color: "var(--gemini-accent, #3b82f6)" }} />
    </span>
  );
}

export function getToolFeedbackText(connector?: string, action?: string, query?: string): string {
  const c = (connector || "").toLowerCase();
  const a = (action || "").toLowerCase();

  if (query) return `Searching for "${query}"...`;
  if (c.includes("python") || c.includes("code") || a.includes("python")) return "Executing Python script...";
  if (c.includes("shopify")) return "Searching Shopify store data...";
  if (c.includes("slack")) return "Connecting to Slack workspace...";
  if (c.includes("gmail") || c.includes("mail")) return "Retrieving Gmail threads...";
  if (c.includes("drive") || c.includes("workspace")) return "Searching Google Drive & Workspace...";
  if (c.includes("search") || c.includes("web") || a.includes("search")) return "Searching the web...";

  if (connector && action) return `Executing ${connector} ${action.replaceAll("_", " ")}...`;
  return "Analyzing results & context...";
}

export function ToolExecutionStatusBlock({ toolInfo, isStreaming }: Props) {
  const isRunning = Boolean(isStreaming || toolInfo?.status === "running");
  const [elapsed, setElapsed] = useState<number>(() => toolInfo?.durationSeconds || 0);

  useEffect(() => {
    if (!isRunning) {
      if (toolInfo?.durationSeconds !== undefined) {
        setElapsed(toolInfo.durationSeconds);
      }
      return;
    }

    const start = toolInfo?.startTime || Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const sec = Number(((now - start) / 1000).toFixed(1));
      setElapsed(sec);
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, toolInfo?.startTime, toolInfo?.durationSeconds]);

  if (!toolInfo && !isStreaming) return null;

  const connector = toolInfo?.connector || "Web Search";
  const action = toolInfo?.action || "search";
  const query = toolInfo?.query;

  return (
    <div
      className="tool-execution-status-block"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 12px",
        borderRadius: "8px",
        background: "var(--surface-raised, rgba(255,255,255,0.05))",
        border: "1px solid var(--border, rgba(255,255,255,0.1))",
        fontSize: "12px",
        color: "var(--text-secondary, #9ca3af)",
        margin: "6px 0 10px 0",
      }}
    >
      {getToolIcon(connector, action, isRunning)}

      <span style={{ fontWeight: 500 }}>
        {isRunning
          ? getToolFeedbackText(connector, action, query)
          : `Worked for ${(elapsed || toolInfo?.durationSeconds || 0.8).toFixed(1)} seconds`}
      </span>

      {!isRunning && (
        <Check size={12} style={{ color: "var(--emerald-500, #10b981)", marginLeft: "2px" }} />
      )}
    </div>
  );
}

export default ToolExecutionStatusBlock;
