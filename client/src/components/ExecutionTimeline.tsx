import React from "react";
import {
  Check,
  CheckCircle2,
  Code2,
  FileSearch,
  Globe,
  LoaderCircle,
  Search,
  Sparkles,
} from "lucide-react";
import type { AgentTraceItem, ToolLogItem } from "@/hooks/useChatWorkflow";

type Props = {
  statusText: string;
  isWorking: boolean;
  steps?: string[];
  trace?: AgentTraceItem[];
  toolLogs?: ToolLogItem[];
  durationSeconds?: number;
};

function eventIcon(label: string, status: string) {
  const value = label.toLowerCase();
  if (status === "completed")
    return <CheckCircle2 size={15} className="execution-step-check" />;
  if (
    value.includes("search") ||
    value.includes("web") ||
    value.includes("browse")
  )
    return <Globe size={15} />;
  if (
    value.includes("read") ||
    value.includes("file") ||
    value.includes("inspect")
  )
    return <FileSearch size={15} />;
  if (
    value.includes("code") ||
    value.includes("python") ||
    value.includes("execute")
  )
    return <Code2 size={15} />;
  if (
    value.includes("plan") ||
    value.includes("understand") ||
    value.includes("analy")
  )
    return <Search size={15} />;
  if (value.includes("verify") || value.includes("check"))
    return <Check size={15} />;
  if (value.includes("connect") || value.includes("analy"))
    return <Sparkles size={15} />;
  return status === "running" ? (
    <LoaderCircle size={15} className="execution-spin" />
  ) : (
    <Sparkles size={15} />
  );
}

export function ExecutionTimeline({
  statusText,
  isWorking,
  steps = [],
  trace = [],
  toolLogs = [],
  durationSeconds,
}: Props) {
  const events = [
    ...steps.map((label, index) => ({
      id: `plan-${index}`,
      label,
      status: isWorking ? "pending" : "completed",
      detail: "",
    })),
    ...trace.map((item, index) => ({
      id: `trace-${index}`,
      label: item.detail || item.stage.replaceAll("_", " "),
      status: item.status === "completed" ? "completed" : "pending",
      detail: "",
    })),
    ...toolLogs.map((item, index) => ({
      id: `tool-${index}`,
      label: `${item.action.replaceAll("_", " ")} · ${item.connector}`,
      status:
        item.status === "completed"
          ? "completed"
          : item.status === "error"
            ? "failed"
            : "running",
      detail: item.durationSeconds
        ? `Completed in ${item.durationSeconds.toFixed(1)}s`
        : item.status === "running"
          ? "In progress"
          : "",
    })),
  ];
  const currentEvent = [...events].reverse().find(event => event.status === "running") || [...events].reverse()[0];
  const currentLabel = isWorking
    ? currentEvent?.label || statusText
    : currentEvent?.status === "completed"
      ? `${currentEvent.label} completed`
      : statusText;

  return (
    <section className="execution-timeline" aria-label="Agent execution activity">
      <div className="execution-timeline-toggle" role="status">
        <span className={`execution-live-mark ${isWorking ? "is-working" : "is-done"}`}>
          {eventIcon(currentLabel, isWorking ? "running" : "completed")}
        </span>
        <span className={`execution-current-label ${isWorking ? "is-shimmering" : ""}`}>
          {currentLabel}
        </span>
        {!isWorking && durationSeconds !== undefined && (
          <span className="execution-duration">{durationSeconds.toFixed(1)}s</span>
        )}
      </div>
    </section>
  );
}
