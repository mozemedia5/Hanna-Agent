import React, { useEffect, useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Plus,
  Search,
  Trash2,
  Zap,
  PlugZap,
  ChevronDown,
  X,
  ImageIcon,
  Upload,
} from "lucide-react";
import { getFirebaseIdToken } from "@/_core/hooks/useAuth";
import { integrations, type IntegrationDefinition } from "@shared/integrations";
import { renderBrandIcon } from "@/components/ProviderIcons";

type ScheduleTaskPageProps = {
  onBack?: () => void;
  onNavigateToIntegrations?: () => void;
};

export type ScheduledTask = {
  id: string;
  title: string;
  prompt: string;
  executionTime: string;
  repeat: "once" | "daily" | "weekly" | "monthly";
  tools: string[];
  imageUrl?: string;
  status: "scheduled" | "executing" | "completed" | "cancelled";
  createdAt: string;
};

// Helper to append real workspace notification to localStorage
export function pushWorkspaceNotification(title: string, body: string, category: string = "Scheduled Task") {
  try {
    const raw = localStorage.getItem("hanna_notifications");
    const existing = raw ? JSON.parse(raw) : [];
    const newNotif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title,
      body,
      category,
      date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    localStorage.setItem("hanna_notifications", JSON.stringify([newNotif, ...existing]));
  } catch {
    // Ignore storage issues
  }
}

export default function ScheduleTaskPage({ onBack, onNavigateToIntegrations }: ScheduleTaskPageProps) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPrompt, setTaskPrompt] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskRepeat, setTaskRepeat] = useState<"once" | "daily" | "weekly" | "monthly">("once");
  const [selectedConnectors, setSelectedConnectors] = useState<string[]>([]);
  const [connectorDropdownOpen, setConnectorDropdownOpen] = useState(false);
  const [connectorSearch, setConnectorSearch] = useState("");

  // Image Attachment State for Scheduled Task
  const [taskImageUrl, setTaskImageUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);
  const [executionModalResult, setExecutionModalResult] = useState<{ title: string; result: string } | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2800);
  };

  // Fetch real connected credentials from server
  useEffect(() => {
    const fetchConnected = async () => {
      try {
        const token = await getFirebaseIdToken();
        const response = await fetch("/api/trpc/integrations.listCredentials?batch=1", {
          credentials: "include",
          headers: { ...(token ? { authorization: `Bearer ${token}` } : {}) },
        });
        if (!response.ok) return;
        const payload = await response.json();
        const records = payload?.[0]?.result?.data?.json;
        if (Array.isArray(records)) {
          const ids = records.map((r: { connector: string }) => r.connector);
          setConnectedIds(ids);
          if (ids.length > 0 && selectedConnectors.length === 0) {
            setSelectedConnectors([ids[0]]);
          }
        }
      } catch {
        // Fallback default connected tools if offline
      }
    };
    void fetchConnected();
  }, []);

  // Fetch existing scheduled tasks
  const loadTasks = async () => {
    try {
      const token = await getFirebaseIdToken();
      const response = await fetch("/api/trpc/hanna.listScheduledTasks?batch=1", {
        headers: {
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) return;
      const payload = await response.json();
      const rawTasks = payload?.[0]?.result?.data?.json?.tasks;
      if (Array.isArray(rawTasks)) {
        const mapped = rawTasks.map((t: any) => ({
          id: t.id,
          title: t.title || "Scheduled Task",
          prompt: t.description || t.parameters?.prompt || "",
          executionTime: t.parameters?.executionTime || t.executionTime || t.nextRunAt || "Soon",
          repeat: t.repeat || t.parameters?.repeat || "once",
          tools: t.tools || t.parameters?.tools || [],
          imageUrl: t.imageUrl || t.parameters?.imageUrl,
          status: t.status || "scheduled",
          createdAt: t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }));
        setScheduledTasks(mapped);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    void loadTasks();
  }, []);

  // Filtered ONLY real connected connectors
  const realConnectedConnectors = useMemo(() => {
    return integrations.filter((i: IntegrationDefinition) => connectedIds.includes(i.id));
  }, [connectedIds]);

  const filteredConnected = useMemo(() => {
    if (!connectorSearch.trim()) return realConnectedConnectors;
    const q = connectorSearch.toLowerCase();
    return realConnectedConnectors.filter(
      (c: IntegrationDefinition) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    );
  }, [realConnectedConnectors, connectorSearch]);

  const toggleConnector = (id: string) => {
    setSelectedConnectors(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
    setConnectorDropdownOpen(false);
  };

  // Handle Task Image Upload
  const handleTaskImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setTaskImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleScheduleTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskPrompt.trim()) {
      showToast("Please enter a title and task instructions.");
      return;
    }
    setSubmitting(true);
    try {
      const token = await getFirebaseIdToken();
      const isoExecutionTime = taskDate ? new Date(taskDate).toISOString() : new Date().toISOString();

      const response = await fetch("/api/trpc/hanna.scheduleTask?batch=1", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          "0": {
            json: {
              title: taskTitle.trim(),
              prompt: taskPrompt.trim(),
              executionTime: isoExecutionTime,
              repeat: taskRepeat,
              tools: selectedConnectors,
              imageUrl: taskImageUrl || undefined,
            },
          },
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = payload?.[0]?.error?.json?.message || payload?.error || "Failed to schedule task";
        throw new Error(errorMsg);
      }

      const createdServerTask = payload?.[0]?.result?.data?.json?.task;
      if (!createdServerTask) {
        throw new Error("Server returned invalid response for scheduled task.");
      }

      showToast(`Task "${taskTitle.trim()}" scheduled successfully!`);

      pushWorkspaceNotification(
        `Task Scheduled: ${taskTitle.trim()}`,
        `Scheduled for ${taskDate || "immediate execution"} using ${selectedConnectors.join(", ") || "standard operator tools"}.`,
        "Scheduled Task"
      );

      const newTask: ScheduledTask = {
        id: createdServerTask.id,
        title: createdServerTask.title,
        prompt: createdServerTask.description || taskPrompt.trim(),
        executionTime: createdServerTask.parameters?.executionTime || createdServerTask.executionTime || taskDate || "Scheduled",
        repeat: createdServerTask.repeat || taskRepeat,
        tools: createdServerTask.tools || [...selectedConnectors],
        imageUrl: createdServerTask.imageUrl || taskImageUrl || undefined,
        status: createdServerTask.status || "scheduled",
        createdAt: createdServerTask.createdAt ? new Date(createdServerTask.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setScheduledTasks(prev => [newTask, ...prev]);

      setTaskTitle("");
      setTaskPrompt("");
      setTaskDate("");
      setTaskImageUrl(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error scheduling task";
      showToast(`Error: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "28px 24px" }}>
      {/* Hidden image uploader input */}
      <input
        type="file"
        ref={imageInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleTaskImageUpload}
      />

      {/* Navigation Header */}
      <div style={{ marginBottom: "24px" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            fontWeight: "600",
            color: "var(--gemini-accent)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            marginBottom: "12px",
            padding: 0,
          }}
        >
          <ArrowLeft size={16} /> Back to Workspace
        </button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: ".08em",
                color: "var(--text-tertiary)",
                marginBottom: "4px",
              }}
            >
              Automated Operator Workflows
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
              <Calendar size={26} style={{ color: "var(--gemini-accent)" }} />
              Schedule Task
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-secondary)", maxWidth: "600px" }}>
              Create timed or recurring autonomous tasks powered by Hanna and your real workspace connectors.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={onNavigateToIntegrations}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", borderRadius: "10px", fontSize: "13px", fontWeight: "600" }}
          >
            <PlugZap size={15} /> Manage Connectors
          </Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        {/* Left Column: Schedule Task Form */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "22px",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Zap size={18} style={{ color: "var(--gemini-accent)" }} />
            New Scheduled Task
          </h2>

          <form onSubmit={handleScheduleTask} style={{ display: "grid", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>
                Task Name / Title
              </label>
              <input
                type="text"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                placeholder="e.g. Daily Inventory & Sales Report Sync"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>
                Action Prompt / Operator Instructions
              </label>
              <textarea
                value={taskPrompt}
                onChange={e => setTaskPrompt(e.target.value)}
                placeholder="Describe exactly what Hanna should execute, query, or report on..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  resize: "vertical",
                }}
                required
              />
            </div>

            {/* Task Image Attachment Option */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>
                Reference Asset / Image Attachment (Optional)
              </label>
              {taskImageUrl ? (
                <div style={{ position: "relative", display: "inline-block", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border)" }}>
                  <img src={taskImageUrl} alt="Task asset" style={{ width: "120px", height: "80px", objectFit: "cover", display: "block" }} />
                  <button
                    type="button"
                    onClick={() => setTaskImageUrl(null)}
                    style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", borderRadius: "50%", padding: "2px", cursor: "pointer" }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 12px",
                    background: "var(--surface-raised)",
                    border: "1px dashed var(--border)",
                    borderRadius: "10px",
                    color: "var(--text-secondary)",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  <ImageIcon size={14} style={{ color: "var(--gemini-accent)" }} /> Add Image Attachment
                </button>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Execution Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={taskDate}
                  onChange={e => setTaskDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 10px",
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Repeat Schedule
                </label>
                <select
                  value={taskRepeat}
                  onChange={e => setTaskRepeat(e.target.value as any)}
                  style={{
                    width: "100%",
                    padding: "9px 10px",
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                  }}
                >
                  <option value="once">Once</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            {/* REAL Workspace Connectors Selector with Search */}
            <div style={{ position: "relative" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px" }}>
                Connected Connectors
              </label>

              <button
                type="button"
                onClick={() => setConnectorDropdownOpen(o => !o)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {selectedConnectors.length === 0 ? (
                    <span style={{ color: "var(--text-tertiary)" }}>Select real workspace connectors...</span>
                  ) : (
                    selectedConnectors.map(id => {
                      const found = integrations.find((i: IntegrationDefinition) => i.id === id);
                      return (
                        <span
                          key={id}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: "6px",
                            padding: "2px 8px",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        >
                          {found ? renderBrandIcon(found.id, 13) : <PlugZap size={13} />}
                          <span>{found?.name || id}</span>
                        </span>
                      );
                    })
                  )}
                </div>
                <ChevronDown size={15} style={{ color: "var(--text-tertiary)" }} />
              </button>

              {/* Dropdown Menu with Search Bar */}
              {connectorDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "10px",
                    boxShadow: "0 10px 28px rgba(0,0,0,0.3)",
                    maxHeight: "320px",
                    overflowY: "auto",
                  }}
                >
                  {/* Search Bar inside connectors dropdown */}
                  <div style={{ position: "relative", marginBottom: "10px" }}>
                    <Search
                      size={14}
                      style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-tertiary)" }}
                    />
                    <input
                      type="text"
                      value={connectorSearch}
                      onChange={e => setConnectorSearch(e.target.value)}
                      placeholder="Search connected or add new connector..."
                      style={{
                        width: "100%",
                        padding: "8px 10px 8px 32px",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--text-primary)",
                        fontSize: "12px",
                      }}
                      autoFocus
                    />
                  </div>

                  <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "6px" }}>
                    Connected Workspace Plugins
                  </div>

                  {filteredConnected.length === 0 ? (
                    <div style={{ padding: "12px 8px", textAlign: "center" }}>
                      <p style={{ fontSize: "12px", color: "var(--text-tertiary)", margin: "0 0 8px" }}>
                        No connected plugins found. Connect plugins first in the Plugin Store to schedule tasks.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setConnectorDropdownOpen(false);
                          onNavigateToIntegrations?.();
                        }}
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "var(--gemini-accent)",
                          background: "var(--wash)",
                          border: "1px solid var(--border)",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          cursor: "pointer",
                        }}
                      >
                        Go to Plugin Store &rarr;
                      </button>
                    </div>
                  ) : (
                    filteredConnected.map((connector: IntegrationDefinition) => {
                      const isSelected = selectedConnectors.includes(connector.id);
                      return (
                        <button
                          key={connector.id}
                          type="button"
                          onClick={() => toggleConnector(connector.id)}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            background: isSelected ? "var(--wash)" : "transparent",
                            border: "none",
                            color: "var(--text-primary)",
                            cursor: "pointer",
                            fontSize: "12px",
                            textAlign: "left",
                            marginBottom: "2px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {renderBrandIcon(connector.id, 16)}
                            <div>
                              <strong style={{ display: "block", fontSize: "12px" }}>{connector.name}</strong>
                              <span style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>{connector.category}</span>
                            </div>
                          </div>
                          {isSelected && <Check size={14} style={{ color: "var(--gemini-accent)" }} />}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={submitting}
              style={{
                background: "var(--gemini-accent)",
                color: "var(--ink-contrast)",
                fontWeight: "600",
                borderRadius: "10px",
                marginTop: "6px",
                padding: "10px",
              }}
            >
              {submitting ? "Scheduling..." : "Schedule Workflow Task"}
            </Button>
          </form>
        </div>

        {/* Right Column: Scheduled Tasks History & Status */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "700", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={18} style={{ color: "var(--gemini-accent)" }} />
              Scheduled Workflows ({scheduledTasks.length})
            </h2>
          </div>

          {scheduledTasks.length === 0 ? (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "32px 20px",
                textAlign: "center",
                color: "var(--text-secondary)",
              }}
            >
              <Calendar size={32} style={{ color: "var(--text-tertiary)", marginBottom: "10px" }} />
              <strong style={{ display: "block", fontSize: "14px", color: "var(--text-primary)" }}>No Scheduled Tasks Yet</strong>
              <p style={{ margin: "4px 0 0", fontSize: "12px" }}>
                Use the form on the left to schedule your first automated task.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {scheduledTasks.map(task => (
                <div
                  key={task.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "14px",
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {task.imageUrl && (
                        <img src={task.imageUrl} alt="" style={{ width: "44px", height: "44px", borderRadius: "8px", objectFit: "cover" }} />
                      )}
                      <div>
                        <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>{task.title}</strong>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", fontSize: "11px", color: "var(--text-tertiary)" }}>
                          <span>Schedule: {task.executionTime}</span>
                          <span>•</span>
                          <span style={{ textTransform: "capitalize" }}>Repeat: {task.repeat}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        textTransform: "uppercase",
                        letterSpacing: ".04em",
                        background:
                          task.status === "scheduled"
                            ? "rgba(26, 115, 232, 0.15)"
                            : task.status === "completed"
                            ? "rgba(15, 157, 88, 0.15)"
                            : "rgba(234, 67, 53, 0.15)",
                        color:
                          task.status === "scheduled"
                            ? "var(--gemini-accent)"
                            : task.status === "completed"
                            ? "#0f9d58"
                            : "#ea4335",
                      }}
                    >
                      {task.status}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: "0 0 12px",
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      background: "var(--surface-raised)",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      lineHeight: "1.4",
                    }}
                  >
                    "{task.prompt}"
                  </p>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {task.tools.map(t => (
                        <span
                          key={t}
                          style={{
                            fontSize: "11px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "var(--wash)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        type="button"
                        disabled={executingTaskId === task.id}
                        onClick={async () => {
                          setExecutingTaskId(task.id);
                          try {
                            const token = await getFirebaseIdToken();
                            const response = await fetch("/api/trpc/hanna.executeScheduledTaskNow?batch=1", {
                              method: "POST",
                              headers: {
                                "content-type": "application/json",
                                ...(token ? { authorization: `Bearer ${token}` } : {}),
                              },
                              body: JSON.stringify({
                                "0": {
                                  json: { taskId: task.id },
                                },
                              }),
                            });

                            const payload = await response.json().catch(() => null);
                            if (!response.ok) {
                              const errorMsg = payload?.[0]?.error?.json?.message || payload?.error || "Execution failed";
                              throw new Error(errorMsg);
                            }

                            const resText = payload?.[0]?.result?.data?.json?.result || "Task executed successfully by AI.";
                            const updatedTask = payload?.[0]?.result?.data?.json?.task;

                            setScheduledTasks(prev =>
                              prev.map(st => (st.id === task.id ? { ...st, status: updatedTask?.status || "completed" } : st))
                            );

                            pushWorkspaceNotification(
                              `Task Report: ${task.title}`,
                              `AI Execution Report: ${resText.slice(0, 150)}...`,
                              "Task Report"
                            );

                            setExecutionModalResult({ title: task.title, result: resText });
                          } catch (err) {
                            const msg = err instanceof Error ? err.message : "Task execution error.";
                            showToast(`Error: ${msg}`);
                          } finally {
                            setExecutingTaskId(null);
                          }
                        }}
                        style={{
                          background: "var(--gemini-accent)",
                          color: "var(--ink-contrast)",
                          border: "none",
                          borderRadius: "6px",
                          padding: "4px 8px",
                          fontSize: "11px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Zap size={12} /> {executingTaskId === task.id ? "Running AI..." : "Run AI Now"}
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const token = await getFirebaseIdToken();
                            const response = await fetch("/api/trpc/hanna.cancelScheduledTask?batch=1", {
                              method: "POST",
                              headers: {
                                "content-type": "application/json",
                                ...(token ? { authorization: `Bearer ${token}` } : {}),
                              },
                              body: JSON.stringify({
                                "0": {
                                  json: { taskId: task.id },
                                },
                              }),
                            });

                            const payload = await response.json().catch(() => null);
                            if (!response.ok) {
                              const errorMsg = payload?.[0]?.error?.json?.message || payload?.error || "Failed to cancel task";
                              throw new Error(errorMsg);
                            }

                            setScheduledTasks(prev => prev.filter(st => st.id !== task.id));
                            showToast("Task cancelled successfully");
                          } catch (err) {
                            const msg = err instanceof Error ? err.message : "Failed to cancel task";
                            showToast(`Error: ${msg}`);
                          }
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#ea4335",
                          cursor: "pointer",
                          fontSize: "12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Trash2 size={13} /> Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {executionModalResult && (
        <div className="modal-overlay" onClick={() => setExecutionModalResult(null)}>
          <div className="modal-content" style={{ maxWidth: "560px", padding: "24px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                <Zap size={18} style={{ color: "var(--gemini-accent)" }} /> AI Task Execution Result
              </h3>
              <button onClick={() => setExecutionModalResult(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}>
                <X size={16} />
              </button>
            </div>
            <strong style={{ display: "block", fontSize: "14px", color: "var(--text-primary)", marginBottom: "8px" }}>
              {executionModalResult.title}
            </strong>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "14px",
                fontSize: "13px",
                color: "var(--text-primary)",
                maxHeight: "300px",
                overflowY: "auto",
                whiteSpace: "pre-wrap",
                lineHeight: "1.5",
              }}
            >
              {executionModalResult.result}
            </div>
            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={() => setExecutionModalResult(null)} style={{ background: "var(--gemini-accent)", color: "#ffffff" }}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="hanna-toast">
          <Check size={15} /> {toast}
        </div>
      )}
    </div>
  );
}
