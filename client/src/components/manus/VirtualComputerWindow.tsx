import React, { useState } from "react";
import {
  Globe,
  Code2,
  Terminal,
  FolderTree,
  MousePointer2,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Play,
  RotateCcw,
} from "lucide-react";

export type ViewportTab = "browser" | "code" | "terminal" | "files";

export interface CursorPosition {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  actionLabel?: string;
}

export interface SandboxedFile {
  name: string;
  size: string;
  path: string;
  updatedAt: string;
  type: "spreadsheet" | "code" | "document";
}

interface VirtualComputerWindowProps {
  appName?: string;
  cursorPos?: CursorPosition;
  activeTab?: ViewportTab;
  onTabChange?: (tab: ViewportTab) => void;
  browserUrl?: string;
  browserContentHtml?: string;
  codeSnippet?: string;
  terminalLogs?: string[];
  sandboxedFiles?: SandboxedFile[];
}

export function VirtualComputerWindow({
  appName = "Hanna",
  cursorPos = { x: 45, y: 35, actionLabel: "Filling search input..." },
  activeTab: controlledTab,
  onTabChange,
  browserUrl = "https://analytics.google.com/dashboard/campaigns",
  browserContentHtml = `<div style="padding:20px; font-family:sans-serif; color:#ffffff;">
    <h3 style="color:#1A73E8; margin-top:0;">Ad Campaign Analytics Dashboard</h3>
    <p style="color:#9e9ea8; font-size:13px;">Analyzing Q3 Campaign ROI, CPC & Conversion Benchmarks...</p>
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-top:16px;">
      <div style="background:#141418; padding:12px; border-radius:8px; border:1px solid #2d2d38;">
        <span style="font-size:11px; color:#707080;">Total Impressions</span>
        <h4 style="margin:4px 0 0; font-size:18px;">1,240,500</h4>
      </div>
      <div style="background:#141418; padding:12px; border-radius:8px; border:1px solid #2d2d38;">
        <span style="font-size:11px; color:#707080;">Conversions</span>
        <h4 style="margin:4px 0 0; font-size:18px; color:#34A853;">4,820</h4>
      </div>
      <div style="background:#141418; padding:12px; border-radius:8px; border:1px solid #2d2d38;">
        <span style="font-size:11px; color:#707080;">Avg. ROAS</span>
        <h4 style="margin:4px 0 0; font-size:18px; color:#1A73E8;">3.85x</h4>
      </div>
    </div>
  </div>`,
  codeSnippet = `import pandas as pd
import numpy as np

# Load ad campaign dataset
df = pd.read_csv("/sandbox/q3_ad_data.csv")
print("[INFO] Computing ROI and CPC metrics across ad sets...")

df['ROAS'] = df['Revenue'] / df['Spend']
high_roas_campaigns = df[df['ROAS'] >= 3.0]
high_roas_campaigns.to_csv("/sandbox/output/campaign_roi_report.csv", index=False)
print(f"[SUCCESS] Exported {len(high_roas_campaigns)} top campaign rows to spreadsheet.")`,
  terminalLogs = [
    "$ python3 /sandbox/analyze_campaigns.py",
    "[INFO] Initializing Python 3.11 isolated execution container...",
    "[INFO] Reading dataset /sandbox/q3_ad_data.csv (12,450 records)...",
    "[SUCCESS] ROAS threshold calculated (3.85x average).",
    "[FS_WRITE] File created: /sandbox/output/campaign_roi_report.csv",
  ],
  sandboxedFiles = [
    { name: "campaign_roi_report.csv", size: "245 KB", path: "/sandbox/output/", updatedAt: "Just now", type: "spreadsheet" },
    { name: "analyze_campaigns.py", size: "12 KB", path: "/sandbox/", updatedAt: "2 mins ago", type: "code" },
    { name: "executive_summary.md", size: "34 KB", path: "/sandbox/output/", updatedAt: "Just now", type: "document" },
  ],
}: VirtualComputerWindowProps) {
  const [internalTab, setInternalTab] = useState<ViewportTab>("browser");
  const tab = controlledTab ?? internalTab;

  const setTab = (newTab: ViewportTab) => {
    setInternalTab(newTab);
    onTabChange?.(newTab);
  };

  return (
    <div
      className="virtual-computer-window-frame"
      style={{
        background: "#0c0c0e",
        border: "1px solid var(--border, #2d2d38)",
        borderRadius: "16px",
        overflow: "hidden",
        width: "100%",
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* OS Top Bar Frame */}
      <div
        style={{
          background: "#16161b",
          borderBottom: "1px solid var(--border, #2d2d38)",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Mac-style Window Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#EA4335" }} />
            <span style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#FBBC04" }} />
            <span style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#34A853" }} />
          </div>

          <span style={{ fontSize: "12px", fontWeight: "700", color: "#ffffff", marginLeft: "8px" }}>
            {appName}'s Computer Window
          </span>
        </div>

        {/* Viewport Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#0c0c0e", borderRadius: "8px", padding: "2px" }}>
          <button
            type="button"
            onClick={() => setTab("browser")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: tab === "browser" ? "600" : "400",
              background: tab === "browser" ? "#1A73E8" : "transparent",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Globe size={13} /> Browser
          </button>

          <button
            type="button"
            onClick={() => setTab("code")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: tab === "code" ? "600" : "400",
              background: tab === "code" ? "#1A73E8" : "transparent",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Code2 size={13} /> Python Code
          </button>

          <button
            type="button"
            onClick={() => setTab("terminal")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: tab === "terminal" ? "600" : "400",
              background: tab === "terminal" ? "#1A73E8" : "transparent",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Terminal size={13} /> Terminal
          </button>

          <button
            type="button"
            onClick={() => setTab("files")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: tab === "files" ? "600" : "400",
              background: tab === "files" ? "#1A73E8" : "transparent",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
            }}
          >
            <FolderTree size={13} /> Files
          </button>
        </div>
      </div>

      {/* Main Computer Screen Stage */}
      <div
        style={{
          position: "relative",
          minHeight: "260px",
          maxHeight: "340px",
          overflowY: "auto",
          padding: "16px",
          background: "#0c0c0e",
        }}
      >
        {/* Simulated Virtual Cursor */}
        <div
          style={{
            position: "absolute",
            top: `${cursorPos.y}%`,
            left: `${cursorPos.x}%`,
            zIndex: 50,
            transition: "all 0.4s ease-out",
            pointerEvents: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <MousePointer2 size={18} style={{ color: "#1A73E8", fill: "#1A73E8", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))" }} />
            {cursorPos.actionLabel && (
              <span
                style={{
                  background: "#1A73E8",
                  color: "#ffffff",
                  fontSize: "10px",
                  fontWeight: "700",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
                }}
              >
                {cursorPos.actionLabel}
              </span>
            )}
          </div>
        </div>

        {/* Browser Tab Content */}
        {tab === "browser" && (
          <div>
            {/* Browser Address Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#16161b",
                padding: "6px 12px",
                borderRadius: "8px",
                marginBottom: "12px",
                border: "1px solid var(--border, #2d2d38)",
                fontSize: "12px",
                color: "#9e9ea8",
              }}
            >
              <Globe size={14} style={{ color: "#1A73E8" }} />
              <span style={{ color: "#ffffff", fontFamily: "monospace" }}>{browserUrl}</span>
            </div>
            {/* Render Browser HTML Viewport */}
            <div dangerouslySetInnerHTML={{ __html: browserContentHtml }} />
          </div>
        )}

        {/* Code Sandbox Tab Content */}
        {tab === "code" && (
          <div>
            <div style={{ fontSize: "11px", color: "#707080", marginBottom: "8px", fontFamily: "monospace" }}>
              /sandbox/analyze_campaigns.py (Python 3.11 Runtime)
            </div>
            <pre
              style={{
                background: "#141418",
                border: "1px solid var(--border, #2d2d38)",
                borderRadius: "8px",
                padding: "12px",
                color: "#34A853",
                fontSize: "12px",
                fontFamily: "monospace",
                lineHeight: "1.5",
                margin: 0,
                overflowX: "auto",
              }}
            >
              <code>{codeSnippet}</code>
            </pre>
          </div>
        )}

        {/* Terminal Logs Tab Content */}
        {tab === "terminal" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <Terminal size={14} style={{ color: "#1A73E8" }} />
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#9e9ea8" }}>Sandboxed Container Console</span>
            </div>
            <div
              style={{
                background: "#141418",
                border: "1px solid var(--border, #2d2d38)",
                borderRadius: "8px",
                padding: "12px",
                fontFamily: "monospace",
                fontSize: "12px",
                lineHeight: "1.6",
                color: "#ffffff",
              }}
            >
              {terminalLogs.map((log, i) => (
                <div key={i} style={{ color: log.includes("SUCCESS") ? "#34A853" : log.includes("INFO") ? "#1A73E8" : "#9e9ea8" }}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sandboxed Files Tab Content */}
        {tab === "files" && (
          <div>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#ffffff", marginBottom: "10px" }}>
              Output Directory (/sandbox/output/)
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              {sandboxedFiles.map(file => (
                <div
                  key={file.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: "#141418",
                    border: "1px solid var(--border, #2d2d38)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {file.type === "spreadsheet" ? (
                      <FileSpreadsheet size={16} style={{ color: "#0F9D58" }} />
                    ) : file.type === "code" ? (
                      <Code2 size={16} style={{ color: "#1A73E8" }} />
                    ) : (
                      <FileText size={16} style={{ color: "#A142F4" }} />
                    )}
                    <span style={{ fontWeight: "600", color: "#ffffff" }}>{file.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#707080", fontSize: "11px" }}>
                    <span>{file.size}</span>
                    <span>{file.updatedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
