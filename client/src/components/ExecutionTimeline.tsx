import React, { useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
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
  const [open, setOpen] = useState(true);
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
  const currentLabel =
    [...events].reverse().find(event => event.status === "running")?.label ||
    (isWorking ? statusText : "Task complete");

  return (
    <section
      className="execution-timeline"
      aria-label="Agent execution activity"
    >
      <button
        className="execution-timeline-toggle"
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
      >
        <span
          className={`execution-live-mark ${isWorking ? "is-working" : "is-done"}`}
        >
          {isWorking ? (
            eventIcon(currentLabel, "running")
          ) : (
            <CheckCircle2 size={16} />
          )}
        </span>
        <span
          className={`execution-current-label ${isWorking ? "is-shimmering" : ""}`}
        >
          {isWorking ? statusText : "Work completed"}
        </span>
        {!isWorking && durationSeconds !== undefined && (
          <span className="execution-duration">
            {durationSeconds.toFixed(1)}s
          </span>
        )}
        <ChevronDown
          size={16}
          className={`execution-chevron ${open ? "is-open" : ""}`}
        />
      </button>
      {open && (
        <div className="execution-event-list">
          {events.length === 0 ? (
            <div className="execution-event is-active">
              <span className="execution-event-icon">
                {eventIcon(statusText, "running")}
              </span>
              <span className={isWorking ? "is-shimmering" : ""}>
                {statusText}
              </span>
            </div>
          ) : (
            events.map(event => (
              <div
                className={`execution-event ${event.status === "running" ? "is-active" : ""}`}
                key={event.id}
              >
                <span
                  className={`execution-event-icon ${event.status === "completed" ? "is-complete" : ""}`}
                >
                  {eventIcon(event.label, event.status)}
                </span>
                <span
                  className={`execution-event-label ${event.status === "running" ? "is-shimmering" : ""}`}
                >
                  {event.label}
                </span>
                {event.detail && (
                  <span className="execution-event-detail">{event.detail}</span>
                )}
              </div>
            ))
          )}
          {steps.length === 0 &&
            trace.length === 0 &&
            toolLogs.length === 0 &&
            !isWorking && (
              <div className="execution-event">
                <span className="execution-event-icon">
                  <Circle size={14} />
                </span>
                <span>Response ready</span>
              </div>
            )}
        </div>
      )}
    </section>
  );
}
