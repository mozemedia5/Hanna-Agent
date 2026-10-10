import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Play, RotateCcw, FileSpreadsheet, Globe, CheckCircle2, Sparkles } from "lucide-react";
import { TaskComposer, OperationalProfile, ArmModeChip } from "@/components/manus/TaskComposer";
import { ActivityLogTree, LogStepNode } from "@/components/manus/ActivityLogTree";
import { VisualConnectorLoop } from "@/components/manus/VisualConnectorLoop";
import { VirtualComputerWindow, ViewportTab, CursorPosition, SandboxedFile } from "@/components/manus/VirtualComputerWindow";
import { AgentVoiceBubble } from "@/components/manus/AgentVoiceBubble";
import MarkdownMessage from "@/components/MarkdownMessage";

export default function ManusPage({ onBack }: { onBack?: () => void }) {
  const [activeTaskPrompt, setActiveTaskPrompt] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [totalTime, setTotalTime] = useState(0);

  // Live telemetry state
  const [voiceStatus, setVoiceStatus] = useState("Standing by for autonomous task assignment...");
  const [stepProgress, setStepProgress] = useState("Ready");
  const [activeConnector, setActiveConnector] = useState("Web Browser");
  const [activeConnectorIcon, setActiveConnectorIcon] = useState<any>(Globe);
  const [cursorPos, setCursorPos] = useState<CursorPosition>({ x: 50, y: 50, actionLabel: "Idle" });
  const [activeTab, setActiveTab] = useState<ViewportTab>("browser");

  // Results anchor
  const resultsRef = useRef<HTMLDivElement>(null);

  // Activity Log Tree nodes
  const [treeNodes, setTreeNodes] = useState<LogStepNode[]>([
    {
      id: "step-1",
      label: "Planner: Goal Decomposition",
      status: "completed",
      durationSeconds: 1,
      outputSummary: "Decomposed prompt into 4 sequential execution steps.",
    },
    {
      id: "step-2",
      label: "Step 1/4: Scrape Competitor & Ad Metrics",
      toolName: "Web Browser",
      status: "pending",
      durationSeconds: 2,
    },
    {
      id: "step-3",
      label: "Step 2/4: Python ROAS Statistical Analysis",
      toolName: "Python Interpreter",
      status: "pending",
      durationSeconds: 3,
    },
    {
      id: "step-4",
      label: "Step 3/4: Generate Formatted Output Spreadsheet",
      toolName: "Google Sheets Writer",
      status: "pending",
      durationSeconds: 2,
    },
    {
      id: "step-5",
      label: "Step 4/4: Critic Quality Review & Validation",
      toolName: "Critic Validator",
      status: "pending",
      durationSeconds: 1,
    },
  ]);

  const [finalMarkdownResult, setFinalMarkdownResult] = useState<string>("");

  const handleAssignTask = (task: {
    prompt: string;
    profile: OperationalProfile;
    armChips: ArmModeChip[];
    attachments: File[];
  }) => {
    setActiveTaskPrompt(task.prompt);
    setIsExecuting(true);
    setIsCompleted(false);
    setTotalTime(0);
    setFinalMarkdownResult("");

    // Simulate multi-agent execution loop with live state updates
    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      setTotalTime(tick);

      if (tick === 1) {
        setVoiceStatus("Step 1/4: Launching headless Chrome browser to inspect targets...");
        setStepProgress("Step 1/4");
        setActiveConnector("Web Browser");
        setActiveConnectorIcon(Globe);
        setCursorPos({ x: 30, y: 25, actionLabel: "Navigating URL..." });
        setActiveTab("browser");
        setTreeNodes(prev =>
          prev.map(n => (n.id === "step-2" ? { ...n, status: "running" } : n))
        );
      } else if (tick === 3) {
        setTreeNodes(prev =>
          prev.map(n =>
            n.id === "step-2"
              ? { ...n, status: "completed", outputSummary: "Scraped 12,450 campaign data rows." }
              : n.id === "step-3"
              ? { ...n, status: "running" }
              : n
          )
        );
        setVoiceStatus("Step 2/4: Running Python pandas script to compute ROAS & CPA...");
        setStepProgress("Step 2/4");
        setActiveConnector("Python Sandbox");
        setCursorPos({ x: 60, y: 45, actionLabel: "Executing Python script..." });
        setActiveTab("code");
      } else if (tick === 6) {
        setTreeNodes(prev =>
          prev.map(n =>
            n.id === "step-3"
              ? { ...n, status: "completed", outputSummary: "ROAS benchmark filter complete (3.85x)." }
              : n.id === "step-4"
              ? { ...n, status: "running" }
              : n
          )
        );
        setVoiceStatus("Step 3/4: Writing structured spreadsheet to /sandbox/output/...");
        setStepProgress("Step 3/4");
        setActiveConnector("Google Sheets");
        setActiveConnectorIcon(FileSpreadsheet);
        setCursorPos({ x: 75, y: 70, actionLabel: "Writing campaign_roi_report.csv..." });
        setActiveTab("files");
      } else if (tick === 8) {
        setTreeNodes(prev =>
          prev.map(n =>
            n.id === "step-4"
              ? { ...n, status: "completed", outputSummary: "Exported campaign_roi_report.csv." }
              : n.id === "step-5"
              ? { ...n, status: "validating" }
              : n
          )
        );
        setVoiceStatus("Step 4/4: Critic validator cross-checking spreadsheet data accuracy...");
        setStepProgress("Step 4/4");
        setCursorPos({ x: 50, y: 50, actionLabel: "Validating output..." });
      } else if (tick === 10) {
        clearInterval(interval);
        setTreeNodes(prev =>
          prev.map(n => (n.id === "step-5" ? { ...n, status: "completed", outputSummary: "Validation passed 100%." } : n))
        );
        setIsExecuting(false);
        setIsCompleted(true);
        setVoiceStatus("Task Complete. I have compiled the final spreadsheet and executive analysis below.");
        setStepProgress("Complete");

        setFinalMarkdownResult(`### Autonomous Agent Execution Summary

**Task**: "${task.prompt}"
**Profile**: ${task.profile} Mode | **Arm Chips**: ${task.armChips.length > 0 ? task.armChips.join(", ") : "None"}

#### Key Findings & Metrics
| Metric | Baseline | Optimized Value | Impact |
| :--- | :--- | :--- | :--- |
| **Total Impressions** | 1,000,000 | 1,240,500 | **+24.0%** |
| **Conversions** | 3,800 | 4,820 | **+26.8%** |
| **Average ROAS** | 2.90x | 3.85x | **+32.7%** |

#### Output Artifacts Generated
- Spreadsheet: \`/sandbox/output/campaign_roi_report.csv\` (245 KB)
- Python Script: \`/sandbox/analyze_campaigns.py\` (12 KB)
- Executive Brief: \`/sandbox/output/executive_summary.md\` (34 KB)
`);
      }
    }, 1000);
  };

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className="manus-page-container custom-scroll"
      style={{
        minHeight: "100vh",
        background: "var(--background, #0c0c0e)",
        color: "var(--text-primary, #ffffff)",
        padding: "24px 16px 40px",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              background: "var(--surface-raised, #1e1e24)",
              border: "1px solid var(--border, #2d2d38)",
              borderRadius: "10px",
              padding: "8px",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
              Manus AI Autonomous Agent Mode <Sparkles size={18} style={{ color: "#1A73E8" }} />
            </h2>
            <span style={{ fontSize: "12px", color: "var(--text-tertiary, #707080)" }}>
              Hierarchical Planner ➔ Tool Executor ➔ Critic Validator
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gap: "24px" }}>
        {/* Section 1: Task Design Composer */}
        <TaskComposer onAssignTask={handleAssignTask} isExecuting={isExecuting} />

        {/* Section 2: Agent Voice / Status Bubble */}
        {(isExecuting || isCompleted) && (
          <AgentVoiceBubble
            statusText={voiceStatus}
            stepProgressText={stepProgress}
            isComplete={isCompleted}
            onSkipToResults={scrollToResults}
          />
        )}

        {/* Section 3: Visual Connector Loop & Activity Log Tree */}
        {(isExecuting || isCompleted) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <VisualConnectorLoop
              agentName="Manus AI"
              activeConnectorName={activeConnector}
              activeConnectorIcon={activeConnectorIcon}
              statusText={voiceStatus}
              isLooping={isExecuting}
            />
            <ActivityLogTree
              goalTitle={activeTaskPrompt}
              nodes={treeNodes}
              totalDurationSeconds={totalTime}
            />
          </div>
        )}

        {/* Section 4: Virtual Computer Screen Mirror */}
        {(isExecuting || isCompleted) && (
          <VirtualComputerWindow
            appName="Manus AI"
            cursorPos={cursorPos}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}

        {/* Section 5: Final Output Results */}
        {finalMarkdownResult && (
          <div
            ref={resultsRef}
            style={{
              background: "var(--surface-raised, #1e1e24)",
              border: "1px solid #34A853",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "#34A853" }}>
              <CheckCircle2 size={20} />
              <strong style={{ fontSize: "16px" }}>Final Result Delivered</strong>
            </div>
            <MarkdownMessage content={finalMarkdownResult} />
          </div>
        )}
      </div>
    </div>
  );
}
