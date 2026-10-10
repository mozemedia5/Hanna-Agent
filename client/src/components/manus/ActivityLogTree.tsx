import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Terminal,
  FileCode,
  Globe,
  Database,
  Layers,
  ArrowRight,
} from "lucide-react";

export interface LogStepNode {
  id: string;
  label: string;
  toolName?: string;
  toolIcon?: React.ElementType;
  status: "pending" | "running" | "validating" | "completed" | "failed";
  durationSeconds?: number;
  outputSummary?: string;
  subSteps?: LogStepNode[];
  details?: string;
}

interface ActivityLogTreeProps {
  goalTitle: string;
  nodes: LogStepNode[];
  totalDurationSeconds?: number;
}

export function ActivityLogTree({ goalTitle, nodes, totalDurationSeconds }: ActivityLogTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ root: true });

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusBadge = (status: LogStepNode["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={15} style={{ color: "#34A853" }} />;
      case "running":
        return <Clock size={15} className="animate-spin" style={{ color: "#1A73E8" }} />;
      case "validating":
        return <Clock size={15} className="animate-pulse" style={{ color: "#FBBC04" }} />;
      case "failed":
        return <AlertCircle size={15} style={{ color: "#EA4335" }} />;
      default:
        return <Clock size={15} style={{ color: "#707080" }} />;
    }
  };

  const renderNode = (node: LogStepNode, depth = 0) => {
    const isExpanded = expandedNodes[node.id] ?? true;
    const hasChildren = node.subSteps && node.subSteps.length > 0;

    return (
      <div key={node.id} style={{ marginLeft: `${depth * 16}px`, marginTop: "8px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            background: "var(--surface-raised, #1e1e24)",
            border: "1px solid var(--border, #2d2d38)",
            borderRadius: "10px",
            fontSize: "13px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
            {hasChildren && (
              <button
                type="button"
                onClick={() => toggleExpand(node.id)}
                style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", padding: 0 }}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}

            {getStatusBadge(node.status)}

            <span style={{ fontWeight: "600", color: "var(--text-primary, #ffffff)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {node.label}
            </span>

            {node.toolName && (
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  background: "rgba(26, 115, 232, 0.15)",
                  color: "#1A73E8",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {node.toolName}
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            {node.durationSeconds !== undefined && (
              <span style={{ fontSize: "11px", color: "var(--text-tertiary, #707080)" }}>
                {node.durationSeconds}s
              </span>
            )}
          </div>
        </div>

        {/* Node details or output summary */}
        {node.outputSummary && isExpanded && (
          <div
            style={{
              marginLeft: "24px",
              marginTop: "4px",
              padding: "6px 10px",
              background: "var(--surface, #141418)",
              borderLeft: "2px solid #1A73E8",
              borderRadius: "0 6px 6px 0",
              fontSize: "12px",
              color: "var(--text-secondary, #9e9ea8)",
            }}
          >
            {node.outputSummary}
          </div>
        )}

        {/* Sub-steps rendering */}
        {hasChildren && isExpanded && (
          <div style={{ borderLeft: "1px dashed var(--border, #2d2d38)", marginLeft: "12px", paddingLeft: "8px" }}>
            {node.subSteps!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="activity-log-tree-container"
      style={{
        background: "var(--surface, #141418)",
        border: "1px solid var(--border, #2d2d38)",
        borderRadius: "14px",
        padding: "16px",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Layers size={16} style={{ color: "#1A73E8" }} />
          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "var(--text-primary, #ffffff)" }}>
            Activity Log Tree
          </h4>
        </div>

        {totalDurationSeconds !== undefined && (
          <span style={{ fontSize: "11px", color: "var(--text-tertiary, #707080)", fontWeight: "600" }}>
            Total elapsed: {totalDurationSeconds}s
          </span>
        )}
      </div>

      <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary, #9e9ea8)", marginBottom: "8px" }}>
        Goal: "{goalTitle}"
      </div>

      <div className="activity-tree-list">
        {nodes.map(node => renderNode(node, 0))}
      </div>
    </div>
  );
}
